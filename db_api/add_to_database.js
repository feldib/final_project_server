import { createConnection } from "mysql2/promise"
import dotenv from "dotenv"
dotenv.config()
import { incrementItemInShoppingList } from "./change_value_in_database.js"
import { getShoppingListItems } from "./get_data_from_db.js"

const makeConnection = async () =>
  createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const registerUser = async (last_name, first_name, email, password) =>{
    const connection = await makeConnection()
    const data = [last_name, first_name, email, password]
    await connection.query(
        `
          insert into users (last_name, first_name, email, passw)
          values (
            ?,
            ?,
            ?,
            ?
          );`, data
      )
    connection.end()
}

const saveMessgeToAdministrator = async (email, title, message) =>{
    const connection = await makeConnection()
  
    await connection.query(`
        INSERT INTO messages_to_administrator(email, message_title, message_txt)
        VALUES(?, ?, ?)
    `, [email, title, message])
  
    connection.end()
  }

const addNewItemToShoppingList = async (user_id, artwork_id, n=1) => {
    const connection = await makeConnection()
  
    await connection.query(`
        INSERT INTO 
        artworks_in_shopping_list(user_id, quantity, artwork_id) 
        VALUES(?, ?, ?)
    `, [user_id, n, artwork_id])
  
    connection.end()
  }


const addToShoppingList = async (user_id, artwork_id, n=1) => {
    const connection = await makeConnection()

    await connection.query(`
        UPDATE artworks SET quantity = quantity-? WHERE id = ?
    `, [n, artwork_id])

    const [prev] = await connection.query(`
        SELECT * FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id])

    if(prev[0]){
        await incrementItemInShoppingList(user_id, artwork_id, n)
    }else{
        await addNewItemToShoppingList(user_id, artwork_id, n)
    }
    connection.end()
}

const makeOrder = async (user_id, invoice_data) => {
    const connection = await makeConnection()
    const shoppingListItems = await getShoppingListItems(user_id)
    if(shoppingListItems.length){
      const insertedResults = await connection.query(`
      INSERT INTO orders(user_id) VALUES(?)
      `, [user_id])
  
      const order_id = insertedResults[0].insertId
  
      await Promise.all(shoppingListItems.map(
        async(item)=>{
          await connection.query(`
            INSERT INTO artworks_ordered(order_id, quantity, price, artwork_id) VALUES(?, ?, ?, ?)
          `, [order_id, item.quantity, item.price, item.id])
  
            await connection.query(`
            UPDATE 
            artworks_in_shopping_list 
            SET quantity = 0
            WHERE user_id = ? AND artwork_id = ? 
        `, [user_id, item.id])
        }
      ))
  
      await connection.query(`
        INSERT INTO invoice_data(order_id, last_name, first_name, email, address, phone_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [order_id, invoice_data.last_name, invoice_data.first_name, invoice_data.email, invoice_data.address, invoice_data.phone_number])
  
    }
    connection.end()
  }


  const leaveReview = async (user_id, artwork_id, title, review_text) =>{
    const connection = await makeConnection()
  
    await connection.query(`
        INSERT INTO reviews(user_id, artwork_id, title, review_text)
        VALUES(?, ?, ?, ?)
    `, [user_id, artwork_id, title, review_text])
  
    connection.end()
  }

  const addToFeatured = async (artwork_id) => {
    const connection = await makeConnection()
  
    const [prev] = await connection.query(`
        SELECT id FROM featured WHERE artwork_id = ?
    `, [artwork_id])
  
    if(prev.length){
      await connection.query(`
        UPDATE featured SET removed = false, date_featured = now() WHERE id = ?
    `, [prev[0].id])
    }else{
      await connection.query(`
        INSERT INTO featured(artwork_id) VALUES(?)
    `, [artwork_id])
    }
  
    connection.end()
  }

  const addArtworkTags = async (artwork_id, tags) => {
    Promise.all(tags.map(async(tag)=>{
  
      let connection = await makeConnection()
  
      const [results] = await connection.query(`
        SELECT id, removed FROM tags WHERE tname = ?
      `, [tag])
  
      let tag_id=""
      
      if(results.length){
        console.log("results.length, result", JSON.stringify(results))

        tag_id = results[0].id

        console.log("results.length, tag_id: ", tag_id)

        if(results[0].removed){
          await connection.query(`
            UPDATE tags SET removed = false
          `)
        }
      }
      else{
          const insertedResult = await connection.query(`
            INSERT INTO tags (tname) value (?)
          `, [tag])
          tag_id = insertedResult[0].insertId
      }

      const [prevArtworkTags] = await connection.query(`
      SELECT id, removed FROM artwork_tags WHERE artwork_id = ? AND tag_id = ?
    `, [artwork_id, tag_id])
    
      if(!prevArtworkTags.length){

        await connection.query(`
          INSERT INTO artwork_tags (artwork_id, tag_id) VALUES (?, ?)
        `, [artwork_id, tag_id])

      }else if(prevArtworkTags[0].removed){

        await connection.query(`
          UPDATE artwork_tags SET removed = false WHERE id = ?
        `, [prevArtworkTags[0].id])

      }
      
  
      connection.end()
    }))
  }

  const addNewArtwork = async (artwork) => {
    let connection = await makeConnection()
  
    console.log(artwork)
  
      const insertResults = await connection.query(`
        INSERT INTO artworks(title, artist_name, price, quantity, descript, category_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
          artwork.title, 
          artwork.artist_name, 
          artwork.price, 
          artwork.quantity, 
          artwork.description, 
          artwork.category_id
        ])
  
      const artwork_id = insertResults[0].insertId
     
      await addArtworkTags(artwork_id, artwork.tags)
  
    connection.end()

    return artwork_id
  
  }

  const addToWishlisted = async (user_id, artwork_id) => {
    const connection = await makeConnection()
  
    const [prev] = await connection.query(`
        SELECT id FROM wishlisted WHERE user_id = ? AND artwork_id = ?
    `, [user_id, artwork_id])
  
    if(prev.length){
      await connection.query(`
        UPDATE wishlisted SET removed = false, time_wishlisted = now() WHERE id = ?
    `, [prev[0].id])
    }else{
      await connection.query(`
        INSERT INTO wishlisted(user_id, artwork_id) VALUES(?, ?)
    `, [user_id, artwork_id])
    }
  
    connection.end()
  }

export {
    registerUser,
    saveMessgeToAdministrator,
    addToShoppingList,
    makeOrder,
    leaveReview,
    addToFeatured,
    addNewArtwork,
    addToWishlisted,
    addArtworkTags,
}