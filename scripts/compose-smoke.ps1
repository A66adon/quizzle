$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$base = 'http://localhost:18080'
$mail = 'http://localhost:18025'
$compose = @('compose', '-p', 'quizzle-smoke', '--profile', 'dev', '-f', 'docker-compose.yml', '-f', 'scripts/compose-smoke.yml')
$oldDatabasePassword = $env:POSTGRES_PASSWORD
$env:POSTGRES_PASSWORD = 'smoke-' + [guid]::NewGuid().ToString('N')
$started = $false

function Invoke-Compose {
    & docker @compose @args
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed (exit $LASTEXITCODE)" }
}

function Wait-Health {
    $deadline = (Get-Date).AddSeconds(120)
    do {
        try {
            $health = Invoke-RestMethod "$base/health" -TimeoutSec 5
            if ($health.status -eq 'UP') {
                Invoke-RestMethod "$mail/api/v1/messages" -TimeoutSec 5 | Out-Null
                return
            }
        } catch [System.Net.Http.HttpRequestException] {
            if ($_.Exception.PSObject.Properties['Response'] -and $_.Exception.Response `
                -and [int]$_.Exception.Response.StatusCode -ne 503) { throw }
            # The listening socket can be unavailable while the app restarts.
        } catch [System.Net.WebException] {
            # Windows PowerShell reports connection failures using WebException.
        } catch [System.Threading.Tasks.TaskCanceledException] {
            # Readiness requests have a bounded timeout while startup is in progress.
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw 'Application or Mailpit did not become healthy'
}

function Get-Csrf($session) {
    Invoke-WebRequest "$base/login" -WebSession $session -UseBasicParsing | Out-Null
    $token = $session.Cookies.GetCookies([uri]$base)['XSRF-TOKEN'].Value
    if (!$token) { throw 'Missing CSRF cookie' }
    return $token
}

function Invoke-Json($method, $path, $body = $null) {
    $token = Get-Csrf $script:session
    $parameters = @{
        Uri = "$base$path"
        Method = $method
        WebSession = $script:session
        Headers = @{'X-XSRF-TOKEN' = $token}
        ContentType = 'application/json'
    }
    if ($null -ne $body) { $parameters.Body = ($body | ConvertTo-Json -Depth 12 -Compress) }
    return Invoke-RestMethod @parameters
}

function Sign-In {
    $script:session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $token = Get-Csrf $script:session
    Invoke-WebRequest "$base/login" -Method Post -WebSession $script:session -UseBasicParsing `
        -Headers @{'X-XSRF-TOKEN' = $token} -Body @{email = $email; password = $password} | Out-Null
    $settings = Invoke-Json Get '/admin/api/account/settings'
    if ($settings.email -ne $email) { throw 'Authentication failed' }
}

function Confirm-Verification {
    $deadline = (Get-Date).AddSeconds(60)
    do {
        $query = [uri]::EscapeDataString("to:$email")
        $messages = Invoke-RestMethod "$mail/api/v1/search?query=$query" -TimeoutSec 5
        if ($messages.messages.Count -gt 0) {
            $message = Invoke-RestMethod "$mail/api/v1/message/$($messages.messages[0].ID)"
            $match = [regex]::Match($message.Text, 'http://localhost:18080/verify-email\?token=[A-Za-z0-9_-]+')
            if ($match.Success) {
                Invoke-WebRequest $match.Value -UseBasicParsing | Out-Null
                return
            }
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw 'Verification mail was not captured'
}

function Assert-Markers {
    Sign-In
    $quiz = Invoke-Json Get "/admin/api/quizzes/$file"
    if ($quiz.quiz.title -ne 'Persistence smoke') { throw 'Quiz did not persist' }
    $settings = Invoke-Json Get '/admin/api/account/settings'
    if (!$settings.allowLateJoin -or $settings.autoAdvanceDelayMs -ne 7000) { throw 'Settings did not persist' }
    $game = Invoke-Json Get "/admin/api/sessions/$code"
    if ($game.state -ne 'LOBBY') { throw 'Session snapshot did not persist' }
}

try {
    $existing = & docker @compose ps -aq
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect the smoke project; is Docker running?' }
    $volumes = & docker volume ls --filter label=com.docker.compose.project=quizzle-smoke --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect smoke database volumes' }
    if ($existing -or $volumes) { throw 'An existing quizzle-smoke project or volume exists; refusing to replace it' }
    $started = $true
    Invoke-Compose up -d --build
    Wait-Health
    Invoke-WebRequest "$base/register" -UseBasicParsing | Out-Null
    $script:session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $email = 'smoke-' + [guid]::NewGuid().ToString('N').Substring(0, 16) + '@example.com'
    $password = 'Smoke-test-' + [guid]::NewGuid().ToString('N')
    $token = Get-Csrf $script:session
    Invoke-WebRequest "$base/register" -Method Post -WebSession $script:session -UseBasicParsing `
        -Headers @{'X-XSRF-TOKEN' = $token} `
        -Body @{email = $email; password = $password; passwordConfirmation = $password} | Out-Null
    Confirm-Verification
    Sign-In
    $quiz = @{
        title = 'Persistence smoke'; description = 'Restart marker'; author = 'Smoke'
        questions = @(@{
            id = 'q1'; text = 'Persisted?'; points = 1000; timeSeconds = 20
            multiple = $false; shuffleAnswers = $false
            answers = @(@{id = 'yes'; text = 'Yes'; correct = $true}, @{id = 'no'; text = 'No'; correct = $false})
        })
    }
    $created = Invoke-Json Post '/admin/api/quizzes' $quiz
    $file = $created.fileName
    if (!$file) { throw 'Quiz creation failed' }
    Invoke-Json Put '/admin/api/account/settings' @{allowLateJoin = $true; autoAdvanceDelayMs = 7000} | Out-Null
    $game = Invoke-Json Post '/admin/api/sessions' @{quizFileName = $file}
    $code = $game.codehash
    if (!$code) { throw 'Session creation failed' }
    Assert-Markers
    Invoke-Compose up -d --force-recreate --no-deps quizzle
    Wait-Health
    Assert-Markers
    Invoke-Compose down
    Invoke-Compose up -d
    Wait-Health
    Assert-Markers
    Write-Output 'Compose account, quiz, settings and snapshot persistence smoke passed'
} finally {
    try {
        if ($started) { Invoke-Compose down --volumes --remove-orphans }
    } finally {
        $env:POSTGRES_PASSWORD = $oldDatabasePassword
    }
}
