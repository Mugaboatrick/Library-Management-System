$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5000'

$emails = @(
  'ezras.mitweri1312@gmail.com',
  'ezras.mitweri13121312@gmail.com',
  'ezras.mitweri1312@hopehavenschool.org',
  'ezras.mitweri13121312@hopehavenschool.org',
  'ezras.mitweri1312@hopehaven.edu',
  'librarian@hopehaven.edu'
)
$passwords = @('teacher123','teacher13121312','student123','admin123','123456','teacher@123')

foreach ($e in $emails) {
  foreach ($p in $passwords) {
    $body = @{ email = $e; password = $p } | ConvertTo-Json
    try {
      $login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body $body
      $tok = $login.data.token
      Write-Output "LOGIN OK  $e / $p  role=$($login.data.user.role)"
      Write-Output "  user=$($login.data.user.first_name) $($login.data.user.last_name) id=$($login.data.user.id) customer=$($login.data.user.customer_id)"
      try {
        $lib = Invoke-RestMethod -Method Get -Uri "$base/api/users/librarian" -Headers @{ Authorization = "Bearer $tok" }
        Write-Output "  /users/librarian -> $($lib.data | ConvertTo-Json -Compress)"
      } catch {
        Write-Output "  /users/librarian FAIL: $($_.ErrorDetails.Message)"
      }
      try {
        $lbs = Invoke-RestMethod -Method Get -Uri "$base/api/users/librarians" -Headers @{ Authorization = "Bearer $tok" }
        Write-Output "  /users/librarians -> $($lbs.data | ConvertTo-Json -Compress)"
      } catch { Write-Output "  /users/librarians FAIL: $($_.ErrorDetails.Message)" }
      exit 0
    } catch {
      # keep trying
    }
  }
}
Write-Output "Could not find working credentials"
