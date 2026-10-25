import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

function stripeDevServerPlugin(stripeSecretKey) {
  return {
    name: 'stripe-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost:3000');

        // POST /api/create-checkout-session
        if (req.method === 'POST' && url.pathname === '/api/create-checkout-session') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { packageId, tokens, customAmount, customerEmail, clientName } = body;

              const origin = req.headers.origin || 'http://localhost:3000';
              let unitAmount = 10000;
              let itemName = 'FitToken Recharge - 100 Tokens';
              let tokenCount = 100;
              let isSubscription = false;

              if (packageId === 'recharge-100') {
                unitAmount = 10000;
                itemName = 'FitToken Recharge - 100 Tokens';
                tokenCount = 100;
              } else if (packageId === 'recharge-300') {
                unitAmount = 30000;
                itemName = 'FitToken Recharge - 300 Tokens';
                tokenCount = 300;
              } else if (packageId === 'recharge-600') {
                unitAmount = 60000;
                itemName = 'FitToken Recharge - 600 Tokens';
                tokenCount = 600;
              } else if (packageId === 'monthly-pass') {
                unitAmount = 9900;
                itemName = 'Monthly All-Access Pass';
                isSubscription = true;
                tokenCount = 0;
              } else if (customAmount && Number(customAmount) > 0) {
                const amt = Number(customAmount);
                unitAmount = Math.round(amt * 100);
                itemName = `FitToken Recharge (${amt} Tokens)`;
                tokenCount = amt;
              }

              const params = new URLSearchParams();
              params.append('mode', isSubscription ? 'subscription' : 'payment');
              params.append('success_url', `${origin}/?session_id={CHECKOUT_SESSION_ID}&stripe_success=true&package=${packageId || 'custom'}&tokens=${tokenCount}`);
              params.append('cancel_url', `${origin}/?stripe_cancel=true`);
              if (customerEmail) params.append('customer_email', customerEmail);
              params.append('client_reference_id', customerEmail || clientName || 'client');

              params.append('metadata[package_id]', packageId || 'custom');
              params.append('metadata[tokens]', String(tokenCount));
              if (clientName) params.append('metadata[client_name]', clientName);
              if (customerEmail) params.append('metadata[client_email]', customerEmail);

              params.append('line_items[0][price_data][currency]', 'usd');
              params.append('line_items[0][price_data][product_data][name]', itemName);
              params.append('line_items[0][price_data][unit_amount]', String(unitAmount));
              if (isSubscription) {
                params.append('line_items[0][price_data][recurring][interval]', 'month');
              }
              params.append('line_items[0][quantity]', '1');

              const stripeKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY;
              const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${stripeKey}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              });

              const data = await stripeResp.json();
              res.setHeader('Content-Type', 'application/json');
              if (!stripeResp.ok) {
                res.statusCode = stripeResp.status;
                res.end(JSON.stringify({ error: data.error?.message || 'Stripe API error' }));
              } else {
                res.statusCode = 200;
                res.end(JSON.stringify({ url: data.url, id: data.id }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // GET /api/verify-checkout-session?session_id=...
        if (req.method === 'GET' && url.pathname === '/api/verify-checkout-session') {
          const sessionId = url.searchParams.get('session_id');
          if (!sessionId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing session_id' }));
            return;
          }

          try {
            const stripeKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY;
            const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
              headers: {
                'Authorization': `Bearer ${stripeKey}`
              }
            });
            const data = await stripeResp.json();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = stripeResp.status;
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST /api/gemini/generate
        if (req.method === 'POST' && url.pathname === '/api/gemini/generate') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const key = process.env.GEMINI_API_KEY || '';
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`;

              const geminiResp = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });

              const data = await geminiResp.json();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = geminiResp.status;
              res.end(JSON.stringify(data));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// Dev only: serve the Vercel functions in api/ (e.g. /api/drive/start-upload) from `npm run dev`,
// so the app works locally without `vercel dev`. Routes handled above take precedence.
function vercelFunctionsDevPlugin() {
  return {
    name: 'vercel-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const { pathname } = new URL(req.url, 'http://localhost');
        if (!pathname.startsWith('/api/') || pathname.includes('..') || pathname.startsWith('/api/_lib/')) return next();

        const file = path.join(process.cwd(), `${pathname}.js`);
        if (!fs.existsSync(file)) return next();

        // Mimic Vercel's request/response helpers used by the handlers
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        if ((req.headers['content-type'] || '').includes('application/json')) {
          let raw = '';
          for await (const chunk of req) raw += chunk;
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            return res.status(400).json({ error: 'Invalid JSON' });
          }
        }

        try {
          const mod = await server.ssrLoadModule(file);
          await mod.default(req, res);
        } catch (err) {
          console.error(`[api] ${pathname}`, err);
          if (!res.headersSent) res.status(500).json({ error: err.message });
        }
      });
    }
  };
}

// Dev only: serve the Token API directly from `api/token-api.js`
let cachedTokenApp = null;
function tokenApiDevPlugin() {
  return {
    name: 'token-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;
        if (
          pathname === '/api/tokens' ||
          pathname.startsWith('/api/tokens/') ||
          pathname === '/api/profile/sync' ||
          pathname === '/api/exchange-rates/usd-aud' ||
          pathname === '/api/firebase/config'
        ) {
          try {
            if (!cachedTokenApp) {
              const { pathToFileURL } = await import('node:url');
              const tokenApiPath = path.resolve(process.cwd(), 'api/token-api.js');
              const mod = await import(pathToFileURL(tokenApiPath).href);
              cachedTokenApp = mod.default;
            }
            return cachedTokenApp(req, res, next);
          } catch (err) {
            console.error('[token-api-dev] error:', err);
            return next(err);
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Give the api/ functions their server-side env vars (as Vercel does), without overriding real ones
  for (const [key, value] of Object.entries(env)) process.env[key] ??= value;
  const stripeSecretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  return {
    esbuild: {
      jsx: 'automatic'
    },
    server: {
      port: 3000,
      open: false
    },
    plugins: [
      tokenApiDevPlugin(),
      stripeDevServerPlugin(stripeSecretKey),
      vercelFunctionsDevPlugin()
    ]
  };
});
