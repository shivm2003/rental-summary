require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

/* ---------- Config ---------- */
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'crash.log');

/* ---------- Ensure log directory exists ---------- */
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/* ---------- Global error handling ---------- */
function logToFile(err) {
  const msg = `[${new Date().toISOString()}] ${err.stack || err}\n`;
  fs.appendFileSync(LOG_FILE, msg);
}

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  logToFile(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  logToFile(reason);
});

/* ---------- Security ---------- */
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

/* ---------- Middleware ---------- */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      // or if the origin is from any local development environment
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ---------- Cache-Control Middleware ---------- */
app.use((req, res, next) => {
  // Prevent aggressive browser caching of dynamic API JSON payloads
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

/* ---------- Auth middleware ---------- */
let auth;
try {
  auth = require('./middleware/auth');
} catch (e) {
  console.warn('⚠️ Auth middleware not found');
  auth = (req, res, next) => next();
}

/* ---------- Safe route loader ---------- */
function safeLoad(routePath, mountPath, middleware = null) {
  try {
    const router = require(routePath);
    
    // Validate that router is a function (Express router)
    if (typeof router !== 'function') {
      throw new Error(`Export is not a function, got ${typeof router}`);
    }
    
    if (middleware) {
      app.use(mountPath, middleware, router);
    } else {
      app.use(mountPath, router);
    }
    console.log(`✅ Mounted: ${mountPath} -> ${routePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to mount ${mountPath}:`, err.message);
    
    // Mount a fallback 503 handler for this route
    app.use(mountPath, (req, res) => {
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        path: mountPath,
        details: err.message
      });
    });
    return false;
  }
}

/* ---------- Mount routes ---------- */
const routes = [
  { path: './routes/auth', mount: '/api/auth' },
  { path: './routes/products', mount: '/api/products' },
  { path: './routes/products', mount: '/api/listings' },
  { path: './routes/categories', mount: '/api/categories' },
  { path: './routes/hero', mount: '/api/hero' },
  { path: './routes/cart', mount: '/api/cart' },
  { path: './routes/user', mount: '/api/user' },
  { path: './routes/lender', mount: '/api/lender', middleware: auth },
  { path: './routes/pincode', mount: '/api/pincode' },
  { path: './routes/admin', mount: '/api/admin', middleware: auth },
  // ✅ FIXED: Removed middleware: auth - let addresses router handle auth per-route
  { path: './routes/addresses', mount: '/api/addresses' },
  { path: './routes/subscriptions', mount: '/api/subscriptions' },
];

let loadedRoutes = 0;
routes.forEach(r => {
  if (safeLoad(r.path, r.mount, r.middleware)) loadedRoutes++;
});

console.log(`📊 Loaded ${loadedRoutes}/${routes.length} routes`);

/* ---------- Health check ---------- */
app.get('/api/health', async (req, res) => {
  const http = require('http');
  
  const checkEndpoint = (endpoint) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: endpoint,
        method: 'HEAD',
        timeout: 3000
      };
      
      const request = http.request(options, (response) => {
        resolve({ endpoint, status: response.statusCode < 400 ? 'ok' : 'fail' });
      });
      
      request.on('error', (err) => {
        resolve({ endpoint, status: 'fail', error: err.message });
      });
      
      request.on('timeout', () => {
        request.destroy();
        resolve({ endpoint, status: 'fail', error: 'timeout' });
      });
      
      request.end();
    });
  };

  const endpointsToCheck = routes.map(r => r.mount);
  const results = await Promise.all(endpointsToCheck.map(checkEndpoint));
  
  const failed = results.filter(r => r.status === 'fail');
  const allOk = failed.length === 0;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    loadedRoutes: `${loadedRoutes}/${routes.length}`,
    checks: results
  });
});

/* ---------- SPA Fallback ---------- */
// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// SPA fallback - regex that excludes /api paths
app.get(/^(?!\/api).*/, (req, res) => {
  const buildPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(buildPath)) {
    res.sendFile(buildPath);
  } else {
    res.status(404).send('Frontend build not found. Please run npm run build.');
  }
});

/* ---------- Global error handler ---------- */
app.use((err, req, res, next) => {
  console.error('🔥 Express error:', err);
  logToFile(err);
  
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

/* ---------- Start ---------- */
const server = app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`☁️ S3 Bucket: ${process.env.AWS_S3_BUCKET_NAME || 'everythingrental'}`);
});

function shutDown() {
  console.log('🧹 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);