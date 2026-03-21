const http = require('http');
const httpProxy = require('http-proxy');

const EXPO_PORT = process.env.EXPO_PORT || 8081;
const PROXY_PORT = 3000;

const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${EXPO_PORT}`,
  ws: true,
});

const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

proxy.on('error', (err) => {
  console.error('Proxy error:', err.message);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  let lanIP = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        lanIP = addr.address;
        break;
      }
    }
  }
  console.log(`\n  COOP/COEP proxy running at:`);
  console.log(`    Local:   http://localhost:${PROXY_PORT}`);
  console.log(`    LAN:     http://${lanIP}:${PROXY_PORT}\n`);
  console.log(`  Proxying to Expo dev server at http://localhost:${EXPO_PORT}`);
  console.log(`\n  iPhone Safari open: http://${lanIP}:${PROXY_PORT}\n`);
});
