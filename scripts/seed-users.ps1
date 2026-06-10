# Maakt standaard testaccounts aan voor lokale Supabase
# Gebruik: .\scripts\seed-users.ps1

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
$baseUrl = "http://127.0.0.1:54321"

$headers = @{
  apikey         = $anonKey
  Authorization  = "Bearer $anonKey"
  "Content-Type" = "application/json"
}

function New-TestUser($email, $password, $fullName, $role) {
  $body = @{
    email    = $email
    password = $password
    data     = @{ full_name = $fullName; role = $role }
  } | ConvertTo-Json -Depth 3

  try {
    Invoke-RestMethod -Uri "$baseUrl/auth/v1/signup" -Method Post -Headers $headers -Body $body | Out-Null
    Write-Host "[OK] $email ($role)"
  } catch {
    $msg = $_.ErrorDetails.Message
    if ($msg -match "already|registered") {
      Write-Host "[--] $email bestaat al"
    } else {
      Write-Host "[!!] $email : $msg"
    }
  }
}

New-TestUser "manager@otoro.nl" "OtoroAdmin123!" "Manager Otoro" "admin"
New-TestUser "medewerker@otoro.nl" "OtoroMedewerker123!" "Yuki Tanaka" "employee"

Write-Host ""
Write-Host "Manager:    manager@otoro.nl / OtoroAdmin123!"
Write-Host "Medewerker: medewerker@otoro.nl / OtoroMedewerker123!"
Write-Host "App:        http://localhost:5173"
