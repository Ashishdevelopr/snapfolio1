import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import cors from "cors";
import { registerRoutes } from "./routes";
import { connectMongo } from "./db/mongo";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logger
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
  'https://generated-assets1.vercel.app',
  'https://snapfolio.live',
  'https://www.snapfolio.live',
];

// ✅ 1. CORS Setup
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

app.use(cors(corsOptions));      // Apply CORS first
app.options('*', cors(corsOptions)); // Handle preflight

// ✅ 2. Body Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// ✅ 3. Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// ✅ 4. Routes Registration
(async () => {
  try {
    await connectMongo();
    await registerRoutes(app); // should include all `/api` routes
    log("Routes registered successfully");

    // ✅ 5. Serve Static Frontend in Production
    if (process.env.NODE_ENV === 'production') {
      const frontendPath = path.join(__dirname, '../../frontend/dist');
      if (fs.existsSync(frontendPath)) {
        app.use(express.static(frontendPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(frontendPath, 'index.html'));
        });
        log(`Serving static files from ${frontendPath}`);
      } else {
        log('Frontend build not found. Running in API-only mode.', 'warn');
      }
    }

    // ✅ 6. Global Error Handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      log(`❌ ${status} ${message}`, 'error');
    });

    // ✅ 7. Start Server
    const server = createServer(app);
    const port = 5000;
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`✅ Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to initialize application:", err);
    process.exit(1);
  }
})();