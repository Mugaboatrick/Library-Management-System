$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5000'
$emails = @('ezras.mitweri1312@gmail.com','ezras.mitweri13121212@gmail.com','ezras.mitweri1213@gmail.com','ezras.mitweri312@gmail.com','ezras.mitweri131312@gmail.com','ezras.mitweri13121312@gmail.com','ezras.mitweri13121312@hopehaven.edu')
$passwords = @('teacher123','teacher1312','teacher123123','teacher13121312','Teacher1312','teacher@123','teacher1213')
foreach ($e in $emails) {
  foreach ($p in $passwords) {
    $b = @{ email = $e; password = $p } | ConvertTo-Json -Compress
    try {
      $login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body $b
      $tok = $login.token
      "LOGIN OK  $e / $p  ->  role=$($login.user.role)  tok=$($tok.Length)chars"
      $lib = Invoke-RestMethod -Method Get -Uri "$base/api/users/librarian" -Headers @{ Authorization = "Bearer $tok" }
      "  /api/users/librarian  ->  $(($lib.data | ConvertTo-Json -Compress))"
      exit 0
    } catch { }
  }
}
"NO LOGIN SUCCEEDED — pick another approach"
