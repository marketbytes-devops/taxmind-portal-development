# PowerShell script to extract API calls from Vue files

$vueFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.vue" | Where-Object { $_.FullName -notlike "*node_modules*" }

$apiCalls = @()

foreach ($file in $vueFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"

    $page = $file.BaseName

    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i].Trim()
        if ($line -match 'url:\s*"([^"]+)"') {
            $url = $matches[1]
            # Look for method in next few lines
            for ($j = $i; $j -lt [Math]::Min($i + 10, $lines.Length); $j++) {
                $methodLine = $lines[$j].Trim()
                if ($methodLine -match 'method:\s*"([^"]+)"') {
                    $method = $matches[1]
                    $apiCalls += [PSCustomObject]@{
                        Page = $page
                        URL = $url
                        Method = $method
                    }
                    break
                }
            }
        }
    }
}

$apiCalls | Export-Csv -Path "old_apis.csv" -NoTypeInformation

Write-Host "Extracted $($apiCalls.Count) API calls"