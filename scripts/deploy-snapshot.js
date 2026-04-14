// scripts/deploy-snapshot.js
// Upload local data/vm2026.db to Railway production via admin API


import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const DB_PATH = path.resolve(__dirname, '../data/vm2026.db');
const PROD_URL = process.env.VM2026_PROD_URL || 'https://vm2026.up.railway.app/api/admin/db-upload';
const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || 'vm2026-admin';


if (!fs.existsSync(DB_PATH)) {
  console.error('Local database not found:', DB_PATH);
  process.exit(1);
}

const dbBuffer = fs.readFileSync(DB_PATH);


const url = new URL(PROD_URL);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;


const options = {
  method: 'POST',
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Length': dbBuffer.length,
    'x-admin-code': ADMIN_CODE,
  },
};


console.log('Uploading', DB_PATH, 'to', PROD_URL);


const req = client.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Upload successful:', data);
    } else {
      console.error('❌ Upload failed:', res.statusCode, data);
      process.exit(2);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err);
  process.exit(3);
});

req.write(dbBuffer);
req.end();
