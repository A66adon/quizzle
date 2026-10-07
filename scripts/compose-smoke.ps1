$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$base = 'http://localhost:18080'
$compose = @('compose', '-p', 'quizzle-smoke', '-f', 'docker-compose.yml', '-f', 'scripts/compose-smoke.yml')

function Invoke-Compose {
    & docker @compose @args
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed (exit $LASTEXITCODE)" }
}

function Wait-Health {
    $deadline = (Get-Date).AddSeconds(120)
    do {
        try {
            $health = Invoke-RestMethod "$base/health" -TimeoutSec 5
            if ($health.status -eq 'UP') { return }
        } catch [System.Net.Http.HttpRequestException] {
            # The listening socket can be unavailable while the app restarts.
        } catch [System.Net.WebException] {
            # Windows PowerShell reports connection failures using WebException.
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw 'Application did not become healthy'
}

function Get-Csrf($session) {
    Invoke-WebRequest "$base/login" -WebSession $session -UseBasicParsing | Out-Null
    $token = $session.Cookies.GetCookies([uri]$base)['XSRF-TOKEN'].Value
    if (!$token) { throw 'Missing CSRF cookie' }
    return $token
}

try {
    Invoke-Compose up -d --build
    Wait-Health
    Invoke-WebRequest "$base/register" -UseBasicParsing | Out-Null
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $username = 'smoke-' + [guid]::NewGuid().ToString('N').Substring(0, 16)
    $password = 'Smoke-test-' + [guid]::NewGuid().ToString('N')
    $token = Get-Csrf $session
    Invoke-WebRequest "$base/register" -Method Post -WebSession $session -UseBasicParsing `
        -Headers @{'X-XSRF-TOKEN' = $token} -Body @{username = $username; password = $password} | Out-Null
    $settings = Invoke-RestMethod "$base/admin/api/account/settings" -WebSession $session
    if ($settings.username -ne $username) { throw 'Account was not created' }
    Invoke-Compose restart quizzle
    Wait-Health
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $token = Get-Csrf $session
    Invoke-WebRequest "$base/login" -Method Post -WebSession $session -UseBasicParsing `
        -Headers @{'X-XSRF-TOKEN' = $token} -Body @{username = $username; password = $password} | Out-Null
    $settings = Invoke-RestMethod "$base/admin/api/account/settings" -WebSession $session
    if ($settings.username -ne $username) { throw 'Account did not survive restart' }
    Write-Output 'Compose account persistence smoke passed'
} finally {
    Invoke-Compose down --volumes --remove-orphans
}
