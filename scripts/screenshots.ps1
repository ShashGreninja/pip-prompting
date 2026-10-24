# Renders README/store screenshots from the dev harness with headless Chrome.
# Start the harness first (npm run dev), then: powershell -File scripts/screenshots.ps1
param(
  [string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$Size = "1280,800"
)
$out = Join-Path $PSScriptRoot "..\docs\images"
New-Item -ItemType Directory -Force $out | Out-Null
foreach ($demo in "home", "result", "draft", "pairs") {
  $file = Join-Path (Resolve-Path $out) "$demo.png"
  & $Chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
    "--window-size=$Size" --virtual-time-budget=8000 "--screenshot=$file" `
    "http://localhost:5179/dev/harness.html?demo=$demo" 2>$null | Out-Null
  Write-Output "wrote docs/images/$demo.png"
}
