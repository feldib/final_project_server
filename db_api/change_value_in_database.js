import dotenv from "dotenv"
dotenv.config()
import { createConnection } from "mysql2/promise"

const makeConnection = async () =>
  createConnection({
    host: process.env.HOST,
    port: process.env.DB_PORT,
    user: process.env.USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const incrementItemInShoppingList = async (user_id, artwork_id) => {
    const connection = await makeConnection()
  
    await connection.query(`
        UPDATE 
        artworks_in_shopping_list 
        SET quantity = quantity + 1 
        WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id])
  
    connection.end()
  }
  
  const setShoppingCartItemQuantityToZero = async (user_id, artwork_id) => {
    const connection = await makeConnection()
  
    const [quantity_results] = await connection.query(`
        SELECT quantity FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id])
  
    const quantity = quantity_results[0].quantity
  
    await connection.query(`
        UPDATE artworks SET quantity = quantity + ? WHERE id = ?
    `, [quantity, artwork_id])
  
    await connection.query(`
        UPDATE 
        artworks_in_shopping_list 
        SET quantity = 0
        WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id])
  
    connection.end()
  }
  
  const decreaseShoppingCartItemQuantity = async (user_id, artwork_id) => {
    const connection = await makeConnection()
  
    const [quantity_results] = await connection.query(`
        SELECT quantity FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id])
  
    const quantity = quantity_results[0].quantity
  
    if(quantity>0){
        await connection.query(`
          UPDATE artworks SET quantity = quantity+1 WHERE id = ?
        `, [artwork_id])
  
        await connection.query(`
          UPDATE 
          artworks_in_shopping_list 
          SET quantity = quantity-1
          WHERE user_id = ? AND artwork_id = ? 
          `, [user_id, artwork_id]
        )
    }
  
  
    connection.end()
  }
  
  const increaseShoppingCartItemQuantity = async (user_id, artwork_id) => {
    const connection = await makeConnection()
  
    const [quantity_results] = await connection.query(`
        SELECT quantity FROM artworks WHERE id = ? 
    `, [artwork_id])
  
    const quantity = quantity_results[0].quantity
  
    if(quantity>0){
      await connection.query(`
          UPDATE artworks SET quantity = quantity-1 WHERE id = ?
      `, [artwork_id])
  
      await connection.query(`
          UPDATE 
          artworks_in_shopping_list 
          SET quantity = quantity+1
          WHERE user_id = ? AND artwork_id = ? 
      `, [user_id, artwork_id])
    }
  
    connection.end()
  }

  

export {
    setShoppingCartItemQuantityToZero,
    decreaseShoppingCartItemQuantity,
    increaseShoppingCartItemQuantity,
    incrementItemInShoppingList,
}