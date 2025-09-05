import dotenv from "dotenv";
dotenv.config();
const config = {
    server: {
        port: parseInt(process.env.PORT || "3000"),
        clientHost: process.env.CLIENT_HOST || "",
    },
    security: {
        secretKey: process.env.SECRET_KEY || "",
        sessionSecret: process.env.SESSION_SECRET || "",
        sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || "300000"),
    },
    database: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        name: process.env.DB_NAME || "ecommerce",
        charset: process.env.DB_CHARSET || "utf8mb4",
    },
    email: {
        service: process.env.TRANSPORTER_SERVICE || "gmail",
        auth: {
            user: process.env.TRANSPORTER_AUTH_USER || "",
            pass: process.env.TRANSPORTER_AUTH_PASS || "",
        },
    },
};
export default config;
//# sourceMappingURL=config.js.map