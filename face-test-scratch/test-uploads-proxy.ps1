$frontendDir = 'c:\Users\ajaym\Downloads\Ai-interviw\Ai-interviw\pyproctor-ai\frontend'
$logFile = 'c:\Users\ajaym\Downloads\Ai-interviw\Ai-interviw\pyproctor-ai\face-test-scratch\frontend-test.log'

# Start Next.js dev server in a hidden window and redirect output to log file
$proc = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendDir -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru

try {
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        $conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($conn) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Write-Host "Frontend did not start on port 3000 within 60 seconds"
        Write-Host "Last log lines:"
        Get-Content $logFile -Tail 20 -ErrorAction SilentlyContinue
        exit 1
    }

    Write-Host "Frontend ready on port 3000. Testing /uploads proxy..."
    $url = 'http://localhost:3000/uploads/candidates/1786375463026-591870970.jpg'
    try {
        $res = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 15 -ErrorAction Stop
        Write-Host "Proxy test status: $($res.StatusCode)"
        Write-Host "Content-Type: $($res.Headers['Content-Type'])"
        Write-Host "Content-Length: $($res.RawContentLength)"
        if ($res.StatusCode -eq 200 -and $res.Headers['Content-Type'] -like 'image/*') {
            Write-Host "RESULT: /uploads proxy works - candidate image served successfully"
        } else {
            Write-Host "RESULT: Unexpected response from /uploads proxy"
        }
    } catch {
        Write-Host "RESULT: /uploads proxy request failed: $($_.Exception.Message)"
        exit 1
    }
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
