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

const getUser = async (email, password) => {
  const connection = await makeConnection()
  const [results] = await connection.query(
        `SELECT id, last_name, first_name, email, address, phone_number, is_admin FROM users WHERE email = ? AND passw = ?;`,
        [email, password]
      )

  connection.end()
  const user = results[0]

  return user
}

const getUserWithId = async (id) => {
    const connection = await makeConnection()
    const [results] = await connection.query(
          `SELECT last_name, first_name, email, address, phone_number, is_admin FROM users WHERE id = ?;`,
          [id]
        )
  
    connection.end()
  
    const user = results[0]
    
    return user
  }

const getRegisteredUsers = async () => {
  const connection = await makeConnection()
  const [users] = await connection.execute(
        `SELECT id, last_name, first_name, email, address, phone_number FROM users
        WHERE is_admin = false;`
      )

  connection.end()
  return users
}

const getCategories = async () => {
  const connection = await makeConnection()
  const [results] = await connection.execute("SELECT id, cname FROM categories WHERE removed = false;")
  connection.end()
  return results
}

const getSpecificCategory = async (category_id) => {
  const connection = await makeConnection()
  const [result] = await connection.query(`SELECT cname FROM categories WHERE id=? AND removed = false;`, [category_id])
  connection.end()
  const cname = result[0].cname
  return cname
}


const getSpecificTags = async (artwork_id) => {
  const connection = await makeConnection()
  const [tags] = await connection.query(
    `SELECT tags.id, tags.tname 
    FROM tags 
    LEFT JOIN artwork_tags ON artwork_tags.tag_id = tags.id
    WHERE artwork_id=? 
    AND artwork_tags.removed = false 
    AND tags.removed = false;`, 
    [artwork_id]
  )

  connection.end()
  return tags
}

const searchArtworks = async (min, max, title, artist_name, category_id, order, n, offset) => {
  const connection = await makeConnection()

  let sql_query = "SELECT id, title, artist_name, price, quantity, category_id, date_added FROM artworks WHERE removed=false"

  const data = []

  let needs_and = false
  if(
    min ||
    max || 
    title || 
    artist_name ||
    category_id  
  ){
    sql_query += " AND "

    if(min && max){
      sql_query += ` price BETWEEN ? AND ? `
      data.push(min, max)
      needs_and=true
    }
    else if(min){
      sql_query += ` price > ? `
      data.push(parseInt(min))
      needs_and=true
    }
    else if(max){
      sql_query += ` price < ? `
      data.push(parseInt(max))
      needs_and=true
    }

    if(title){
      if(needs_and){
        sql_query += " AND "
      }else{
        needs_and=true
      }
      sql_query += ` LOWER(title) LIKE ? `
      data.push(`%${title.toLowerCase()}%`)
      needs_and=true
    }

    if(artist_name){
      if(needs_and){
        sql_query += " AND "
      }else{
        needs_and=true
      }
      sql_query += ` LOWER(artist_name) LIKE ? `
      data.push(`%${artist_name.toLowerCase()}%`)
    }

    if(category_id){
      if(needs_and){
        sql_query += " AND "
      }else{
        needs_and=true
      }
      sql_query += ` category_id = ? `
      data.push(parseInt(category_id))
    }
  }

  sql_query += " ORDER BY date_added"
  if(order==="asc"){
    sql_query += " ASC "
  }else if(order==="desc"){
    sql_query += " DESC "
  }
  

  sql_query += ` LIMIT ? `
  data.push(parseInt(n))
  
  if(offset){
    sql_query += ` OFFSET ? `
    data.push(parseInt(offset))
  }
  

  const [artworks] = await connection.query(sql_query + ";", data)
  connection.end()
 
  await Promise.all(artworks.map(async (artwork) => {
    const thumbnail = await getThumbnail(artwork.id)
    const cname = await getSpecificCategory(artwork.category_id)
    const tags = await getSpecificTags(artwork.id)
    artwork.thumbnail = thumbnail
    artwork.cname = cname
    artwork.tags = tags
  }))
  return artworks
}

