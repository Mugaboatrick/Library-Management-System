$ErrorActionPreference='Stop'
$base='http://localhost:5000'
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body '{"email":"librarian@hopehaven.edu","password":"admin123"}'
$tok = $login.token
"TOKEN_LEN: $($tok.Length)"
$r1 = Invoke-RestMethod -Method Get -Uri "$base/api/users/librarian" -Headers @{Authorization="Bearer $tok"}
"L_SINGULAR: " + ($r1 | ConvertTo-Json -Depth 5 -Compress)
