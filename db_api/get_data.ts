import fs from "fs/promises";
import { RowDataPacket } from "mysql2/promise";
import makeConnection from "../connection.js";
import {
  User,
  Category,
  Tag,
  ArtworkWithDetails,
  OrderDataCollection,
  OrderDataItem,
} from "../types/index.js";

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

export const getCategories = async (): Promise<Category[]> => {
  const connection = await makeConnection();
  const [results] = await connection.execute<RowDataPacket[]>(
    "SELECT id, cname FROM categories WHERE removed = false;"
  );
  connection.end();
  return results as Category[];
};

export const getSpecificCategory = async (
  category_id: number
): Promise<string> => {
  const connection = await makeConnection();
  const [result] = await connection.query<RowDataPacket[]>(
    "SELECT cname FROM categories WHERE id=? AND removed = false;",
    [category_id]
  );
  connection.end();
  const cname = result[0]?.cname;
  return cname;
};

export const getSpecificTags = async (artwork_id: number): Promise<Tag[]> => {
  const connection = await makeConnection();
  const [tags] = await connection.query<RowDataPacket[]>(
    `SELECT tags.id, tags.tname 
    FROM tags 
    LEFT JOIN artwork_tags ON artwork_tags.tag_id = tags.id
    WHERE artwork_id=? 
    AND artwork_tags.removed = false 
    AND tags.removed = false;`,
    [artwork_id]
  );

  connection.end();
  return tags as Tag[];
};

// Helper function to enhance artwork with thumbnail, category name, and tags
const completeArtwork = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  const cname = await getSpecificCategory(artwork.category_id);
  const tags = await getSpecificTags(artwork.id);
  artwork.thumbnail = thumbnail;
  artwork.cname = cname;
  artwork.tags = tags;
};

// Helper function to add only thumbnail (for functions without category_id)
const addThumbnail = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  artwork.thumbnail = thumbnail;
};

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

export const getThumbnail = async (artwork_id: number): Promise<string> => {
  const path = `images/${artwork_id}/thumbnail`;

  const files = await fs.readdir(`public/${path}`).catch(() => {
    return undefined;
  });

  const file_name = files ? files[0] : "";

  return `${path}/${file_name}`;
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

export const getReviewsOfArtwork = async (
  artwork_id: string
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [reviews] = await connection.query<RowDataPacket[]>(
    `SELECT CONCAT(users.last_name, " ", users.first_name) 'name', reviews.id, 
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      WHERE reviews.artwork_id = ? AND reviews.approved = true AND reviews.removed = false`,
    [artwork_id]
  );
  connection.end();

  return reviews;
};

export const getUnapprovedReviews = async (): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [reviews] = await connection.execute<RowDataPacket[]>(
    `SELECT CONCAT(users.last_name, " ", users.first_name) 'name', reviews.id, 
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text,
      artworks.id as artwork_id, artworks.title as artwork_title,
      artworks.artist_name
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      LEFT JOIN artworks ON reviews.artwork_id = artworks.id
      WHERE reviews.approved = false AND reviews.removed = false`
  );
  connection.end();

  return reviews;
};

export const getReviewsOfUser = async (
  user_id: number
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [reviews] = await connection.query<RowDataPacket[]>(
    `SELECT reviews.id, reviews.time_review_posted, reviews.title, 
      artworks.id as artwork_id, artworks.title as artwork_title,
      artworks.artist_name, reviews.approved, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      LEFT JOIN artworks ON reviews.artwork_id = artworks.id
      WHERE reviews.user_id = ? AND reviews.removed = false`,
    [user_id]
  );
  connection.end();

  return reviews;
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

export const getShoppingListItems = async (
  user_id: number
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();

  const [artworks] = await connection.query<RowDataPacket[]>(
    `
    SELECT artworks.id, artworks.title, artworks.price, artworks.artist_name, artworks_in_shopping_list.quantity, artworks.category_id FROM artworks
    LEFT JOIN artworks_in_shopping_list 
    ON artworks.id = artworks_in_shopping_list.artwork_id
    WHERE artworks_in_shopping_list.user_id = ? 
  `,
    [user_id]
  );

  let results = artworks;
  if (!artworks.length) {
    console.log("No items in shopping cart");
  } else {
    await Promise.all(artworks.map(completeArtwork));
    results = artworks.filter((item) => {
      return item.quantity > 0;
    });
  }

  connection.end();
  return results;
};

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
  if (!wishlisted.length) {
    console.log("No wishlisted items");
  } else {
    await Promise.all(wishlisted.map(completeArtwork));
    results = wishlisted;
  }

  connection.end();

  return results;
};

export const getOrderData = async (
  order_id: number
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();

  const [results] = await connection.query<RowDataPacket[]>(
    `
    SELECT artworks_ordered.price * artworks_ordered.quantity as cost, 
    artworks.category_id, artworks_ordered.price, artworks_ordered.quantity, artworks.id,
    artworks.title, artworks.artist_name, CONCAT(users.first_name, " ", users.last_name) as user_name,
    users.id as user_id
    FROM artworks_ordered LEFT JOIN artworks
    ON artworks.id = artworks_ordered.artwork_id
    LEFT JOIN orders ON orders.id = order_id
    LEFT JOIN users ON users.id = orders.user_id
    WHERE artworks_ordered.order_id = ?
  `,
    [order_id]
  );

  await Promise.all(results.map(completeArtwork));

  connection.end();

  return results;
};

export const getOrdersOfUser = async (
  user_id: number
): Promise<OrderDataCollection[]> => {
  const connection = await makeConnection();

  const [results] = await connection.query<RowDataPacket[]>(
    `
    SELECT id, time_ordered FROM orders WHERE user_id = ?
  `,
    [user_id]
  );

  let orderDataCollection: OrderDataCollection[] = [];
  if (results.length) {
    orderDataCollection = await Promise.all(
      results.map(async (ord) => {
        const orderData: OrderDataCollection = {
          time_ordered: ord.time_ordered,
          totalCost: 0,
          items: [],
        };
        const res = await getOrderData(ord.id);
        orderData.totalCost = res
          .map((item) => item.cost)
          .reduce((prev: number, item: number) => prev + item);
        orderData.items = res as OrderDataItem[];
        return orderData;
      })
    );

    orderDataCollection.sort((a, b) => b.time_ordered - a.time_ordered);
  }

  connection.end();

  return orderDataCollection;
};

export const getOrders = async (): Promise<OrderDataCollection[]> => {
  const connection = await makeConnection();

  const [results] = await connection.execute<RowDataPacket[]>(
    "SELECT id, time_ordered FROM orders"
  );

  let orderDataCollection: OrderDataCollection[] = [];
  if (results.length) {
    orderDataCollection = await Promise.all(
      results.map(async (ord) => {
        const orderData: OrderDataCollection = {
          time_ordered: ord.time_ordered,
          totalCost: 0,
          items: [],
        };
        const res = await getOrderData(ord.id);
        orderData.totalCost = res
          .map((item) => item.cost)
          .reduce((prev: number, item: number) => prev + item);
        orderData.items = res as OrderDataItem[];
        orderData.user = {
          user_name: res[0].user_name,
          user_id: res[0].user_id,
        };

        return orderData;
      })
    );

    orderDataCollection.sort((a, b) => b.time_ordered - a.time_ordered);
  }

  connection.end();

  return orderDataCollection;
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