const findArtworkWithId = async (artwork_id) => {
  const connection = await makeConnection()

  const [result] = await connection.query(`
  SELECT id, title, artist_name, price, quantity, category_id, date_added FROM artworks WHERE removed=false AND id = ?
  `, [artwork_id])

  const artwork = result[0]

  connection.end()

  const thumbnail = await getThumbnail(artwork_id)
  const cname = await getSpecificCategory(artwork.category_id)
  const tags = await getSpecificTags(artwork_id)
  artwork.thumbnail = thumbnail
  artwork.cname = cname
  artwork.tags = tags

  return artwork
}

const getFeatured = async (n) => { 
  const connection = await makeConnection()  
  const [artwork_ids] = await connection.execute(`
    SELECT artwork_id FROM featured WHERE removed=false ORDER BY date_featured DESC
    ${n ? ` LIMIT ${n}` : ""}
  `)

  const [results] = await connection.query(
    `SELECT id, title, price, quantity FROM artworks WHERE id IN (${
      artwork_ids
        .map(obj => "?")
        .join(", ")
    })`,
    artwork_ids.map(obj => obj.artwork_id)
  )
  let artworks = results
  if(artworks.length){
    artworks = await Promise.all(results.map(
      async(artwork)=>{
        const thumbnail = await getThumbnail(artwork.id)
        if(thumbnail){
          return { ...artwork, thumbnail: thumbnail } 
        }else{
          return artwork
        }
      }
    ))
  }
  

  connection.end()
  return artworks
}

const getThumbnail = async (id) => {
    const connection = await makeConnection() 
    const [thumbnail] = await connection.query(
        `SELECT picture_path FROM artwork_pictures WHERE artwork_id = ? AND is_thumbnail = true`, [id]
        )
    connection.end()
    return thumbnail[0].picture_path
}

const getOtherPictures = async (artwork_id) => {
  const connection = await makeConnection() 
  const [results] = await connection.query(
      `SELECT picture_path FROM artwork_pictures WHERE artwork_id = ? AND is_thumbnail = false`, [artwork_id]
      )
  let pictures = results
  if(results.length){
    pictures.map((pic)=>{
      return pic.picture_path
    })
  }

  connection.end()
  return pictures
}

const checkIfRegistered = async (email) => {
    const connection = await makeConnection()
    const [results, fields] = await connection.query(
        `SELECT id, is_admin FROM users WHERE email = ?;`, [email]
      )
    connection.end()
    return results.length !== 0
}

const checkEmail = async (email) => {
    const connection = await makeConnection()
    const [results, fields] = await connection.query(
        `SELECT id FROM users WHERE email = ?;`, [email]
      )
    connection.end()
    if(results.length !== 0){
        return {
            registered: true,
            id: results.id
        }
    }else{
        return {
            registered: false,
        }
    }
}

const getReviewsOfArtwork = async(artwork_id) => {
  const connection = await makeConnection() 
  const [reviews] = await connection.query(
      `SELECT CONCAT(users.last_name, " ", users.first_name) 'name', reviews.id, 
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      WHERE reviews.artwork_id = ? AND reviews.approved = true AND reviews.removed = false`, 
      [artwork_id]
      )
  connection.end()

  return reviews
}

const getUnapprovedReviews = async() => {
  const connection = await makeConnection() 
  const [reviews] = await connection.execute(
      `SELECT CONCAT(users.last_name, " ", users.first_name) 'name', reviews.id, 
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text,
      artworks.id as artwork_id, artworks.title as artwork_title,
      artworks.artist_name
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      LEFT JOIN artworks ON reviews.artwork_id = artworks.id
      WHERE reviews.approved = false AND reviews.removed = false`
    )
  connection.end()

  return reviews
}

const getReviewsOfUser = async(user_id) => {
  const connection = await makeConnection() 
  const [reviews] = await connection.query(
      `SELECT reviews.id, reviews.time_review_posted, reviews.title, 
      artworks.id as artwork_id, artworks.title as artwork_title,
      artworks.artist_name, reviews.approved, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      LEFT JOIN artworks ON reviews.artwork_id = artworks.id
      WHERE reviews.user_id = ? AND reviews.removed = false`,
      [user_id]
    )
  connection.end()

  return reviews
}

