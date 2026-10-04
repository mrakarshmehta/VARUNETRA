param(
    [string]$InputPath = "D:\FloodSense\VARUNETRA_SIH_Final_Presentation.pptx",
    [string]$OutputPath = "D:\FloodSense\VARUNETRA_SIH_Final_Presentation.pdf"
)

$ppSaveAsPDF = 32

Write-Host "Converting $InputPath to $OutputPath via PowerPoint COM..."
$pptApp = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $pptApp.Presentations.Open($InputPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $presentation.SaveAs($OutputPath, $ppSaveAsPDF)
    $presentation.Close()
    Write-Host "[OK] Successfully converted PPTX to PDF: $OutputPath"
} catch {
    Write-Error "Failed to convert PPTX: $_"
} finally {
    $pptApp.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($pptApp) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
