$content = [System.IO.File]::ReadAllText('e:/node/enbonadmin/frontend/src/views/Employees.vue', [System.Text.Encoding]::UTF8)
$lines = $content -split "`n"
Write-Host "Line 629:" $lines[628].Trim()
Write-Host "Line 661:" $lines[660].Trim()
Write-Host "Line 790:" $lines[789].Trim()
