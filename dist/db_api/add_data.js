import { incrementItemInShoppingList } from "./change_data.js";
import { getShoppingListItems } from "./get_data.js";
import makeConnection from "../connection.js";
export const registerUser = async (last_name, first_name, email, password) => {
    const connection = await makeConnection();
    const data = [last_name, first_name, email, password];
    await connection.query(`
          insert into users (last_name, first_name, email, passw)
          values (
            ?,
            ?,
            ?,
            ?
          );`, data);
    connection.end();
};
export const saveMessgeToAdministrator = async (email, title, message) => {
    const connection = await makeConnection();
    await connection.query(`
        INSERT INTO messages_to_administrator(email, message_title, message_txt)
        VALUES(?, ?, ?)
    `, [email, title, message]);
    connection.end();
};
export const addNewItemToShoppingList = async (user_id, artwork_id, n = 1) => {
    const connection = await makeConnection();
    await connection.query(`
        INSERT INTO 
        artworks_in_shopping_list(user_id, quantity, artwork_id) 
        VALUES(?, ?, ?)
    `, [user_id, n, artwork_id]);
    connection.end();
};
export const addToShoppingList = async (user_id, artwork_id, n = 1) => {
    const connection = await makeConnection();
    await connection.query(`
        UPDATE artworks SET quantity = quantity-? WHERE id = ?
    `, [n, artwork_id]);
    const [prev] = await connection.query(`
        SELECT * FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id]);
    if (prev[0]) {
        await incrementItemInShoppingList(user_id, artwork_id, n);
    }
    else {
        await addNewItemToShoppingList(user_id, artwork_id, n);
    }
    connection.end();
};
export const makeOrder = async (user_id) => {
    const connection = await makeConnection();
    const shoppingListItems = await getShoppingListItems(user_id);
    if (shoppingListItems.length) {
        const [insertedResults] = await connection.query(`
      INSERT INTO orders(user_id) VALUES(?)
      `, [user_id]);
        const order_id = insertedResults.insertId;
        await Promise.all(shoppingListItems.map(async (item) => {
            await connection.query(`
            INSERT INTO artworks_ordered(order_id, quantity, price, artwork_id) VALUES(?, ?, ?, ?)
          `, [order_id, item.quantity, item.price, item.id]);
            await connection.query(`
            UPDATE 
            artworks_in_shopping_list 
            SET quantity = 0
            WHERE user_id = ? AND artwork_id = ?
          `, [user_id, item.id]);
        }));
        connection.end();
        return order_id;
    }
    else {
        connection.end();
        throw new Error("No items in shopping cart");
    }
};
export const addTag = async (tag_name) => {
    const connection = await makeConnection();
    const [prev] = await connection.query(`
        SELECT id FROM tags WHERE tname = ?
    `, [tag_name]);
    let tag_id;
    if (prev.length) {
        tag_id = prev[0].id;
    }
    else {
        const [insertResult] = await connection.query(`
        INSERT INTO tags(tname) VALUES(?)
      `, [tag_name]);
        tag_id = insertResult.insertId;
    }
    connection.end();
    return tag_id;
};
export const addArtworkTags = async (artwork_id, tags) => {
    await Promise.all(tags.map(async (tag) => {
        const tag_id = await addTag(tag);
        const connection = await makeConnection();
        const [prev] = await connection.query(`
          SELECT * FROM artwork_tags WHERE artwork_id = ? AND tag_id = ?
        `, [artwork_id, tag_id]);
        if (prev.length) {
            await connection.query(`
            UPDATE artwork_tags SET removed = false WHERE artwork_id = ? AND tag_id = ?
          `, [artwork_id, tag_id]);
        }
        else {
            await connection.query(`
            INSERT INTO artwork_tags(artwork_id, tag_id) VALUES(?, ?)
          `, [artwork_id, tag_id]);
        }
        connection.end();
    }));
};
export const addToWishlisted = async (user_id, artwork_id) => {
    const connection = await makeConnection();
    const [prev] = await connection.query(`
      SELECT id FROM wishlisted WHERE user_id = ? AND artwork_id = ?
    `, [user_id, artwork_id]);
    if (prev.length) {
        await connection.query(`
        UPDATE wishlisted SET removed = false, time_wishlisted = now() WHERE id = ?
      `, [prev[0].id]);
    }
    else {
        await connection.query(`
        INSERT INTO wishlisted(user_id, artwork_id) VALUES(?, ?)
      `, [user_id, artwork_id]);
    }
    connection.end();
};
export const addToFeatured = async (artwork_id) => {
    const connection = await makeConnection();
    const [prev] = await connection.query(`
      SELECT id FROM featured WHERE artwork_id = ?
    `, [artwork_id]);
    if (prev.length) {
        await connection.query(`
        UPDATE featured SET removed = false, date_featured = now() WHERE id = ?
      `, [prev[0].id]);
    }
    else {
        await connection.query(`
        INSERT INTO featured(artwork_id) VALUES(?)
      `, [artwork_id]);
    }
    connection.end();
};
export const leaveReview = async (user_id, artwork_id, title, review_text) => {
    const connection = await makeConnection();
    await connection.query(`
      INSERT INTO reviews(user_id, artwork_id, title, review_text)
      VALUES(?, ?, ?, ?)
    `, [user_id, artwork_id, title, review_text]);
    connection.end();
};
export const addPictures = async (artwork_id, picture_paths) => {
    const connection = await makeConnection();
    await Promise.all(picture_paths.map(async (picture_path) => {
        await connection.query(`
          INSERT INTO artwork_pictures(artwork_id, picture_path)
          VALUES (?, ?)
        `, [artwork_id, picture_path]);
    }));
    connection.end();
};
export const addNewArtwork = async (artwork) => {
    const connection = await makeConnection();
    console.log(artwork);
    const [insertResults] = await connection.query(`
      INSERT INTO artworks(title, artist_name, price, quantity, descript, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
        artwork.title,
        artwork.artist_name,
        artwork.price,
        artwork.quantity,
        artwork.description,
        artwork.category_id,
    ]);
    const artwork_id = insertResults.insertId;
    await addArtworkTags(artwork_id, artwork.tags);
    await connection.query(`
      INSERT INTO artwork_pictures(artwork_id, picture_path, is_thumbnail)
      VALUES (?, ?, ?)
    `, [artwork_id, artwork.thumbnail, true]);
    connection.end();
    await addPictures(artwork_id, artwork.other_pictures);
};
//# sourceMappingURL=add_data.js.map