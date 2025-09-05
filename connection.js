import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const makeConnection = async () =>
  createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    encoding: process.env.DB_CHARSET,
  });

export default makeConnection;
