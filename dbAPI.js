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
  const [tag_ids] = await connection.query(
    `SELECT tag_id FROM artwork_tags WHERE artwork_id=? AND removed = false;`, [artwork_id]
  )
  const tags = await Promise.all(
    tag_ids.map(async (obj) =>{
        const tag_id = obj.tag_id
        const [result] = await connection.query(
          `SELECT id, tname FROM tags WHERE id=? AND removed = false;`, [tag_id]
        )
        const tag = result[0]
        return tag
    })
  )
  connection.end()
  return tags
}

const searchArtworks = async (min, max, title, artist_name, category_id, order, n) => {
  const connection = await makeConnection()

  let sql_query = "SELECT id, title, artist_name, price, quantity, category_id, date_added FROM artworks"

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
      sql_query += ` price BETWEEN ${min} AND ${max} `
      needs_and=true
    }
    else if(min){
      sql_query += ` price > ${min} `
      needs_and=true
    }
    else if(max){
      sql_query += ` price < ${max} `
      needs_and=true
    }

    if(title){
      if(needs_and){
        sql_query += " AND "
      }else{
        needs_and=true
      }
      sql_query += ` LOWER(title) LIKE '%${title.toLowerCase()}%' `
      needs_and=true
    }

    if(artist_name){
      if(needs_and){
        sql_query += " AND "
      }else{
        needs_and=true
      }
      sql_query += ` LOWER(artist_name) LIKE '%${artist_name.toLowerCase()}%' `
    }

    if(category_id){
      if(needs_and){
        sql_query += " AND "
      }else{
        needs_and=true
      }
      sql_query += ` category_id = ${category_id} `
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
      sql_query += ` LIMIT ${n} `
    }
  }

  const [artworks] = await connection.execute(sql_query + ";")
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
  const [artworks] = await connection.execute(`SELECT id, title, price FROM artworks WHERE id IN (${
    artwork_ids.map(
      obj => {
        return (
          Array.from(
            Object.values(obj)
          )[0]
        )
      }
    )
    .join(", ")
  })`)

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
    await connection.execute(
        `
          insert into users (last_name, first_name, email, passw, address
            ${
            phone_number ? `, phone_number` : ""
          }) 
          values (
            "${last_name}",
            "${first_name}",
            "${email}",
            "${password}",
            "${address}"
            ${
              phone_number ? `, "${phone_number}"` : ""
            }
          );`
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
                user : "practiceforfinalprojectserver@outlook.hu",
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
        from: '"practiceforfinalprojectserver@outlook.hu',
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
    res.end("You are not authenticated")
}else{
    req.id = req.session.userid
    next()
}
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
    verifyUser
}