const getDataOfArtwork = async (id) => {
  const connection = await makeConnection()

  const [artworks] = await connection.query(
    `SELECT artwork_pictures.picture_path 'thumbnail', categories.cname, 
    artworks.title, artworks.artist_name, artworks.price, 
    artworks.quantity, artworks.category_id, artworks.date_added, 
    artworks.descript 
    FROM artworks 
    LEFT JOIN categories ON artworks.category_id = categories.id
    LEFT JOIN artwork_pictures ON artworks.id = artwork_pictures.artwork_id
    WHERE artworks.id=? 
    AND categories.removed = false 
    AND artwork_pictures.is_thumbnail = true`,
    [id]
  )


  const artwork = artworks[0]
  if(artwork){
    const tags = await getSpecificTags(id)
    artwork.tags = tags
    artwork.other_pictures = await getOtherPictures(id)
  }
  connection.end()
  return artwork
}

const checkIfArtworkInStock = async (id) => {
  const connection = await makeConnection()

  const [result] = await connection.query(`
      SELECT quantity FROM artworks WHERE id = ?
  `, [id])

  connection.end()

  if(!result.length){
    return new Error("artwork not in database")
  }else{
    return result[0].quantity > 0
  }
}

const getShoppingListItems = async (user_id) => {
  const connection = await makeConnection()

  const [artworks] = await connection.query(`
    SELECT artworks.id, artworks.title, artworks.price, artworks.artist_name, artworks_in_shopping_list.quantity, artworks.category_id FROM artworks
    LEFT JOIN artworks_in_shopping_list 
    ON artworks.id = artworks_in_shopping_list.artwork_id
    WHERE artworks_in_shopping_list.user_id = ? 
  `, [user_id])

  let results = artworks
  if(!artworks.length){
    console.log("No items in shopping cart")
  }else{
    results = await Promise.all(artworks.map(
      async(artwork)=>{
        const thumbnail = await getThumbnail(artwork.id)
        const cname = await getSpecificCategory(artwork.category_id)
        const tags = await getSpecificTags(artwork.id)
        artwork.thumbnail = thumbnail
        artwork.cname = cname
        artwork.tags = tags
        return artwork
      }
    ))
    results = results.filter((item)=>{
      return item.quantity > 0
    })
  }

  connection.end()
  return results
}

const checkIfWishlisted = async (user_id, artwork_id) => {
  const connection = await makeConnection()

  const [prev] = await connection.query(`
      SELECT removed FROM wishlisted WHERE user_id = ? AND artwork_id = ?
  `, [user_id, artwork_id])
  connection.end()
  if(prev.length){
    return prev[0].removed ? false : true
  }else{
    return false
  }
}

const getWishlisted = async (user_id, n) => {
  const connection = await makeConnection()

  const [wishlisted] = await connection.query(`
      SELECT artworks.id, artworks.title, artworks.price, artworks.artist_name, artworks.quantity, artworks.category_id 
      FROM artworks LEFT JOIN wishlisted 
      ON artworks.id = wishlisted.artwork_id
      WHERE wishlisted.user_id = ? 
      AND wishlisted.removed = false 
      AND artworks.removed = false
      ${n ? ` LIMIT ${n}` : ""}
  `, [user_id])

  let results = wishlisted
  if(!wishlisted.length){
    console.log("No wishlisted items")
  }else{
    results = await Promise.all(wishlisted.map(
      async(artwork)=>{
        const thumbnail = await getThumbnail(artwork.id)
        const cname = await getSpecificCategory(artwork.category_id)
        const tags = await getSpecificTags(artwork.id)
        artwork.thumbnail = thumbnail
        artwork.cname = cname
        artwork.tags = tags
        return artwork
      }
    ))
  }

  connection.end()

  return results
}

