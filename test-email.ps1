# Script para probar el envío de email
$body = @{
    email = "alexanderasa0210@gmail.com"
} | ConvertTo-Json

Write-Host "🧪 Probando envío de email..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/api/notificaciones/test" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing

    Write-Host "✅ Respuesta del servidor:" -ForegroundColor Green
    Write-Host $response.Content
    Write-Host ""
    Write-Host "Código de estado: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 Revisa los logs del backend para ver mensajes detallados" -ForegroundColor Cyan
