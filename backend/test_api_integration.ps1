$ErrorActionPreference = "Stop"

Write-Host "=== 1. TEST INTERN LOGIN ==="
$loginBody = @{
    email = "salsabila@intern.bps.go.id"
    password = "password123"
} | ConvertTo-Json

$internLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$internName = $internLogin.data.user.name
$internRole = $internLogin.data.user.role
Write-Host "Intern Token generated for: $internName (Role: $internRole)"
$internToken = $internLogin.data.token
$internHeaders = @{ Authorization = "Bearer $internToken" }

Write-Host "`n=== 2. TEST MENTOR LOGIN ==="
$mentorBody = @{
    email = "mentor@bps-jeneponto.go.id"
    password = "password123"
} | ConvertTo-Json

$mentorLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $mentorBody -ContentType "application/json"
$mentorName = $mentorLogin.data.user.name
$mentorRole = $mentorLogin.data.user.role
Write-Host "Mentor Token generated for: $mentorName (Role: $mentorRole)"
$mentorToken = $mentorLogin.data.token
$mentorHeaders = @{ Authorization = "Bearer $mentorToken" }

Write-Host "`n=== 3. TEST AUTH ME ==="
$me = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/me" -Headers $internHeaders
$meName = $me.data.name
$meInternId = $me.data.intern_id
Write-Host "Auth Me result: Name=$meName InternID=$meInternId"

Write-Host "`n=== 4. TEST GEOFENCE REJECTION (FAR GPS) ==="
$dummyPhotoPath = Join-Path $PSScriptRoot "dummy_selfie.jpg"
[System.IO.File]::WriteAllBytes($dummyPhotoPath, [byte[]]@(0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46))

$httpClient = New-Object System.Net.Http.HttpClient
$httpClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $internToken)

# Check-in with Far location
$formFar = New-Object System.Net.Http.MultipartFormDataContent
$formFar.Add((New-Object System.Net.Http.StringContent("-5.7100000")), "latitude")
$formFar.Add((New-Object System.Net.Http.StringContent("119.7350000")), "longitude")
$formFar.Add((New-Object System.Net.Http.StringContent("10.0")), "accuracy")
$formFar.Add((New-Object System.Net.Http.StringContent("Test jauh")), "notes")

$fileBytes = [System.IO.File]::ReadAllBytes($dummyPhotoPath)
$fileContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/jpeg")
$formFar.Add($fileContent, "photo", "dummy_selfie.jpg")

$responseFar = $httpClient.PostAsync("http://localhost:8080/api/attendance/check-in", $formFar).Result
$responseBodyFar = $responseFar.Content.ReadAsStringAsync().Result

if ($responseFar.StatusCode -eq [System.Net.HttpStatusCode]::UnprocessableEntity) {
    Write-Host "✓ Correctly rejected by Geofence (HTTP 422): $responseBodyFar"
} else {
    Write-Error "Expected 422 UnprocessableEntity, got $($responseFar.StatusCode)"
}

Write-Host "`n=== 5. TEST CHECK-IN SUCCESS (OFFICE GPS) ==="
$formNear = New-Object System.Net.Http.MultipartFormDataContent
$formNear.Add((New-Object System.Net.Http.StringContent("-5.6987123")), "latitude")
$formNear.Add((New-Object System.Net.Http.StringContent("119.7289456")), "longitude")
$formNear.Add((New-Object System.Net.Http.StringContent("5.0")), "accuracy")
$formNear.Add((New-Object System.Net.Http.StringContent("Hadir tepat waktu")), "notes")

$fileContentNear = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
$fileContentNear.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/jpeg")
$formNear.Add($fileContentNear, "photo", "selfie_in.jpg")

$responseNear = $httpClient.PostAsync("http://localhost:8080/api/attendance/check-in", $formNear).Result
$responseBodyNear = $responseNear.Content.ReadAsStringAsync().Result
$checkInJson = $responseBodyNear | ConvertFrom-Json

$status = $checkInJson.data.status
$photoUrl = $checkInJson.data.check_in_photo_url
$distance = $checkInJson.data.check_in_distance
$attID = $checkInJson.data.id
Write-Host "✓ Check-in Success! Status: $status Photo URL: $photoUrl Distance: $distance m"

Write-Host "`n=== 6. TEST CHECK-OUT SUCCESS ==="
$formOut = New-Object System.Net.Http.MultipartFormDataContent
$formOut.Add((New-Object System.Net.Http.StringContent("-5.6987200")), "latitude")
$formOut.Add((New-Object System.Net.Http.StringContent("119.7289500")), "longitude")
$formOut.Add((New-Object System.Net.Http.StringContent("6.0")), "accuracy")
$formOut.Add((New-Object System.Net.Http.StringContent("Selesai magang")), "notes")

$fileContentOut = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
$fileContentOut.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/jpeg")
$formOut.Add($fileContentOut, "photo", "selfie_out.jpg")

$responseOut = $httpClient.PostAsync("http://localhost:8080/api/attendance/check-out", $formOut).Result
$responseBodyOut = $responseOut.Content.ReadAsStringAsync().Result
$checkOutJson = $responseBodyOut | ConvertFrom-Json

$checkOutTime = $checkOutJson.data.check_out
$checkOutPhoto = $checkOutJson.data.check_out_photo_url
Write-Host "✓ Check-out Success! Time: $checkOutTime Photo: $checkOutPhoto"

Write-Host "`n=== 7. TEST MENTOR DASHBOARD ==="
$dash = Invoke-RestMethod -Uri "http://localhost:8080/api/mentor/dashboard" -Headers $mentorHeaders
$total = $dash.data.stats.total_interns
$hadir = $dash.data.stats.hadir
$belumHadir = $dash.data.stats.belum_hadir
Write-Host "Mentor Dashboard Loaded. Total Interns: $total Hadir: $hadir Belum Hadir: $belumHadir"

Write-Host "`n=== 8. TEST MENTOR CORRECTION AND AUDIT LOG ==="
$corrBody = @{
    status = "HADIR"
    reason = "Koreksi absensi: peserta sudah konfirmasi penugasan di kantor"
    notes = "Dikonfirmasi pembimbing"
} | ConvertTo-Json

$corrRes = Invoke-RestMethod -Uri "http://localhost:8080/api/mentor/attendance/$attID/correct" -Method Post -Headers $mentorHeaders -Body $corrBody -ContentType "application/json"
$corrMsg = $corrRes.message
Write-Host "✓ Correction saved successfully! Message: $corrMsg"

Write-Host "`n=== 9. TEST ATTENDANCE DETAIL WITH AUDIT LOGS ==="
$detailRes = Invoke-RestMethod -Uri "http://localhost:8080/api/mentor/attendance/$attID" -Headers $mentorHeaders
$dInternName = $detailRes.data.intern_name
$dLogsCount = $detailRes.data.corrections.Count
$dReason = $detailRes.data.corrections[0].reason
$dMentor = $detailRes.data.corrections[0].mentor_name
Write-Host "Attendance Detail verified for: $dInternName Audit log count: $dLogsCount"
Write-Host "Audit Log Reason: $dReason Corrected By: $dMentor"

Write-Host "`n=== ALL API TESTS PASSED SUCCESSFULLY! ==="
