$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$availableDir = Join-Path $repoRoot 'images\products\available'
$outputFile = Join-Path $availableDir 'inventory-manifest.json'

$pattern = '^(?<name>.+)-(?<price>\d+(?:\.\d{1,2})?)-(?<qty>\d+)-(?<product>[A-Za-z0-9]+)(?:-(?<image>\d+))?\.(?:jpe?g|png|webp)$'
$supportedExtensions = @('.jpg', '.jpeg', '.png', '.webp')

$allImageFiles = Get-ChildItem -Path $availableDir -File |
  Where-Object {
    $ext = $_.Extension.ToLowerInvariant()
    $supportedExtensions -contains $ext
  }

$validFiles = $allImageFiles |
  Where-Object {
    $_.Name -match $pattern
  }

$invalidFiles = $allImageFiles |
  Where-Object {
    $_.Name -notmatch $pattern
  }

$files = $validFiles |
  Sort-Object {
    if ($_.Name -match $pattern) {
      $imageIndex = 1
      if ($Matches.image) {
        $imageIndex = [int]$Matches.image
      }
      '{0}|{1}' -f [string]$Matches.product, $imageIndex.ToString('0000')
    } else {
      $_.Name
    }
  } |
  ForEach-Object {
    $_.Name
  }

$json = $files | ConvertTo-Json
if ($null -eq $json) {
  $json = '[]'
}

Set-Content -Path $outputFile -Value $json -Encoding UTF8
Write-Host "Wrote $($files.Count) item(s) to images/products/available/inventory-manifest.json"

if ($invalidFiles.Count -gt 0) {
  Write-Warning "Skipped $($invalidFiles.Count) file(s) with invalid naming format."
  Write-Host 'Expected format: name-price-quantity-product#[-image#].jpg'
  Write-Host 'Examples: Walnut with Wenge and Maple Stripe-100-1-0001.jpg'
  Write-Host '          Walnut with Wenge and Maple Stripe-100-1-0001-02.jpg'
  Write-Host 'Skipped files:'
  $invalidFiles | ForEach-Object { Write-Host " - $($_.Name)" }
}
