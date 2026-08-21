$ErrorActionPreference = 'Stop'
$base = 'http://localhost:18080'
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Invoke-WebRequest -Uri "$base/admin/login" -Method Post -WebSession $s -Body @{ password = 'local-test-password-1234' } | Out-Null

$closed = Invoke-RestMethod -Uri "$base/admin/api/sessions" -Method Post -WebSession $s -ContentType 'application/json' -Body '{"quizFileName":"safety-basics.yaml"}'
$kept = Invoke-RestMethod -Uri "$base/admin/api/sessions" -Method Post -WebSession $s -ContentType 'application/json' -Body '{"quizFileName":"safety-basics.yaml"}'
Invoke-RestMethod -Uri "$base/admin/api/sessions/$($closed.codehash)/commands" -Method Post -WebSession $s -ContentType 'application/json' -Body '{"command":"ABORT"}' | Out-Null
Write-Output "aborted=$($closed.codehash) kept=$($kept.codehash)"

docker restart quizzle-test | Out-Null
$deadline = (Get-Date).AddSeconds(90)
do {
    Start-Sleep -Milliseconds 1000
    $log = (docker logs quizzle-test 2>&1 | Out-String)
} while (($log -split 'Started QuizApplication').Count -lt 3 -and (Get-Date) -lt $deadline)

$s2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri "$base/admin/login" -Method Post -WebSession $s2 -Body @{ password = 'local-test-password-1234' } | Out-Null
$list = Invoke-RestMethod -Uri "$base/admin/api/sessions" -WebSession $s2
Write-Output "restored sessions: $(@($list).Count)"
foreach ($item in @($list)) { Write-Output "  $($item.codehash) $($item.state)" }
Write-Output ($log -split "`n" | Where-Object { $_ -match 'Session registry ready' } | Select-Object -Last 1)
