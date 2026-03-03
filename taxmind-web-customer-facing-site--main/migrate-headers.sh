#!/bin/bash

# Script to migrate access-token headers to Authorization Bearer format
# This script processes Vue files and updates API headers

FILES=(
  "src/components/Application/ApplicationPage.vue"
  "src/components/Profile/DocumentTemplates.vue"
  "src/components/Profile/privacyPolicy.vue"
  "src/components/Profile/claimHistory.vue"
  "src/components/Application/ApplicationTemplates.vue"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Use sed to replace access-token with Authorization Bearer
    sed -i 's/"access-token": localStorage\.getItem("accesstoken")/"Authorization": `Bearer ${localStorage.getItem("accesstoken")}"/g' "$file"
    echo "Updated: $file"
  else
    echo "File not found: $file"
  fi
done

echo "Migration complete!"