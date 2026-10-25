import http from 'http';

const ports = [3000, 3001, 3002, 5173, 8000, 8001];

for (const port of ports) {
  const req = http.get(`http://127.0.0.1:${port}/api/firebase/config`, { timeout: 2000 }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(`PORT ${port}: HTTP ${res.statusMessage} (${res.statusCode}) - ${data.slice(0, 100)}`));
  });
  req.on('error', (e) => console.log(`PORT ${port}: ${e.message}`));
  req.on('timeout', () => { req.destroy(); console.log(`PORT ${port}: TIMEOUT`); });
}
