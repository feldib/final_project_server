import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  Application,
  json,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from "express";
import createError from "http-errors";
import { createRequire } from "module";
import logger from "morgan";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import config from "./config.js";
import {
  connectToMongoDB,
  disconnectFromMongoDB,
} from "./mongodbConnection.js";
import adminRouter from "./routes/admin.js";
import graphqSearchRouter from "./routes/graphql.js";
import indexRouter from "./routes/index.js";
import translateRouter from "./routes/translate.js";
import usersRouter from "./routes/users.js";
import redisCache from "./utils/redis.js";

const require = createRequire(import.meta.url);
const sessions = require("express-session");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Application = express();

redisCache.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err);
});

connectToMongoDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
});

app.use(
  sessions({
    secret: config.security.sessionSecret,
    saveUninitialized: true,
    cookie: { maxAge: config.security.sessionMaxAge },
    resave: false,
  })
);

app.use(
  cors({
    origin: [config.server.clientHost],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "../public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/deepl", translateRouter);
app.use("/graphql-search", graphqSearchRouter);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function (
  err: Error & { status?: number },
  req: Request,
  res: Response,
  _: NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // return JSON error response instead of rendering a view
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

// Graceful shutdown handlers
const gracefulShutdown = async (): Promise<never> => {
  console.log("Shutting down gracefully...");

  try {
    await redisCache.disconnect();
    console.log("Redis disconnected");

    await disconnectFromMongoDB();
    console.log("MongoDB disconnected");

    console.log("All connections closed successfully");
    // Exit process gracefully
    process.exitCode = 0;
    throw new Error("Server shutdown complete");
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exitCode = 1;
    throw error;
  }
};

// Listen for termination signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export default app;
