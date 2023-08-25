import { Router } from 'express'
const router = Router()
import cookieParser from 'cookie-parser'
import jwt from "jsonwebtoken"
import sessions from 'express-session'

import { 
  getUser, 
  getUserWithId, 
  getCategories, 
  searchArtworks, 
  checkEmail, 
  sendLinkToResetPassword, 
  resetPassword,
  verifyPaswordToken,
  verifyUser 
} from '../dbAPI.js'

router.use(cookieParser())

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', async function(req, res){
  const {email, password} = req.body
  const user = await getUser(email, password)
  if(user !== undefined){
    req.session.userid = user.id
    res.json(user)
  }else{
    res.end("false")
  }
})

router.get('/logged_in', verifyUser, async function(req, res){
    const user = await getUserWithId(req.id)
    res.json({
      Status: "Success",
      user
    })
})

router.get('/log_out', async function(req, res){
  req.session.destroy()
  res.json({
    Status: "Logged out successfully"
  })
})

router.post('/forgot_password', async function(req, res){
  const {email} = req.body

  const {registered, id} = await checkEmail(email)

  if(registered){
    await sendLinkToResetPassword({id, email})
  }

})

router.post('/reset_password', verifyPaswordToken, async function(req, res){
  const {new_password, email} = req.body
  resetPassword(new_password, email)
  res.json({
    Status: "Success"

  })
})

router.get('/categories', async function(req, res){
  const categories = await getCategories()
  console.log(JSON.stringify(categories))
  if(!categories.length){
    console.log("No categories found.")
  }
  res.json(categories)
})

router.get('/search_artworks', async function(req, res){
  const {min, max, title, artist_name, category_id, order, n} = req.query
  const results = await searchArtworks(min, max, title, artist_name, category_id, order, n)
  if(!results.length){
    console.log("No results for the search.")
  }
  res.json(results)
})

//artwork page
router.get('/artwork', function(req, res){
  const {id} = req.query
  //id should not be returned!!!
  const item = artworks.find((artwork)=>{
    return artwork.id === id
  })
  if(!item){
    console.log("Artwork was not found.")
  }
  res.json(item)
})


export default router;