import { RowDataPacket } from "mysql2/promise";
import makeConnection from "../connection.js";
import { User } from "../types/database.js";
import { UserField } from "../types/db-helpers.js";

export const getUser = async (
  email: string,
  password: string
): Promise<User | undefined> => {
  const connection = await makeConnection();
  const [results] = await connection.query<RowDataPacket[]>(
    "SELECT id, last_name, first_name, email, address, phone_number, is_admin FROM users WHERE email = ? AND passw = ?;",
    [email, password]
  );

  connection.end();
  const user = results[0] as User;

  return user;
};

export const getUserWithId = async (id: number): Promise<User | undefined> => {
  const connection = await makeConnection();
  const [results] = await connection.query<RowDataPacket[]>(
    "SELECT last_name, first_name, email, address, phone_number, is_admin FROM users WHERE id = ?;",
    [id]
  );

  connection.end();

  const user = results[0] as User;

  return user;
};

export const getRegisteredUsers = async (): Promise<User[]> => {
  const connection = await makeConnection();
  const [users] = await connection.execute<RowDataPacket[]>(
    `SELECT id, last_name, first_name, email, address, phone_number FROM users
        WHERE is_admin = false;`
  );

  connection.end();
  return users as User[];
};

export const registerUser = async (
  last_name: string,
  first_name: string,
  email: string,
  password: string
): Promise<void> => {
  const connection = await makeConnection();
  const data = [last_name, first_name, email, password];
  await connection.query(
    `
          insert into users (last_name, first_name, email, passw)
          values (
            ?,
            ?,
            ?,
            ?
          );`,
    data
  );
  connection.end();
};

export const updateUserData = async (
  user_id: number,
  field_name: UserField,
  value: string
): Promise<void> => {
  const connection = await makeConnection();

  if (
    ["first_name", "last_name", "email", "address", "phone_number"].includes(
      field_name
    )
  ) {
    await connection.query(
      `
        UPDATE users SET ${field_name} = ? WHERE id = ?
      `,
      [value, user_id]
    );
  }

  connection.end();
};

export const resetPassword = async (
  new_password: string,
  email: string
): Promise<void> => {
  const connection = await makeConnection();
  await connection.query("UPDATE users SET passw = ? WHERE email = ?;", [
    new_password,
    email,
  ]);
  connection.end();
};

export const checkIfRegistered = async (email: string): Promise<boolean> => {
  const connection = await makeConnection();
  const [results] = await connection.query<RowDataPacket[]>(
    "SELECT id, is_admin FROM users WHERE email = ?;",
    [email]
  );
  connection.end();
  return results.length !== 0;
};

export const checkEmail = async (
  email: string
): Promise<{ registered: boolean; id?: number }> => {
  const connection = await makeConnection();
  const [results] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ?;",
    [email]
  );
  connection.end();
  if (results.length !== 0) {
    return {
      registered: true,
      id: results[0].id,
    };
  } else {
    return {
      registered: false,
    };
  }
};
