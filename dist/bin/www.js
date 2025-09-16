#!/usr/bin/env node
import app from "../app.js";
import dbg from "debug";
import { createServer } from "http";
import config from "../config.js";
const debug = dbg("final-project-server:server");
const port = normalizePort(config.server.port.toString() || "3000");
app.set("port", port);
const server = createServer(app);
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
function normalizePort(val) {
    const parsedPort = parseInt(val, 10);
    if (isNaN(parsedPort)) {
        return val;
    }
    if (parsedPort >= 0) {
        return parsedPort;
    }
    return false;
}
function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port || port}`;
    debug(`Listening on ${bind}`);
}
//# sourceMappingURL=www.js.map