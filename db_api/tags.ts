import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import makeConnection from "../connection.js";

export const addTag = async (tag_name: string): Promise<number> => {
  const connection = await makeConnection();

  const [prev] = await connection.query<RowDataPacket[]>(
    `
        SELECT id FROM tags WHERE tname = ?
    `,
    [tag_name]
  );

  let tag_id: number;

  if (prev.length) {
    tag_id = prev[0].id;
  } else {
    const [insertResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO tags(tname) VALUES(?)
      `,
      [tag_name]
    );
    tag_id = insertResult.insertId;
  }

  connection.end();
  return tag_id;
};

export const addArtworkTags = async (
  artwork_id: number,
  tags: string[]
): Promise<void> => {
  await Promise.all(
    tags.map(async (tag) => {
      const tag_id = await addTag(tag);
      const connection = await makeConnection();

      const [prev] = await connection.query<RowDataPacket[]>(
        `
          SELECT * FROM artwork_tags WHERE artwork_id = ? AND tag_id = ?
        `,
        [artwork_id, tag_id]
      );

      if (prev.length) {
        await connection.query(
          `
            UPDATE artwork_tags SET removed = false WHERE artwork_id = ? AND tag_id = ?
          `,
          [artwork_id, tag_id]
        );
      } else {
        await connection.query(
          `
            INSERT INTO artwork_tags(artwork_id, tag_id) VALUES(?, ?)
          `,
          [artwork_id, tag_id]
        );
      }

      connection.end();
    })
  );
};

export const updateArtworkTags = async (
  artwork_id: number,
  tags: string[]
): Promise<void> => {
  const connection = await makeConnection();

  const [tags_of_artwork] = await connection.query<RowDataPacket[]>(
    `
        SELECT 
          artwork_tags.id as artwork_tag_id, 
          tags.id as tag_id, 
          tags.tname 
        FROM artwork_tags 
        LEFT JOIN tags
        ON tags.id = artwork_tags.tag_id
        WHERE artwork_id = ? AND artwork_tags.removed = false
      `,
    [artwork_id]
  );

  const tagsToAdd = tags.filter(
    (tag) => !tags_of_artwork.some((tg) => tg.tname === tag)
  );

  console.log("tagsToAdd: ", JSON.stringify(tagsToAdd));

  await addArtworkTags(artwork_id, tagsToAdd);

  const tagsToRemove = tags_of_artwork.filter(
    (tg: RowDataPacket) => !tags.includes(tg.tname)
  );

  await Promise.all(
    tagsToRemove.map(async (tag) => {
      await connection.query(
        `
        UPDATE artwork_tags SET removed = true WHERE id = ?
      `,
        [tag.artwork_tag_id]
      );
    })
  );

  connection.end();
};
