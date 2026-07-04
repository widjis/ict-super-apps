$ErrorActionPreference = "Stop"

$base = Read-Host "Base URL (default: https://superapps.justanapi.my.id)"
if ([string]::IsNullOrWhiteSpace($base)) { $base = "https://superapps.justanapi.my.id" }
$base = $base.TrimEnd("/")

$username = Read-Host "Username"
$sec = Read-Host "Password" -AsSecureString
$pwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

function Invoke-Json {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$false)][hashtable]$Headers,
    [Parameter(Mandatory=$false)][string]$Body
  )
  $args = @{
    Uri = $Url
    Method = $Method
    SkipHttpErrorCheck = $true
  }
  if ($Headers) { $args.Headers = $Headers }
  if ($Body) { $args.ContentType = "application/json"; $args.Body = $Body }
  return Invoke-WebRequest @args
}

$loginBody = @{ username = $username; password = $pwd } | ConvertTo-Json
$loginResp = Invoke-Json -Method "POST" -Url "$base/api/auth/login" -Body $loginBody

if ($loginResp.StatusCode -ne 200) {
  Write-Host "Login failed: $($loginResp.StatusCode)"
  Write-Host $loginResp.Content
  exit 1
}

$loginJson = $loginResp.Content | ConvertFrom-Json
$token = $loginJson.token
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Host "Login succeeded but token is missing"
  exit 1
}

$auth = @{ Authorization = "Bearer $token" }

function Print-Check {
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Path
  )
  $r = Invoke-Json -Method $Method -Url "$base$Path" -Headers $auth
  $ct = $r.Headers["Content-Type"]
  $content = $r.Content
  if ($content.Length -gt 600) { $content = $content.Substring(0, 600) + "…" }
  Write-Host ""
  Write-Host "== $Name =="
  Write-Host "Status: $($r.StatusCode)"
  if ($ct) { Write-Host "Content-Type: $ct" }
  if ($content) { Write-Host $content }
}

Print-Check -Name "/api/me" -Method "GET" -Path "/api/me"
Print-Check -Name "/api/pomon/health" -Method "GET" -Path "/api/pomon/health"
Print-Check -Name "/api/pomon/prfs?limit=1" -Method "GET" -Path "/api/pomon/prfs?limit=1"

$pwd = $null
$token = $null
Write-Host ""
Write-Host "Done"

