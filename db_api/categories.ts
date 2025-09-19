import { RowDataPacket } from "mysql2/promise";
import makeConnection from "../connection.js";
import { Category } from "../types/index.js";

export const getCategories = async (): Promise<Category[]> => {
  const connection = await makeConnection();
  const [results] = await connection.execute<RowDataPacket[]>(
    "SELECT id, cname FROM categories WHERE removed = false;"
  );
  connection.end();
  return results as Category[];
};
