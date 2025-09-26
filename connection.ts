import { Connection,createConnection } from "mysql2/promise";

import config from "./config.js";

const makeConnection = async (): Promise<Connection> =>
  createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    charset: config.database.charset,
  });

export default makeConnection;
