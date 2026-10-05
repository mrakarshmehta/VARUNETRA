param(
    [string]$PptxPath = "D:\FloodSense\docs\presentation\VARUNETRA_SIH_Final_Presentation.pptx",
    [string]$OutDir = "D:\FloodSense\docs\presentation\slides_png"
)

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$pptApp = New-Object -ComObject PowerPoint.Application
try {
    $pres = $pptApp.Presentations.Open($PptxPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $outFile = Join-Path $OutDir "slide-$i.png"
        $pres.Slides.Item($i).Export($outFile, "PNG", 1920, 1080)
        Write-Host "Exported Slide $i to $outFile"
    }
    $pres.Close()
    Write-Host "[OK] All slides exported successfully to $OutDir"
} catch {
    Write-Error "Failed to export slides: $_"
} finally {
    $pptApp.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($pptApp) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
