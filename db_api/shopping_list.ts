import { RowDataPacket } from "mysql2/promise";
import makeConnection from "../connection.js";
import { ShoppingCartItem } from "../types/index.js";
import { getQuantityOfArtworkInStock } from "./artwork.js";
import { completeArtwork } from "./helpers.js";

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

export const addNewItemToShoppingList = async (
  user_id: number,
  artwork_id: number,
  n: number = 1
): Promise<void> => {
  const connection = await makeConnection();

  await connection.query(
    `
        INSERT INTO 
        artworks_in_shopping_list(user_id, quantity, artwork_id) 
        VALUES(?, ?, ?)
    `,
    [user_id, n, artwork_id]
  );

  connection.end();
};

export const addToShoppingList = async (
  user_id: number,
  artwork_id: number,
  n: number = 1
): Promise<void> => {
  const connection = await makeConnection();

  await connection.query(
    `
        UPDATE artworks SET quantity = quantity-? WHERE id = ?
    `,
    [n, artwork_id]
  );

  const [prev] = await connection.query<RowDataPacket[]>(
    `
        SELECT * FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `,
    [user_id, artwork_id]
  );

  if (prev[0]) {
    await incrementItemInShoppingList(user_id, artwork_id, n);
  } else {
    await addNewItemToShoppingList(user_id, artwork_id, n);
  }
  connection.end();
};

export const incrementItemInShoppingList = async (
  user_id: number,
  artwork_id: number,
  n: number = 5
): Promise<void> => {
  const connection = await makeConnection();

  await connection.query(
    `
        UPDATE 
        artworks_in_shopping_list 
        SET quantity = quantity + ?
        WHERE user_id = ? AND artwork_id = ? 
    `,
    [n, user_id, artwork_id]
  );

  connection.end();
};

export const setShoppingCartItemQuantityToZero = async (
  user_id: number,
  artwork_id: number
): Promise<void> => {
  const connection = await makeConnection();

  const [quantity_results] = await connection.query<RowDataPacket[]>(
    `
        SELECT quantity FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `,
    [user_id, artwork_id]
  );

  const quantity = quantity_results[0].quantity;

  await connection.query(
    `
        UPDATE artworks SET quantity = quantity + ? WHERE id = ?
    `,
    [quantity, artwork_id]
  );

  await connection.query(
    `
        UPDATE 
        artworks_in_shopping_list 
        SET quantity = 0
        WHERE user_id = ? AND artwork_id = ? 
    `,
    [user_id, artwork_id]
  );

  connection.end();
};

export const decreaseShoppingCartItemQuantity = async (
  user_id: number,
  artwork_id: number
): Promise<void> => {
  const connection = await makeConnection();

  const [quantity_results] = await connection.query<RowDataPacket[]>(
    `
        SELECT quantity FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `,
    [user_id, artwork_id]
  );

  const quantity = quantity_results[0].quantity;

  if (quantity > 0) {
    await connection.query(
      `
          UPDATE artworks SET quantity = quantity+1 WHERE id = ?
        `,
      [artwork_id]
    );

    await connection.query(
      `
          UPDATE 
          artworks_in_shopping_list 
          SET quantity = quantity-1
          WHERE user_id = ? AND artwork_id = ? 
          `,
      [user_id, artwork_id]
    );
  }

  connection.end();
};

export const increaseShoppingCartItemQuantity = async (
  user_id: number,
  artwork_id: number
): Promise<void> => {
  const connection = await makeConnection();

  const [quantity_results] = await connection.query<RowDataPacket[]>(
    `
        SELECT quantity FROM artworks WHERE id = ? 
    `,
    [artwork_id]
  );

  const quantity = quantity_results[0].quantity;

  if (quantity > 0) {
    await connection.query(
      `
          UPDATE artworks SET quantity = quantity-1 WHERE id = ?
      `,
      [artwork_id]
    );

    await connection.query(
      `
          UPDATE 
          artworks_in_shopping_list 
          SET quantity = quantity+1
          WHERE user_id = ? AND artwork_id = ? 
      `,
      [user_id, artwork_id]
    );
  } else {
    throw new Error("Item out of stock");
  }

  connection.end();
};

export const replaceSavedShoppingCart = async (
  user_id: number,
  shopping_cart: ShoppingCartItem[]
): Promise<void> => {
  const connection = await makeConnection();

  const [res] = await connection.query<RowDataPacket[]>(
    `
      SELECT artwork_id FROM artworks_in_shopping_list WHERE user_id = ? AND quantity > 0
    `,
    [user_id]
  );

  const ids = [...new Set(res.map((obj) => obj.artwork_id))];

  await Promise.all(
    ids.map(async (artw_id) => {
      await setShoppingCartItemQuantityToZero(user_id, artw_id);
    })
  );

  await Promise.all(
    shopping_cart.map(async (item) => {
      const quantity_in_stock = await getQuantityOfArtworkInStock(
        item.artwork_id
      );

      const quantity =
        item.quantity > quantity_in_stock ? quantity_in_stock : item.quantity;

      addToShoppingList(user_id, item.artwork_id, quantity);
    })
  );

  connection.end();
};
