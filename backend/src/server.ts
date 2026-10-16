import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

async function startServer() {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(`Snipr API running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch(async (error) => {
  console.error("Failed to start Snipr API:", error);
  await prisma.$disconnect();
  process.exit(1);
});
