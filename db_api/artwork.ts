import fs from "fs/promises";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import makeConnection from "../connection.js";
import { ArtworkWithDetails } from "../types/index.js";
import {
  ArtworkField,
  Tag as TagHelper,
  NewArtwork,
  completeArtwork,
  addThumbnail,
  getThumbnail,
  getSpecificTags,
} from "./helpers.js";
import { addArtworkTags, updateArtworkTags } from "./tags.js";

const getSearchQueryData = (
  min?: string,
  max?: string,
  title?: string,
  artist_name?: string,
  category_id?: string,
  order?: string,
  n?: string,
  offset?: string,
  only_featured?: string
): { sql_query: string; data: (string | number)[] } => {
  let sql_query = `
    SELECT artworks.id as 'id', title, artist_name, price, quantity, category_id, date_added FROM artworks
  `;
  if (only_featured === "true") {
    sql_query += `
     RIGHT JOIN featured
     ON featured.artwork_id = artworks.id
     WHERE featured.removed=false
     AND `;
  } else {
    sql_query += " WHERE ";
  }

  sql_query += " artworks.removed=false ";

  console.log(`only_featured = ${only_featured}`);

  const data: (string | number)[] = [];

  let needs_and = false;
  if (min || max || title || artist_name || category_id) {
    sql_query += " AND ";

    if (min && max) {
      sql_query += " price BETWEEN ? AND ? ";
      data.push(min, max);
      needs_and = true;
    } else if (min) {
      sql_query += " price > ? ";
      data.push(parseInt(min));
      needs_and = true;
    } else if (max) {
      sql_query += " price < ? ";
      data.push(parseInt(max));
      needs_and = true;
    }

    if (title) {
      if (needs_and) {
        sql_query += " AND ";
      } else {
        needs_and = true;
      }
      sql_query += " LOWER(title) LIKE ? ";
      data.push(`%${title.toLowerCase()}%`);
      needs_and = true;
    }

    if (artist_name) {
      if (needs_and) {
        sql_query += " AND ";
      } else {
        needs_and = true;
      }
      sql_query += " LOWER(artist_name) LIKE ? ";
      data.push(`%${artist_name.toLowerCase()}%`);
    }

    if (category_id) {
      if (needs_and) {
        sql_query += " AND ";
      } else {
        needs_and = true;
      }
      sql_query += " category_id = ? ";
      data.push(parseInt(category_id));
    }
  }

  sql_query += " ORDER BY date_added";
  if (order === "asc") {
    sql_query += " ASC ";
  } else if (order === "desc") {
    sql_query += " DESC ";
  }

  sql_query += " LIMIT ? ";
  data.push(parseInt(n || "10"));

  if (offset) {
    sql_query += " OFFSET ? ";
    data.push(parseInt(offset));
  }

  return { sql_query, data };
};

export const searchArtworks = async (
  min?: string,
  max?: string,
  title?: string,
  artist_name?: string,
  category_id?: string,
  order?: string,
  n?: string,
  offset?: string,
  only_featured?: string
): Promise<ArtworkWithDetails[]> => {
  const connection = await makeConnection();

  const { sql_query, data } = getSearchQueryData(
    min,
    max,
    title,
    artist_name,
    category_id,
    order,
    n,
    offset,
    only_featured
  );

  console.log(sql_query);

  const [artworks] = await connection.query<RowDataPacket[]>(
    `${sql_query};`,
    data
  );
  connection.end();

  await Promise.all(artworks.map(completeArtwork));

  return artworks as ArtworkWithDetails[];
};

export const findArtworkWithId = async (
  artwork_id: string
): Promise<ArtworkWithDetails> => {
  const connection = await makeConnection();

  const [result] = await connection.query<RowDataPacket[]>(
    `
  SELECT id, title, artist_name, price, quantity, category_id, date_added FROM artworks WHERE removed=false AND id = ?
  `,
    [artwork_id]
  );

  const artwork = result[0] as ArtworkWithDetails;

  connection.end();

  await completeArtwork(artwork);

  return artwork;
};