const getOrderData = async (order_id) => {
  const connection = await makeConnection()

  const [results] = await connection.query(`
    SELECT artworks_ordered.price * artworks_ordered.quantity as cost, 
    artworks.category_id, artworks_ordered.price, artworks_ordered.quantity, artworks.id,
    artworks.title, artworks.artist_name, CONCAT(users.first_name, " ", users.last_name) as user_name,
    users.id as user_id
    FROM artworks_ordered LEFT JOIN artworks
    ON artworks.id = artworks_ordered.artwork_id
    LEFT JOIN orders ON orders.id = order_id
    LEFT JOIN users ON users.id = orders.user_id
    WHERE artworks_ordered.order_id = ?
  `, [order_id])

  await Promise.all(results.map(
    async(artwork)=>{
      const thumbnail = await getThumbnail(artwork.id)
      const cname = await getSpecificCategory(artwork.category_id)
      const tags = await getSpecificTags(artwork.id)
      artwork.thumbnail = thumbnail
      artwork.cname = cname
      artwork.tags = tags
      return artwork
    }
  ))

  connection.end()

  return results
}

const getOrdersOfUser = async (user_id) => {
  const connection = await makeConnection()

  const [results] = await connection.query(`
    SELECT id, time_ordered FROM orders WHERE user_id = ?
  `, [user_id])

  let orderDataCollection = results
  if(results.length){
    orderDataCollection = await Promise.all(results.map(
      async(ord)=>{
        const orderData = {time_ordered: ord.time_ordered}
        const res = await getOrderData(ord.id)
        orderData.totalCost = res.map(item => item.cost).reduce((prev, item)=>prev+item)
        orderData.items = res.map((item)=>{
          const { thumbnail, cname, tags, price, quantity, id, cost, title, artist_name } = item
          return { thumbnail, cname, tags, price, quantity, id, cost, title, artist_name }
        })
        return orderData
      }
    ))

    orderDataCollection.sort((a, b) => b.time_ordered - a.time_ordered)
  }
  
  connection.end()

  return orderDataCollection
}

const getOrders = async () => {
  const connection = await makeConnection()

  const [results] = await connection.execute("SELECT id, time_ordered FROM orders")

  let orderDataCollection = results
  if(results.length){
    orderDataCollection = await Promise.all(results.map(
      async(ord)=>{
        const orderData = {time_ordered: ord.time_ordered}
        const res = await getOrderData(ord.id)
        orderData.totalCost = res.map(item => item.cost).reduce((prev, item)=>prev+item)
        orderData.items = res.map((item)=>{
          const { thumbnail, cname, tags, price, quantity, id, cost, title, artist_name } = item
          return { thumbnail, cname, tags, price, quantity, id, cost, title, artist_name }
        })
        orderData.user = {user_name: res[0].user_name, user_id: res[0].user_id }

          return orderData
      }
    ))

    orderDataCollection.sort((a, b) => b.time_ordered - a.time_ordered)
  }
  
  connection.end()

  return orderDataCollection
}

const getUnansweredMessages = async() => {
  const connection = await makeConnection() 
  const [messages] = await connection.execute(
      `SELECT id, email, message_title, message_txt, message_time
      FROM messages_to_administrator
      WHERE answered = false AND removed = false
      `
    )
  connection.end()

  return messages
}



const checkIfFeatured = async (artwork_id) => {
  const connection = await makeConnection()

  const [prev] = await connection.query(`
      SELECT removed FROM featured WHERE artwork_id = ?
  `, [artwork_id])
  connection.end()
  if(prev.length){
    return prev[0].removed ? false : true
  }else{
    return false
  }
}

const getQuantityOfArtworkInStock = async (artwork_id) => {
  const connection = await makeConnection()

  const [res] = await connection.query(`
    SELECT quantity FROM artworks WHERE id = ?
  `, [artwork_id])

  connection.end()

  return res[0].quantity
}


export {
    getUser, 
    getCategories, 
    searchArtworks, 
    getFeatured, 
    getThumbnail, 
    checkIfRegistered, 
    checkEmail,
    getUserWithId,
    getDataOfArtwork,
    getReviewsOfArtwork,
    checkIfArtworkInStock,
    getShoppingListItems,
    getSpecificCategory,
    getWishlisted,
    checkIfWishlisted,
    getOrdersOfUser,
    getUnapprovedReviews,
    getReviewsOfUser,
    getOrders,
    getUnansweredMessages,
    getRegisteredUsers,
    checkIfFeatured,
    findArtworkWithId,
    getQuantityOfArtworkInStock
}