# Builds everything a store submission needs into dist/store/:
#   logo.png (300x300), promo.png (440x280), screenshot-*.png (1280x800),
#   and pip-prompting-<version>.zip with manifest.json at the top level.
# Screenshots need the dev harness running first: npm run dev
param([string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe")

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = Join-Path $root "dist\store"
New-Item -ItemType Directory -Force $out | Out-Null

function Shot($url, $size, $file) {
  & $Chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
    "--window-size=$size" --virtual-time-budget=8000 "--screenshot=$(Join-Path $out $file)" $url 2>$null | Out-Null
  Write-Output "wrote dist/store/$file"
}

$art = "file:///" + ((Join-Path $root "docs\publishing\assets\art.html") -replace '\\', '/')
Shot "${art}?kind=logo" "300,300" "logo.png"
Shot "${art}?kind=promo" "440,280" "promo.png"

$i = 1
foreach ($demo in "result", "home", "draft", "pairs") {
  Shot "http://localhost:5179/dev/harness.html?demo=$demo" "1280,800" "screenshot-$i-$demo.png"
  $i++
}

$version = (Get-Content (Join-Path $root "extension\manifest.json") -Raw | ConvertFrom-Json).version
$zip = Join-Path $out "pip-prompting-$version.zip"
if (Test-Path $zip) { Remove-Item $zip -Confirm:$false }
# Not Compress-Archive: on Windows PowerShell 5.1 it writes backslashes into entry
# names, which extension stores reject. Entries must use forward slashes.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$ext = (Resolve-Path (Join-Path $root "extension")).Path
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  Get-ChildItem $ext -Recurse -File | ForEach-Object {
    $entry = $_.FullName.Substring($ext.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entry) | Out-Null
  }
} finally { $archive.Dispose() }
Write-Output "wrote dist/store/pip-prompting-$version.zip"
