import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { validateEnvironmentOrExit, getEnvironmentSummary } from "./_core/validate-env";
import { logger } from "./_core/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Validate environment variables before starting
  validateEnvironmentOrExit();
  
  // Log environment summary
  const envSummary = getEnvironmentSummary();
  logger.info('Starting server with configuration', envSummary);
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
