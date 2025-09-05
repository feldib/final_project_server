import {
  checkIfWishlisted,
  checkIfFeatured,
  getQuantityOfArtworkInStock,
} from "./get_data.js";
import { addToShoppingList, addArtworkTags } from "./add_data.js";
import makeConnection from "../connection.js";

export const incrementItemInShoppingList = async (
  user_id,
  artwork_id,
  n = 1
) => {
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
  user_id,
  artwork_id
) => {
  const connection = await makeConnection();

  const [quantity_results] = await connection.query(
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

export const decreaseShoppingCartItemQuantity = async (user_id, artwork_id) => {
  const connection = await makeConnection();

  const [quantity_results] = await connection.query(
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

export const increaseShoppingCartItemQuantity = async (user_id, artwork_id) => {
  const connection = await makeConnection();

  const [quantity_results] = await connection.query(
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

export const resetPassword = async (new_password, email) => {
  const connection = await makeConnection();
  await connection.query(`UPDATE users SET passw = ? WHERE email = ?;`, [
    new_password,
    email,
  ]);
};

export const removeFromWishlisted = async (user_id, artwork_id) => {
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

export const updateUserData = async (user_id, field_name, value) => {
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

export const updateArtworkTags = async (artwork_id, tags) => {
  const connection = await makeConnection();

  const [tags_of_artwork] = await connection.query(
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

  const tagsToRemove = tags_of_artwork.filter((tg) => !tags.includes(tg.tname));

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

export const updateArtworkData = async (artwork_id, field_name, value) => {
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
      value.map((tag) => {
        return tag.tname;
      })
    );
  }
};

export const approveReview = async (id) => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE reviews SET approved = true where id = ?
    `,
    [id]
  );

  connection.end();
};

export const removeReview = async (id) => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE reviews SET removed = true where id = ?
    `,
    [id]
  );

  connection.end();
};

export const removeFromFeatured = async (artwork_id) => {
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

export const removeArtwork = async (artwork_id) => {
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

export const replaceSavedShoppingCart = async (user_id, shopping_cart) => {
  const connection = await makeConnection();

  const [res] = await connection.query(
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
