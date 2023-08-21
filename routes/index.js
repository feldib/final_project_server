const express = require('express')
const router = express.Router()
const mysql = require("mysql2/promise")
const crypto = require("crypto")

const makeConnection = async () =>
  mysql.createConnection({
          host: "localhost",
          port: 3306,
          user: "root",
          password: "1997",
          database: "ecommerce"
      })

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* logging in */
/* 
  req.body => username: "", password: ""} 
*/
router.post('/login', async function(req, res){
  const {email, password} = req.body

  const connection = await makeConnection()

  const [results, fields] = await connection.execute(
        `SELECT id, last_name, first_name, email, address, is_admin FROM users WHERE email = "${email}" AND passw = "${password}";`
      )

  const user = results[0]

  if(user){
    await connection.execute(
      `UPDATE users SET logged_in = true WHERE id = ${user.id};`
    )
    //should redirect?
    res.end(JSON.stringify(user))

  }else{
    res.end("Wrong username or password!")
  }
})
//LOG OUT?!!

router.get('/categories', async function(req, res){
  const connection = await makeConnection()
  const [results, fields] = await connection.execute("SELECT id, cname FROM categories WHERE removed = false;")
  connection.end()
  if(results.length){
    res.json(results)
  }else{
    res.end("No categories found.")
  }
})

/* search (and order asc or desc) artwork */

router.get('/search_artworks', async function(req, res){
  const {min, max, title, artist_name, category_id, order, n} = req.query

  const connection = await makeConnection()

  let sql_query = "SELECT id, title, artist_name, price, quantity, date_added FROM artworks"

  let needs_and = false
  console.log(req.query)
  if(Object.keys(req.query).length){
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
      sql_query += " ORDER BY date_added "
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

  const [results, fields] = await connection.execute(sql_query + ";")
  connection.end()
  console.log(sql_query)
  if(results.length){
    res.json(results)
  }
  else{
    res.end("No results.")
  }

})

const artworks = [
  {id:"0", thumnail: "as", title: "Spring", artist: "Boticelli", price:"3", quantity:"3", tags:["Italian"], categories: ["painting", "oil paining"]},
  {id:"1", thumnail: "sdf", title: "David", artist: "Michelangelo", price:"2", quantity:"6", tags:["French"], categories: ["painting", "oil paining"]}
]

//artwork page
router.get('/artwork', function(req, res){
  const {id} = req.query
  //id should not be returned!!!
  const item = artworks.find((artwork)=>{
    return artwork.id === id
  })
  if(item){
    res.end(JSON.stringify(item))
  }else{
    res.end("Artwork not found")
  }
})


module.exports = router;