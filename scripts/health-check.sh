#!/bin/bash

URL="http://ctrade.facio.io"
EXPECTED_STATUS=200

echo "🏥 Checking health of $URL ..."

STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" $URL)

if [ "$STATUS" -eq "$EXPECTED_STATUS" ]; then
  echo "✅ System is UP (Status: $STATUS)"
  exit 0
else
  echo "❌ System is DOWN or Unhealthy (Status: $STATUS)"
  exit 1
fi
