import dotenv from "dotenv"
dotenv.config()
import { createConnection } from "mysql2/promise"
import { checkIfWishlisted, checkIfFeatured, getQuantityOfArtworkInStock } from "./get_data_from_db.js"
import { addToShoppingList, addArtworkTags, addPictures } from './add_to_database.js' 

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

  const updateArtworkTags = async (artwork_id, tags) => {
    const connection = await makeConnection()

    const [tags_of_artwork] = await connection.query(`
        SELECT artwork_tags.id as artwork_tag_id, tags.id as tag_id, tags.tname 
        FROM artwork_tags 
        LEFT JOIN tags
        ON tags.id = artwork_tags.tag_id
        WHERE artwork_id = ?
      `, [artwork_id]) 

    const tagsToAdd = tags.filter(
      (tag)=>{

        return !tags_of_artwork.map((tg)=>{

          return tg.tname

        }).includes(

          tag.tname

        )
      }
    )

    await addArtworkTags(artwork_id, tagsToAdd)

    const tagsToRemove = tags_of_artwork.filter(
      (tag)=>{

        return !tags.map((tg)=>{

          return tg.tname

        }).includes(

          tag.tname

        )
      }
    )    

    await Promise.all(tagsToRemove.map(async (tag) => {
      const res = await connection.query(`
        SELECT id FROM tags WHERE tname = ?
      `, [tag.tname])

      await connection.query(`
        UPDATE artwork_tags SET removed = true WHERE artwork_id = ? AND tag_id = ?
      `, [artwork_id, res[0].id]) 
    }))

    connection.end()
  }

  const updateArtworkPictures = async (artwork_id, other_pictures) => {
    const connection = await makeConnection()

    const [pictures_of_artwork] = await connection.query(`
        SELECT id, picture_path FROM artwork_pictures WHERE artwork_id = ?
      `, [artwork_id]) 

    const picturesToAdd = other_pictures.filter(
      (picture)=>{

        return !pictures_of_artwork.map((pic)=>{

          return pic.picture_path

        }).includes(

          picture.picture_path

        )
      }
    )

    await addPictures(artwork_id, picturesToAdd)

    const picturesToRemove = pictures_of_artwork.filter(
      (picture)=>{

        return !other_pictures.map((tg)=>{

          return tg.picture_path

        }).includes(

          picture.picture_path

        )
      }
    )    

    await Promise.all(picturesToRemove.map(async (picture) => {
      await connection.query(`
        UPDATE artwork_pictures SET removed = true WHERE artwork_id = ? AND picture_path = ?
      `, [artwork_id, picture.picture_path]) 
    }))

    connection.end()
  }

  const updateThumbnail = async (artwork_id, thumbnail) => {

    const connection = await makeConnection()

    const results = await connection.query(`
      SELECT id FROM artwork_pictures WHERE is_thumbnail = true AND artwork_id = ?
    `, [artwork_id])

    if(results.length){
      await connection.query(`
        UPDATE artwork_pictures SET picture_path = ? WHERE id = ?
      `, [thumbnail, results[0].id])
    }

    connection.end()

  }

  const updateArtworkData = async (artwork_id, field_name, value) => {
 
    if(
      [
        "title", "artist_name", "price", "quantity", "descript", "category_id"
      ].includes(field_name)
    ){
      const connection = await makeConnection()

      await connection.query(`
        UPDATE artworks SET ${field_name} = ? WHERE id = ?
      `, [value, artwork_id])

      connection.end()
    }else if("tags" === field_name){

      await updateArtworkTags(artwork_id, value.map((tag)=>{
        return tag.tname
      }))

    }else if("other_pictures" === field_name){

      await updateArtworkPictures(artwork_id, value.map((pic)=>{
        return pic.picture_path
      }))

    }else if("thumbnail" === field_name){

      await updateThumbnail(artwork_id, value)

    }

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
    replaceSavedShoppingCart,
    updateArtworkData
}