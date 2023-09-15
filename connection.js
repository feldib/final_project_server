import { createConnection } from "mysql2/promise"
import dotenv from "dotenv"
dotenv.config()

const makeConnection = async () =>
  createConnection({
    host: process.env.HOST,
    port: process.env.DB_PORT,
    user: process.env.USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

export default makeConnection