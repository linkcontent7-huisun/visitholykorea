# 앱의 모든 화면을 차례로 열어 스크린샷을 한 폴더에 모은다.
# 디자인 정합성(헤더·하단 탭·여백·글자 크기가 화면마다 같은가)을 한눈에 비교하려는 용도.
#
# 전제: chrome-cdp.ps1 로 CDP Chrome 이 떠 있어야 한다.
# 사용:  .\scripts\browser\shoot-all.ps1                       # 배포본, 전체 화면
#        .\scripts\browser\shoot-all.ps1 -Base http://localhost:5173
#        .\scripts\browser\shoot-all.ps1 -Only menu,faq         # 일부만
#        .\scripts\browser\shoot-all.ps1 -Extra /sites/절두산  # 목록에 없는 주소 추가
#
# 결과: screenshots/<날짜-시각>/<화면이름>.png  (폴더는 git 에 올리지 않는다)
param(
  [string]$Base = 'https://visitholykorea-app.vercel.app',
  [int]$Port = 9222,
  [string[]]$Only,
  [string[]]$Extra,
  [switch]$FullPage
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 화면 목록. 경로의 기준은 src/app/routes/paths.ts — 거기 새 화면이 생기면 여기도 더한다.
# 값이 있는 경로(성지 상세·지역·코스 상세)는 대표 하나씩만 넣는다.
$pages = [ordered]@{
  home         = '/'
  map          = '/map'
  explore      = '/explore'
  records      = '/records'
  menu         = '/menu'
  search       = '/search'
  login        = '/login'
  compass      = '/compass'
  nearby       = '/nearby'
  routes       = '/routes'
  alternatives = '/alternatives'
  festivals    = '/festivals'
  faq          = '/faq'
  terms        = '/terms'
  region       = '/region/' + [uri]::EscapeDataString('대전')
}

try { Invoke-RestMethod "http://127.0.0.1:$Port/json/version" -TimeoutSec 2 | Out-Null }
catch { throw "CDP Chrome 이 없다. 먼저 .\scripts\browser\chrome-cdp.ps1 을 실행." }

$stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
$out = Join-Path $PSScriptRoot "..\..\screenshots\$stamp"
New-Item -ItemType Directory -Force $out | Out-Null
$out = (Resolve-Path $out).Path

$targets = @()
foreach ($k in $pages.Keys) {
  if ($Only -and $Only -notcontains $k) { continue }
  $targets += @{ name = $k; path = $pages[$k] }
}
$i = 0
foreach ($e in $Extra) { $i++; $targets += @{ name = "extra$i"; path = $e } }

$fpArgs = if ($FullPage) { @('--full-page') } else { @() }
foreach ($t in $targets) {
  $url = "$Base$($t.path)"
  agent-browser --cdp $Port open $url 2>&1 | Out-Null
  # SPA 라 주소만 바뀌고 그리기는 뒤에 온다. 네트워크가 잠잠해질 때까지 기다린다.
  agent-browser --cdp $Port wait --load networkidle 2>&1 | Out-Null
  Start-Sleep -Milliseconds 800
  $file = Join-Path $out "$($t.name).png"
  agent-browser --cdp $Port screenshot $file @fpArgs 2>&1 | Out-Null
  "{0,-14} {1}" -f $t.name, $url
}
""
"저장: $out"
# 네이티브 명령의 stderr 가 마지막 종료 코드를 오염시키지 않도록 명시한다.
exit 0
