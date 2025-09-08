import {
  checkIfWishlisted,
  checkIfFeatured,
  getQuantityOfArtworkInStock,
} from "./get_data.js";
import { addToShoppingList, addArtworkTags } from "./add_data.js";
import makeConnection from "../connection.js";
import { RowDataPacket } from "mysql2/promise";

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

type UserField =
  | "first_name"
  | "last_name"
  | "email"
  | "address"
  | "phone_number";

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

type ArtworkField =
  | "title"
  | "artist_name"
  | "price"
  | "quantity"
  | "descript"
  | "category_id"
  | "tags";

interface Tag {
  tname: string;
}

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
      "descript",
      "category_id",
    ].includes(field_name)
  ) {
    const connection = await makeConnection();

    await connection.query(
      `
        UPDATE artworks SET ${field_name} = ? WHERE id = ?
      `,
      [value, artwork_id]
    );

    connection.end();
  } else if ("tags" === field_name) {
    await updateArtworkTags(
      artwork_id,
      (value as Tag[]).map((tag) => {
        return tag.tname;
      })
    );
  }
};

export const approveReview = async (id: number): Promise<void> => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE reviews SET approved = true where id = ?
    `,
    [id]
  );

  connection.end();
};

export const removeReview = async (id: number): Promise<void> => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE reviews SET removed = true where id = ?
    `,
    [id]
  );

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

interface ShoppingCartItem {
  artwork_id: number;
  quantity: number;
}

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
