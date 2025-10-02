import { RowDataPacket } from "mysql2/promise";

import makeConnection from "../mysqlConnection.js";
import { completeArtwork } from "./helpers.js";

export const checkIfWishlisted = async (
  user_id: number,
  artwork_id: number
): Promise<boolean> => {
  const connection = await makeConnection();

  const [prev] = await connection.query<RowDataPacket[]>(
    `
      SELECT removed FROM wishlisted WHERE user_id = ? AND artwork_id = ?
  `,
    [user_id, artwork_id]
  );
  connection.end();
  if (prev.length) {
    return prev[0].removed ? false : true;
  } else {
    return false;
  }
};

export const getWishlisted = async (
  user_id: number,
  n?: string
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();

  const [wishlisted] = await connection.query<RowDataPacket[]>(
    `
      SELECT artworks.id, artworks.title, artworks.price, artworks.artist_name, artworks.quantity, artworks.category_id, artworks.artist_name 
      FROM artworks LEFT JOIN wishlisted 
      ON artworks.id = wishlisted.artwork_id
      WHERE wishlisted.user_id = ? 
      AND wishlisted.removed = false 
      AND artworks.removed = false
      ${n ? ` LIMIT ${n}` : ""}
  `,
    [user_id]
  );

  let results = wishlisted;
  if (wishlisted.length) {
    await Promise.all(wishlisted.map(completeArtwork));
    results = wishlisted;
  }

  connection.end();

  return results;
};

export const addToWishlisted = async (
  user_id: number,
  artwork_id: number
): Promise<void> => {
  const connection = await makeConnection();

  const [prev] = await connection.query<RowDataPacket[]>(
    `
      SELECT id FROM wishlisted WHERE user_id = ? AND artwork_id = ?
    `,
    [user_id, artwork_id]
  );

  if (prev.length) {
    await connection.query(
      `
        UPDATE wishlisted SET removed = false, time_wishlisted = now() WHERE id = ?
      `,
      [prev[0].id]
    );
  } else {
    await connection.query(
      `
        INSERT INTO wishlisted(user_id, artwork_id) VALUES(?, ?)
      `,
      [user_id, artwork_id]
    );
  }

  connection.end();
};

export const removeFromWishlisted = async (
  user_id: number,
  artwork_id: number
): Promise<void> => {
  const connection = await makeConnection();
  const wishlisted = await checkIfWishlisted(user_id, artwork_id);
  if (wishlisted) {
    await connection.query(
      `
        UPDATE wishlisted SET removed = true WHERE user_id = ? AND artwork_id = ?
      `,
      [user_id, artwork_id]
    );
  }

  connection.end();
};
