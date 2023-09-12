import { createConnection } from "mysql2/promise"
import nodemailer from 'nodemailer'
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const client_host = "http://localhost:3001"


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
    console.log(email, password)
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

const searchArtworks = async (min, max, title, artist_name, category_id, order, n) => {
  const connection = await makeConnection()

  let sql_query = "SELECT id, title, artist_name, price, quantity, category_id, date_added FROM artworks"

  const data = []

  //mindig hozzáadni a mostani szöveget ?-lel, és pusholni az arraybe magát a változót!
  let needs_and = false
  if(
    min ||
    max || 
    title || 
    artist_name ||
    category_id  
  ){
    sql_query += " WHERE "

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

    if(order){
      sql_query += " ORDER BY date_added"
      if(order==="asc"){
        sql_query += " ASC "
      }else if(order==="desc"){
        sql_query += " DESC "
      }
    }

    if(n){
      sql_query += ` LIMIT ? `
      data.push(parseInt(n))
    }
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

const getFeatured = async (n) => { 
  const connection = await makeConnection()  
  const [artwork_ids] = await connection.execute(`
    SELECT artwork_id FROM featured WHERE removed=false ORDER BY date_featured DESC
    ${n ? ` LIMIT ${n}` : ""}
  `)

  const [results] = await connection.query(
    `SELECT id, title, price FROM artworks WHERE id IN (${
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

const sendLinkToResetPassword = async ({email, id}) => {
    try{
        const transporter = nodemailer.createTransport({
            service : "hotmail",
            auth : {
                user : "apitlibamarmindennevfoglalt@outlook.hu",
                pass : "hHsD633!"
            },
            tls: {
                rejectUnauthorized: false
              }
        })
        
        const token = jwt.sign(
            {id}, 
            process.env.SECRET_KEY,
            {expiresIn: '1d'}
        )

        const mailOptions = {
        from: 'apitlibamarmindennevfoglalt@outlook.hu',
        to: `${email}`,
        subject: 'Reset password',
        html: `
            <p>Click here to reset your password: </p>
            <a href = "${client_host}/reset_password?token=${token}&email=${email}">Link</a>
        `
        };
          
        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
        })
    }catch(error){
        console.log(error)
    }
    
}

const resetPassword = async (new_password, email) => {
  const connection = await makeConnection()
  await connection.query(
        `UPDATE users SET passw = ? WHERE email = ?;`, [new_password, email]
  )
}

const verifyPaswordToken = (req, res, next) => {
    const {token} = req.body
    if(!token){
      res.end("You are not authenticated")
    }else{
      jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if(err){
          console.log(err)
          res.end("Tokens do not match")
        }else{
          next()
        }
      })
    }
  }

const verifyUser = (req, res, next) => {
if(!req.session.userid){
    // res.status(401).end("You are not authenticated")
    res.end("You are not authenticated")
}else{
    req.id = req.session.userid
    next()
}
}

const verifyAdmin = (req, res, next) => {
  if(!req.session.isadmin){
      res.status(401).end("You are not authenticated")
  }else{
      req.isadmin = req.session.isadmin
      next()
  }
  }

const getReviews = async(artwork_id) => {
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
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      WHERE reviews.approved = false AND reviews.removed = false`
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
  console.log(artwork)
  return artwork
}

const saveMessgeToAdministrator = async (email, title, message) =>{
  const connection = await makeConnection()

  await connection.query(`
      INSERT INTO messages_to_administrator(email, message_title, message_txt)
      VALUES(?, ?, ?)
  `, [email, title, message])

  connection.end()
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

const addNewItemToShoppingList = async (user_id, artwork_id) => {
  const connection = await makeConnection()

  await connection.query(`
      INSERT INTO 
      artworks_in_shopping_list(user_id, quantity, artwork_id) 
      VALUES(?, 1, ?)
  `, [user_id, artwork_id])

  connection.end()
}

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

const addToShoppingList = async (user_id, artwork_id) => {
  const connection = await makeConnection()

  await connection.query(`
      UPDATE artworks SET quantity = quantity-1 WHERE id = ?
  `, [artwork_id])

  const [prev] = await connection.query(`
      SELECT * FROM artworks_in_shopping_list WHERE user_id = ? AND artwork_id = ? 
  `, [user_id, artwork_id])

  console.log(prev)

  if(prev[0]){
    await incrementItemInShoppingList(user_id, artwork_id)
  }else{
    await addNewItemToShoppingList(user_id, artwork_id)
  }
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
  console.log("prev:", JSON.stringify(prev))
  connection.end()
  if(prev.length){
    return prev[0].removed ? false : true
  }else{
    return false
  }
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

const makeOrder = async (user_id, invoice_data) => {
  const connection = await makeConnection()
  const shoppingListItems = await getShoppingListItems(user_id)
  if(shoppingListItems.length){
    await connection.query(`
    INSERT INTO orders(user_id) VALUES(?)
    `, [user_id])

    const [results] = await connection.query(`
      SELECT id FROM orders WHERE user_id = ?
      AND time_ordered = (SELECT MAX(time_ordered) FROM orders WHERE user_id = ?)
    `, [user_id, user_id])

    const order_id = results[0].id

    await Promise.all(shoppingListItems.map(
      async(item)=>{
        console.log(JSON.stringify(item))
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

const getOrderData = async (order_id) => {
  const connection = await makeConnection()

  const [results] = await connection.query(`
    SELECT artworks_ordered.price * artworks_ordered.quantity as cost, 
    artworks.category_id, artworks_ordered.price, artworks_ordered.quantity, artworks.id,
    artworks.title, artworks.artist_name 
    FROM artworks_ordered LEFT JOIN artworks
    ON artworks.id = artworks_ordered.artwork_id
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
  console.log(results)
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

const leaveReview = async (user_id, artwork_id, title, review_text) =>{
  const connection = await makeConnection()

  await connection.query(`
      INSERT INTO reviews(user_id, artwork_id, title, review_text)
      VALUES(?, ?, ?, ?)
  `, [user_id, artwork_id, title, review_text])

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

export {
    getUser, 
    getCategories, 
    searchArtworks, 
    getFeatured, 
    getThumbnail, 
    checkIfRegistered, 
    registerUser, 
    checkEmail,
    sendLinkToResetPassword,
    resetPassword,
    getUserWithId,
    verifyPaswordToken,
    verifyUser,
    getDataOfArtwork,
    getReviews,
    saveMessgeToAdministrator,
    checkIfArtworkInStock,
    addToShoppingList,
    getShoppingListItems,
    getSpecificCategory,
    setShoppingCartItemQuantityToZero,
    increaseShoppingCartItemQuantity,
    decreaseShoppingCartItemQuantity,
    addToWishlisted,
    removeFromWishlisted,
    getWishlisted,
    checkIfWishlisted,
    updateUserData,
    makeOrder,
    getOrdersOfUser,
    leaveReview,
    getUnapprovedReviews,
    verifyAdmin,
    approveReview,
    removeReview
}