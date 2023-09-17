import dotenv from "dotenv"
dotenv.config()
import { createConnection } from "mysql2/promise"
import { checkIfWishlisted, checkIfFeatured, getQuantityOfArtworkInStock } from "./get_data_from_db.js"
import { addToShoppingList } from './add_to_database.js' 

const makeConnection = async () =>
  createConnection({
    host: process.env.HOST,
    port: process.env.DB_PORT,
    user: process.env.USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const incrementItemInShoppingList = async (user_id, artwork_id, n=1) => {
    const connection = await makeConnection()
  
    await connection.query(`
        UPDATE 
        artworks_in_shopping_list 
        SET quantity = quantity + ?
        WHERE user_id = ? AND artwork_id = ? 
    `, [n, user_id, artwork_id])
  
    connection.end()
  }
  
  const setShoppingCartItemQuantityToZero = async (user_id, artwork_id) => {
    const connection = await makeConnection()

    const [quantity_results] = await connection.query(`
        SELECT quantity FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
    `, [user_id, artwork_id])

    console.log("artwork_id: ", artwork_id)
    console.log("user_id: ", user_id)
    console.log("quantity_results: ", quantity_results)

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
    }else{
      throw new Error("Item out of stock")
    }
  
    connection.end()
  }

  const resetPassword = async (new_password, email) => {
    const connection = await makeConnection()
    await connection.query(
          `UPDATE users SET passw = ? WHERE email = ?;`, [new_password, email]
    )
  }

  const removeFromWishlisted = async (user_id, artwork_id) => {
    const connection = await makeConnection()
    const wishlisted = await checkIfWishlisted(user_id, artwork_id)
    if(wishlisted){
      await connection.query(`
        UPDATE wishlisted SET removed = true WHERE user_id = ? AND artwork_id = ?
      `, [user_id, artwork_id])
    }
  
    connection.end()
  }

  const updateUserData = async (user_id, field_name, value) => {
    const connection = await makeConnection()
  
    if(
      [
        "first_name", "last_name", "email", "address", "phone_number"
      ].includes(field_name)
    ){
      await connection.query(`
        UPDATE users SET ${field_name} = ? WHERE id = ?
      `, [value, user_id])
    }
  
    connection.end()
  }
  

  const approveReview = async (id) =>{
    const connection = await makeConnection()
    await connection.query(`
        UPDATE reviews SET approved = true where id = ?
    `, [id])
  
    connection.end()
  }
  
  const removeReview = async (id) =>{
    const connection = await makeConnection()
    await connection.query(`
        UPDATE reviews SET removed = true where id = ?
    `, [id])
  
    connection.end()
  }

  const removeFromFeatured = async (artwork_id) => {
    const connection = await makeConnection()
    const featured = await checkIfFeatured(artwork_id)
    if(featured){
      await connection.query(`
        UPDATE featured SET removed = true WHERE artwork_id = ?
      `, [artwork_id])
    }
  
    connection.end()
  }

  const removeArtwork = async (artwork_id) => {
    const connection = await makeConnection()
    await connection.query(`
        UPDATE artworks SET removed = true where id = ?
    `, [artwork_id])

    await connection.query(`
        UPDATE artwork_tags SET removed = true where artwork_id = ?
    `, [artwork_id])

  
    connection.end()
  }

  const replaceSavedShoppingCart = async (user_id, shopping_cart) => {
    const connection = await makeConnection()  

    const [res] = await connection.query(`
      SELECT artwork_id FROM artworks_in_shopping_list WHERE user_id = ? AND quantity > 0
    `, [user_id])
    
    const ids = [... new Set(
      res.map( obj => obj.artwork_id )
    )]

    await Promise.all(ids.map(async (artw_id) => {
      await setShoppingCartItemQuantityToZero(user_id, artw_id)
    }))

    await Promise.all(shopping_cart.map(async (item) => {
      const quantity_in_stock = await getQuantityOfArtworkInStock(item.artwork_id)

      const quantity = item.quantity > quantity_in_stock ? quantity_in_stock : item.quantity

      addToShoppingList(user_id, item.artwork_id, quantity)

    }))
  
    connection.end()
  }


export {
    setShoppingCartItemQuantityToZero,
    decreaseShoppingCartItemQuantity,
    increaseShoppingCartItemQuantity,
    incrementItemInShoppingList,
    resetPassword,
    removeFromWishlisted,
    updateUserData,
    approveReview,
    removeReview,
    removeFromFeatured,
    removeArtwork,
    replaceSavedShoppingCart
}