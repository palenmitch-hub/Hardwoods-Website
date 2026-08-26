$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$heroDir = Join-Path $repoRoot 'images\hero'
$outputFile = Join-Path $heroDir 'hero-manifest.json'

$supportedExtensions = @('.jpg', '.jpeg', '.png', '.webp')

$files = Get-ChildItem -Path $heroDir -File |
  Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object Name |
  ForEach-Object { $_.Name }

$json = $files | ConvertTo-Json -Depth 1
if ($null -eq $files -or $files.Count -eq 0) {
  $json = '[]'
} elseif ($files.Count -eq 1) {
  $json = '[' + $json + ']'
}

Set-Content -Path $outputFile -Value $json -NoNewline
Add-Content -Path $outputFile -Value ''

Write-Host "Wrote $($files.Count) item(s) to $(Resolve-Path -Relative $outputFile)"
