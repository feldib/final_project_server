import createError from "http-errors";
import express, { json, urlencoded, } from "express";
import { join, dirname } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import { fileURLToPath } from "url";
import config from "./config.js";
import sessions from "express-session";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
const app = express();
app.use(sessions({
    secret: config.security.sessionSecret,
    saveUninitialized: true,
    cookie: { maxAge: config.security.sessionMaxAge },
    resave: false,
}));
app.use(cors({
    origin: [config.server.clientHost],
    methods: ["POST", "GET"],
    credentials: true,
}));
app.use(cookieParser());
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use(function (req, res, next) {
    next(createError(404));
});
app.use(function (err, req, res, _) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
    res.render("error");
});
export default app;
//# sourceMappingURL=app.js.map