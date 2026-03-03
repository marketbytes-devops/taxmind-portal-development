# PowerShell script to extract APIs from TAXMINDold.json

$json = Get-Content "TAXMINDold.json" | ConvertFrom-Json

$apiCalls = New-Object System.Collections.ArrayList

function Extract-Requests {
    param (
        [object]$folder,
        [string]$currentPath = ""
    )

    $path = if ($currentPath) { "$currentPath/$($folder.name)" } else { $folder.name }

    # Process requests in this folder
    foreach ($request in $folder.requests) {
        $apiCalls.Add([PSCustomObject]@{
            Page = $path
            URL = $request.endpoint
            Method = $request.method
        }) | Out-Null
    }

    # Process subfolders
    foreach ($subfolder in $folder.folders) {
        Extract-Requests -folder $subfolder -currentPath $path
    }
}

# Process top-level folders
foreach ($folder in $json.folders) {
    Extract-Requests -folder $folder
}

$apiCalls | Export-Csv -Path "newfullapis_temp.csv" -NoTypeInformation

Write-Host "Extracted $($apiCalls.Count) API calls"