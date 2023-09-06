import { createConnection } from "mysql2/promise"
import nodemailer from 'nodemailer'
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const client_host = "http://localhost:3001"


const makeConnection = async () =>
  createConnection({
          host: "localhost",
          port: 3306,
          user: "root",
          password: "1997",
          database: "ecommerce"
      })

const getUser = async (email, password) => {
  const connection = await makeConnection()
  const [results] = await connection.query(
        `SELECT id, last_name, first_name, email, address, is_admin FROM users WHERE email = ? AND passw = ?;`,
        [email, password]
      )

  connection.end()

  const user = results[0]

  return user
}

const getUserWithId = async (id) => {
    const connection = await makeConnection()
    const [results] = await connection.query(
          `SELECT last_name, first_name, email, address, is_admin FROM users WHERE id = ?;`,
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
      data.push(parseInt(min), parseInt(max))
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

const getFeatured = async () => { 
  const connection = await makeConnection()  
  const [artwork_ids] = await connection.execute(`SELECT artwork_id FROM featured WHERE removed=false ORDER BY date_featured DESC LIMIT 2`)

  const question_marks = artwork_ids
                          .slice(1)
                          .map(
                            (id)=>{return "?"}
                          ).join(', ')
  const [artworks] = await connection.query("SELECT id, title, price FROM artworks WHERE id IN (" + question_marks + ")",
  [
    artwork_ids.map(
      obj => {
        return (
            obj.artwork_id
          )
      }
    )
    ]
  )

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

const checkIfRegistered = async (email) => {
    const connection = await makeConnection()
    const [results, fields] = await connection.query(
        `SELECT id, is_admin FROM users WHERE email = ?;`, [email]
      )
    connection.end()
    return results.length !== 0
}

const registerUser = async (last_name, first_name, email, password, address, phone_number) =>{
    const connection = await makeConnection()
    const data = [last_name, first_name, email, password, address]
    if(phone_number){
      data.push(phone_number)
    }
    await connection.query(
        `
          insert into users (last_name, first_name, email, passw, address
            ${
            phone_number ? `, phone_number` : ""
          }) 
          values (
            ?,
            ?,
            ?,
            ?,
            ?
            ${
              phone_number ? `, ? ` : ""
            }
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
  console.log(JSON.stringify(reviews))
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
  }
  connection.end()

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
    saveMessgeToAdministrator
}