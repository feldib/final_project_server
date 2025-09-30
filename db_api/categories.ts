import { RowDataPacket } from "mysql2/promise";

import makeConnection from "../connection.js";

export const getAllCategories = async (): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [categories] = await connection.query<RowDataPacket[]>(
    "SELECT id, cname_en, cname_he, cname_hu FROM categories WHERE removed = false;"
  );
  connection.end();
  return categories;
};
