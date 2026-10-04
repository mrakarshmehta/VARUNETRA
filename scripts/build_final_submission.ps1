$base = "D:\FloodSense\VARUNETRA_FINAL_SUBMISSION"
if (Test-Path $base) {
    Remove-Item -Recurse -Force $base
}

New-Item -ItemType Directory -Path "$base\PPT" -Force | Out-Null
New-Item -ItemType Directory -Path "$base\DEMO" -Force | Out-Null
New-Item -ItemType Directory -Path "$base\ARCHITECTURE" -Force | Out-Null
New-Item -ItemType Directory -Path "$base\DOCUMENTATION" -Force | Out-Null
New-Item -ItemType Directory -Path "$base\TECHNICAL" -Force | Out-Null

Copy-Item "D:\FloodSense\VARUNETRA_SIH_Final_Presentation.pptx" "$base\PPT\VARUNETRA_SIH_Final_Presentation.pptx"
Copy-Item "D:\FloodSense\VARUNETRA_SIH_Final_Presentation.pdf" "$base\PPT\VARUNETRA_SIH_Final_Presentation.pdf"

Copy-Item "D:\FloodSense\docs\demo-video\VARUNETRA_SIH_Demo.mp4" "$base\DEMO\VARUNETRA_SIH_Demo.mp4"

Copy-Item "D:\FloodSense\docs\architecture\system-architecture.png" "$base\ARCHITECTURE\system-architecture.png"
Copy-Item "D:\FloodSense\docs\architecture\data-flow.png" "$base\ARCHITECTURE\data-flow.png"
Copy-Item "D:\FloodSense\docs\architecture\operational-response-loop.png" "$base\ARCHITECTURE\operational-response-loop.png"

Copy-Item "D:\FloodSense\docs\SIH_7_MINUTE_SCRIPT.md" "$base\DOCUMENTATION\SIH_7_MINUTE_SCRIPT.md"
Copy-Item "D:\FloodSense\docs\SIH_JUDGE_QA.md" "$base\DOCUMENTATION\SIH_JUDGE_QA.md"
Copy-Item "D:\FloodSense\docs\SIH_DEMO_CHEAT_SHEET.md" "$base\DOCUMENTATION\SIH_DEMO_CHEAT_SHEET.md"
Copy-Item "D:\FloodSense\README.md" "$base\DOCUMENTATION\README.md"

Copy-Item "D:\FloodSense\docs\DEPLOYMENT.md" "$base\TECHNICAL\DEPLOYMENT.md"
Copy-Item "D:\FloodSense\docs\SECURITY_CONFIGURATION.md" "$base\TECHNICAL\SECURITY_CONFIGURATION.md"
Copy-Item "D:\FloodSense\docs\BACKUP_AND_RESTORE.md" "$base\TECHNICAL\BACKUP_AND_RESTORE.md"

Write-Host "[OK] VARUNETRA_FINAL_SUBMISSION created successfully at $base"
