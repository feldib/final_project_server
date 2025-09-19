import { RowDataPacket } from "mysql2/promise";
import makeConnection from "../connection.js";

export const saveMessgeToAdministrator = async (
  email: string,
  title: string,
  message: string
): Promise<void> => {
  const connection = await makeConnection();

  await connection.query(
    `
        INSERT INTO messages_to_administrator(email, message_title, message_txt)
        VALUES(?, ?, ?)
    `,
    [email, title, message]
  );

  connection.end();
};

export const getUnansweredMessages = async (): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [messages] = await connection.execute<RowDataPacket[]>(
    `SELECT id, email, message_title, message_txt, message_time
      FROM messages_to_administrator
      WHERE answered = false AND removed = false
      `
  );
  connection.end();

  return messages;
};
