// Disable GCE metadata service checks BEFORE any Firebase imports
process.env.FIRESTORE_EMULATOR_HOST = '';
process.env.GCE_METADATA_HOST = 'metadata.google.internal.invalid';
process.env.SUPPRESS_GCLOUD_CREDS_WARNING = 'true';
process.env.NO_GCE_CHECK = 'true';
process.env.GOOGLE_CLOUD_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || '';

import express, { type Request, Response, NextFunction } from "express";
import { spawn } from "child_process";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Start Python ML API server
let mlApiProcess: ReturnType<typeof spawn> | null = null;

function startMLAPI() {
  console.log('🐍 Starting Python ML API server...');
  
  mlApiProcess = spawn('bash', ['-c', 'source .pythonlibs/bin/activate && python3 ml_model/predict_api.py'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  mlApiProcess.stdout?.on('data', (data) => {
    console.log(`[ML API] ${data.toString().trim()}`);
  });

  mlApiProcess.stderr?.on('data', (data) => {
    console.error(`[ML API Error] ${data.toString().trim()}`);
  });

  mlApiProcess.on('exit', (code) => {
    console.log(`[ML API] Process exited with code ${code}`);
  });
}

// Cleanup on process exit
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  if (mlApiProcess) {
    mlApiProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (mlApiProcess) {
    mlApiProcess.kill();
  }
});

// Start ML API
startMLAPI();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
