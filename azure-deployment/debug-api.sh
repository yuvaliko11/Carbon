#!/bin/bash
echo "🔍 Fetching Latest Contract from API..."
curl -s http://localhost:5002/api/carbon-contracts | \
  node -e 'const fs=require("fs"); const data=JSON.parse(fs.readFileSync(0, "utf-8")); const latest=data.data[0]; console.log("Keys:", Object.keys(latest.extractedData || {})); console.log("Land Owner:", latest.extractedData?.land?.owner); console.log("Annual Rent:", latest.extractedData?.financial?.annualRent);'
