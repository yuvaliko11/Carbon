#!/bin/bash
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test_worker_repro@example.com",
    "password": "password123",
    "role": "worker"
  }' -v