export const getFeatured = async (
  n?: string
): Promise<ArtworkWithDetails[]> => {
  const connection = await makeConnection();
  const [artwork_ids] = await connection.execute<RowDataPacket[]>(`
    SELECT artwork_id FROM featured WHERE removed=false ORDER BY date_featured DESC
    ${n ? ` LIMIT ${n}` : ""}
  `);

  const [results] = await connection.query<RowDataPacket[]>(
    `SELECT id, title, price, quantity, artist_name FROM artworks WHERE removed = false AND id IN (${artwork_ids
      .map(() => "?")
      .join(", ")})`,
    artwork_ids.map((obj) => obj.artwork_id)
  );
  const artworks: ArtworkWithDetails[] = results as ArtworkWithDetails[];
  if (artworks.length) {
    await Promise.all(artworks.map(addThumbnail));
  }

  connection.end();
  return artworks;
};

export const getNewestArtworks = async (
  n?: string
): Promise<ArtworkWithDetails[]> => {
  const connection = await makeConnection();

  const [results] = await connection.execute<RowDataPacket[]>(
    `SELECT id, title, price, quantity, artist_name FROM artworks WHERE removed = false ORDER BY date_added DESC ${
      n ? ` LIMIT ${n}` : ""
    }`
  );

  const artworks: ArtworkWithDetails[] = results as ArtworkWithDetails[];
  if (artworks.length) {
    await Promise.all(artworks.map(addThumbnail));
  }

  connection.end();
  return artworks;
};

export const getWishlistedTheMost = async (
  n?: string
): Promise<ArtworkWithDetails[]> => {
  const connection = await makeConnection();

  const [results] = await connection.execute<RowDataPacket[]>(
    `SELECT times_wishlisted, artworks.id, artworks.title, artworks.price, artworks.quantity, artworks.artist_name
    FROM artworks 
    LEFT JOIN
      (
        SELECT COUNT(*) AS times_wishlisted, artwork_id FROM wishlisted WHERE removed = false GROUP BY artwork_id
      ) as wishlisted
    ON artworks.id = wishlisted.artwork_id
    WHERE artworks.removed = false
    ORDER BY wishlisted.times_wishlisted DESC 
    ${n ? ` LIMIT ${n}` : ""}`
  );

  const artworks: ArtworkWithDetails[] = results as ArtworkWithDetails[];
  if (artworks.length) {
    await Promise.all(artworks.map(addThumbnail));
  }

  connection.end();
  return artworks;
};

export const getOtherPictures = async (
  artwork_id: number
): Promise<string[]> => {
  const path = `images/${artwork_id}/other_pictures`;

  const pictures = await fs.readdir(`public/${path}`).catch(() => {
    return undefined;
  });

  if (pictures) {
    const picture_paths = pictures.map((file_name) => {
      return `${path}/${file_name}`;
    });

    return picture_paths;
  } else {
    return [];
  }
};

export const getDataOfArtwork = async (id: string): Promise<RowDataPacket> => {
  const connection = await makeConnection();

  const [artworks] = await connection.query<RowDataPacket[]>(
    `SELECT categories.cname, 
    artworks.title, artworks.artist_name, artworks.price, 
    artworks.quantity, artworks.category_id, artworks.date_added, 
    artworks.descript 
    FROM artworks 
    LEFT JOIN categories ON artworks.category_id = categories.id
    WHERE artworks.id=? 
    AND categories.removed = false`,
    [id]
  );

  const artwork = artworks[0];
  if (artwork) {
    const tags = await getSpecificTags(parseInt(id));
    artwork.thumbnail = await getThumbnail(parseInt(id));
    artwork.tags = tags;
    artwork.other_pictures = await getOtherPictures(parseInt(id));
    // Save descript value to description and delete descript
    artwork.description = artwork.descript;
    delete artwork.descript;
  }
  connection.end();
  return artwork;
};

export const checkIfArtworkInStock = async (
  id: number
): Promise<boolean | Error> => {
  const connection = await makeConnection();

  const [result] = await connection.query<RowDataPacket[]>(
    `
      SELECT quantity FROM artworks WHERE id = ?
  `,
    [id]
  );

  connection.end();

  if (!result.length) {
    return new Error("artwork not in database");
  } else {
    return result[0].quantity > 0;
  }
};

