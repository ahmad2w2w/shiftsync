# Maakt standaard testaccounts aan voor lokale Supabase
# Gebruik: .\scripts\seed-admin.ps1
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
$baseUrl = "http://127.0.0.1:54321"

$body = @{
  email    = "manager@otoro.nl"
  password = "OtoroAdmin123!"
  data     = @{
    full_name = "Manager Otoro"
    role      = "admin"
  }
} | ConvertTo-Json -Depth 3

$headers = @{
  apikey        = $anonKey
  Authorization = "Bearer $anonKey"
  "Content-Type" = "application/json"
}

try {
  $result = Invoke-RestMethod -Uri "$baseUrl/auth/v1/signup" -Method Post -Headers $headers -Body $body
  Write-Host "Manager aangemaakt: manager@otoro.nl"
  Write-Host "Wachtwoord: OtoroAdmin123!"
} catch {
  $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
  if ($err.msg -match "already") {
    Write-Host "Manager bestaat al — rol wordt bijgewerkt naar admin..."
  } else {
    Write-Host "Signup: $($_.Exception.Message)"
  }
}

# Zorg dat rol admin is (via service role SQL zou idealer zijn; signup metadata zou admin moeten zetten)
Write-Host "Klaar. Log in op http://localhost:5173 met manager@otoro.nl / OtoroAdmin123!"
