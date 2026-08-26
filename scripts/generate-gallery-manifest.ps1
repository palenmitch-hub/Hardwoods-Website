$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$galleryDir = Join-Path $repoRoot 'images\gallery'
$outputFile = Join-Path $galleryDir 'gallery-manifest.json'

$supportedExtensions = @('.jpg', '.jpeg', '.png', '.webp')

# Root-level files are legacy/uncategorized and are treated as "boards".
# Drop new photos into boards/, chairs/, or other-projects/ to categorize them.
$subfolders = @(
  @{ Dir = ''; Category = 'boards' },
  @{ Dir = 'boards'; Category = 'boards' },
  @{ Dir = 'chairs'; Category = 'chairs' },
  @{ Dir = 'other-projects'; Category = 'other' }
)

function Get-GalleryImageNames {
  param([string]$Path)
  if (-not (Test-Path -Path $Path)) { return @() }
  return Get-ChildItem -Path $Path -File |
    Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object { $_.Name }
}

$manifest = [ordered]@{ boards = @(); chairs = @(); other = @() }

foreach ($folder in $subfolders) {
  $dirPath = if ($folder.Dir) { Join-Path $galleryDir $folder.Dir } else { $galleryDir }
  $names = Get-GalleryImageNames -Path $dirPath
  if ($folder.Dir) {
    $names = $names | ForEach-Object { "$($folder.Dir)/$_" }
  }
  $manifest[$folder.Category] = @($manifest[$folder.Category]) + @($names)
}

$json = $manifest | ConvertTo-Json -Depth 3
Set-Content -Path $outputFile -Value $json -NoNewline
Add-Content -Path $outputFile -Value ''

$total = $manifest.boards.Count + $manifest.chairs.Count + $manifest.other.Count
Write-Host "Wrote $total item(s) to $(Resolve-Path -Relative $outputFile)"
Write-Host "  boards: $($manifest.boards.Count), chairs: $($manifest.chairs.Count), other: $($manifest.other.Count)"
