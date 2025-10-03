import fs from "fs/promises";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import makeConnection from "../mysqlConnection.js";
import { Tag } from "../types/database.js";
import {
  ArtworkField,
  ArtworkWithDetails,
  NewArtwork,
} from "../types/db-helpers.js";
import {
  addThumbnail,
  completeArtwork,
  getSpecificCategory,
  getSpecificTags,
  getThumbnail,
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
  only_featured?: string,
  admin?: string
): { sql_query: string; data: (string | number)[] } => {
  const selectClause = `
    SELECT artworks.id as 'id', title, artist_name, price, quantity, category_id, date_added FROM artworks
  `;

  const whereClauses: string[] = [];
  const data: (string | number)[] = [];

  let joinClause = "";
  if (only_featured === "true") {
    joinClause = `
     RIGHT JOIN featured ON featured.artwork_id = artworks.id
    `;
    whereClauses.push("featured.removed = false");
  }

  // Always include the base condition
  whereClauses.push("artworks.removed = false");

  // Add price range filters
  if (min && max) {
    whereClauses.push("price BETWEEN ? AND ?");
    data.push(min, max);
  } else if (min) {
    whereClauses.push("price > ?");
    data.push(parseInt(min));
  } else if (max) {
    whereClauses.push("price < ?");
    data.push(parseInt(max));
  }

  // Add title filter
  if (title) {
    whereClauses.push("LOWER(title) LIKE ?");
    data.push(`%${title.toLowerCase()}%`);
  }

  // Add artist name filter
  if (artist_name) {
    whereClauses.push("LOWER(artist_name) LIKE ?");
    data.push(`%${artist_name.toLowerCase()}%`);
  }

  // Add category filter
  if (category_id && category_id.trim() !== "") {
    whereClauses.push("category_id = ?");
    data.push(parseInt(category_id));
  }

  // Only show items with quantity > 0 for non-admin users
  if (admin !== "true") {
    whereClauses.push("artworks.quantity > 0");
  }

  // Build the order by clause
  let orderClause = " ORDER BY date_added";
  if (order === "asc") {
    orderClause += " ASC, id ASC";
  } else if (order === "desc") {
    orderClause += " DESC, id DESC";
  }

  // Add pagination
  let limitOffsetClause = " LIMIT ?";
  data.push(parseInt(n || "10"));

  if (offset) {
    limitOffsetClause += " OFFSET ?";
    data.push(parseInt(offset));
  }

  // Combine all parts to form the final query
  const sql_query = [
    selectClause,
    joinClause,
    "WHERE",
    whereClauses.join(" AND "),
    orderClause,
    limitOffsetClause,
  ].join(" ");

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
  only_featured?: string,
  admin?: string
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
    only_featured,
    admin
  );

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
    `SELECT 
    artworks.title, artworks.artist_name, artworks.price, 
    artworks.quantity, artworks.category_id, artworks.date_added, 
    artworks.descript 
    FROM artworks 
    WHERE artworks.id=? 
    AND artworks.removed = false`,
    [id]
  );

  const artwork = artworks[0];
  if (artwork) {
    const categoryTranslations = await getSpecificCategory(artwork.category_id);
    artwork.category = { translations: categoryTranslations || {} };

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

export const addNewArtwork = async (
  artwork: Partial<NewArtwork>
): Promise<number> => {
  const connection = await makeConnection();

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

  await addArtworkTags(artwork_id, artwork.tags!);

  connection.end();

  return artwork_id;
};

export const updateArtworkData = async (
  artwork_id: number,
  field_name: ArtworkField,
  value: string | number | Tag[]
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
    const tags = value as Tag[];

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
      SELECT id, removed FROM featured WHERE artwork_id = ?
    `,
    [artwork_id]
  );

  if (prev.length) {
    await connection.query(
      `
        UPDATE featured SET removed = false, date_featured = now() WHERE artwork_id = ?
      `,
      [artwork_id]
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

  const [prev] = await connection.query<RowDataPacket[]>(
    `
      SELECT removed FROM featured WHERE artwork_id = ?
    `,
    [artwork_id]
  );

  if (prev.length && !prev[0].removed) {
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
      SELECT removed FROM featured WHERE artwork_id = ? ORDER BY date_featured DESC LIMIT 1
    `,
    [artwork_id]
  );
  connection.end();

  if (prev.length && prev[0].removed !== null) {
    return !prev[0].removed;
  } else {
    return false;
  }
};
