#!/bin/bash
RG_NAME="choco-gis"
VM_NAME="fiji-carbon-vm"

echo "🚀 Fetching Raw Backend Logs (Tail 20)..."

az vm run-command invoke \
  --resource-group $RG_NAME \
  --name $VM_NAME \
  --command-id RunShellScript \
  --scripts "sudo docker exec -w /app fiji-backend node -e 'const mongoose = require(\"mongoose\"); const CarbonContract = require(\"./models/CarbonContract\"); mongoose.connect(process.env.MONGODB_URI).then(async () => { const c = await CarbonContract.findOne().sort({createdAt: -1}); console.log(\"DEBUG RECORD:\", { lease: c.leaseNumber, score: c.greenScore, status: c.status, createdAt: c.createdAt }); process.exit(0); }).catch(e=>{console.error(e);process.exit(1);});'"
