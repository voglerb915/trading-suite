# Automatische OneDrive- und Benutzerpfaderkennung
$UserProfile = [Environment]::GetFolderPath("UserProfile")
$OneDrivePath = Join-Path $UserProfile "OneDrive"
$TradingSuitePath = Join-Path $OneDrivePath "Boerse/trading-suite"

# Pfade für Backend, Frontend, Dashboard
$BackendPath = Join-Path $TradingSuitePath "backend"
$FrontendPath = Join-Path $TradingSuitePath "frontend"
$DashboardPath = Join-Path $OneDrivePath "Boerse/mein-dashboard"

# Windows Terminal finden
$wt = (Get-Command wt.exe -ErrorAction SilentlyContinue).Source

if (-not $wt) {
    Write-Host "wt.exe wurde nicht gefunden." -ForegroundColor Red
    exit
}


# BACKEND TAB
& $wt -w 0 new-tab --title "Backend" --tabColor "#00C853" powershell -NoExit -Command "
while (`$true) {
    try {
        cd $BackendPath
        # Wir ignorieren den kompletten db-Ordner für den Watcher
        npx nodemon server.js --ignore db/
    }
    catch {
        Write-Host 'Backend abgestuerzt...' -ForegroundColor Red
        Start-Sleep -Seconds 2
    }
}
"

Start-Sleep -Milliseconds 500

Write-Host "Warte auf Backend Port 4000..." -ForegroundColor Yellow
while (-not (Test-NetConnection -ComputerName localhost -Port 4000 -InformationLevel Quiet)) {
    Start-Sleep -Milliseconds 300
}

# FRONTEND TAB
& $wt -w 0 new-tab --title "Frontend" --tabColor "#2962FF" powershell -NoExit -Command "
cd 'C:/Users/Nutzer/OneDrive/Boerse/trading-suite/frontend'
$host.UI.RawUI.WindowTitle = 'Frontend'

while (`$true) {
    try {
        cd $FrontendPath
        npx vite

    }
    catch {
        Write-Host 'Frontend abgestuerzt - Neustart in 2 Sekunden...' -ForegroundColor Red
        Start-Sleep -Seconds 2
    }
    $host.UI.RawUI.WindowTitle = 'Frontend'
}
"

Start-Sleep -Milliseconds 500

# DASHBOARD TAB
& $wt -w 0 new-tab --title "Dashboard" --tabColor "#FF8F00" powershell -NoExit -Command "
while (`$true) {
    try {
        cd $DashboardPath
        node server.js

    }
    catch {
        Write-Host 'Dashboard abgestuerzt - Neustart in 2 Sekunden...' -ForegroundColor Red
        Start-Sleep -Seconds 2
    }
}
"

Write-Host "Alle Tabs gestartet." -ForegroundColor Green
