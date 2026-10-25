#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('===============================================================');
console.log('🏋️ STARTING TRAINER DAVID FULLSTACK PLATFORM & TOKEN ENGINE');
console.log('===============================================================');
console.log(`[INIT] Universal Token API: server.js (http://127.0.0.1:8001)`);
console.log(`[INIT] Frontend Web Server: Vite (http://localhost:3000)`);
console.log('===============================================================');

// 1. Spawn Universal Token API Server on port 8001 (server.js, token-kit)
const tokenProc = spawn(process.execPath, ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '8001' }
});

tokenProc.on('error', (err) => {
  console.error('[TOKENS ERROR] Failed to start the token API server:', err);
});

// 2. Spawn Vite Frontend
const viteProc = spawn(`npx vite`, {
  stdio: 'inherit',
  shell: true
});

viteProc.on('error', (err) => {
  console.error('[VITE ERROR] Failed to start Vite dev server:', err);
});

// Handle graceful termination
const cleanup = () => {
  console.log('\n[STOP] Shutting down Trainer David services...');
  try {
    tokenProc.kill();
    viteProc.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