export const getQuantityOfArtworkInStock = async (
  artwork_id: number
): Promise<number> => {
  const connection = await makeConnection();

  const [res] = await connection.query<RowDataPacket[]>(
    `
    SELECT quantity FROM artworks WHERE id = ?
  `,
    [artwork_id]
  );

  connection.end();

  return res[0].quantity;
};

export const addNewArtwork = async (artwork: NewArtwork): Promise<void> => {
  const connection = await makeConnection();

  console.log(artwork);

  const [insertResults] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO artworks(title, artist_name, price, quantity, descript, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      artwork.title,
      artwork.artist_name,
      artwork.price,
      artwork.quantity,
      artwork.description,
      artwork.category_id,
    ]
  );

  const artwork_id = insertResults.insertId;

  await addArtworkTags(artwork_id, artwork.tags);

  await connection.query(
    `
      INSERT INTO artwork_pictures(artwork_id, picture_path, is_thumbnail)
      VALUES (?, ?, ?)
    `,
    [artwork_id, artwork.thumbnail, true]
  );

  connection.end();

  await addPictures(artwork_id, artwork.other_pictures);
};

export const updateArtworkData = async (
  artwork_id: number,
  field_name: ArtworkField,
  value: string | number | TagHelper[]
): Promise<void> => {
  if (
    [
      "title",
      "artist_name",
      "price",
      "quantity",
      "description",
      "category_id",
    ].includes(field_name)
  ) {
    const connection = await makeConnection();

    const field_name_corrected =
      field_name === "description" ? "descript" : field_name;

    await connection.query(
      `
        UPDATE artworks SET ${field_name_corrected} = ? WHERE id = ?
      `,
      [value, artwork_id]
    );

    connection.end();
  } else if ("tags" === field_name) {
    const tags = value as TagHelper[];

    await updateArtworkTags(
      artwork_id,
      tags.map((tag) => {
        return tag.tname;
      })
    );
  }
};

export const removeArtwork = async (artwork_id: number): Promise<void> => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE artworks SET removed = true where id = ?
    `,
    [artwork_id]
  );

  await connection.query(
    `
        UPDATE artwork_tags SET removed = true where artwork_id = ?
    `,
    [artwork_id]
  );

  connection.end();
};

export const addPictures = async (
  artwork_id: number,
  picture_paths: string[]
): Promise<void> => {
  const connection = await makeConnection();

  await Promise.all(
    picture_paths.map(async (picture_path) => {
      await connection.query(
        `
          INSERT INTO artwork_pictures(artwork_id, picture_path)
          VALUES (?, ?)
        `,
        [artwork_id, picture_path]
      );
    })
  );

  connection.end();
};

export const addToFeatured = async (artwork_id: number): Promise<void> => {
  const connection = await makeConnection();

  const [prev] = await connection.query<RowDataPacket[]>(
    `
      SELECT id FROM featured WHERE artwork_id = ?
    `,
    [artwork_id]
  );

  if (prev.length) {
    await connection.query(
      `
        UPDATE featured SET removed = false, date_featured = now() WHERE id = ?
      `,
      [prev[0].id]
    );
  } else {
    await connection.query(
      `
        INSERT INTO featured(artwork_id) VALUES(?)
      `,
      [artwork_id]
    );
  }

  connection.end();
};

export const removeFromFeatured = async (artwork_id: number): Promise<void> => {
  const connection = await makeConnection();
  const featured = await checkIfFeatured(artwork_id);
  if (featured) {
    await connection.query(
      `
        UPDATE featured SET removed = true WHERE artwork_id = ?
      `,
      [artwork_id]
    );
  }

  connection.end();
};

export const checkIfFeatured = async (artwork_id: number): Promise<boolean> => {
  const connection = await makeConnection();

  const [prev] = await connection.query<RowDataPacket[]>(
    `
      SELECT removed FROM featured WHERE artwork_id = ?
  `,
    [artwork_id]
  );
  connection.end();
  if (prev.length) {
    return prev[0].removed ? false : true;
  } else {
    return false;
  }
};
