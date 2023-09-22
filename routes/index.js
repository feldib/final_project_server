import { Router } from 'express'
const router = Router()

import { verifyUser, verifyPaswordToken } from '../db_api/verification.js';

import { 
  getDataOfArtwork,
  getUser, 
  getUserWithId, 
  getCategories, 
  searchArtworks, 
  checkEmail, 
  getReviewsOfArtwork,
  getFeatured,
  getNewestArtworks,
  findArtworkWithId
} from '../db_api/get_data_from_db.js'

import { sendLinkToResetPassword } from '../db_api/send_email.js'

import { 
  resetPassword 
} from '../db_api/change_value_in_database.js'

router.post('/login', async function(req, res){
  const {email, password} = req.body
  const user = await getUser(email, password)
  if(user !== undefined){
    console.log(user)
    req.session.userid = user.id
    req.session.isadmin = user.is_admin
    res.json(user)
  }else{
    res.status(401).end()
  }
})

router.get('/logged_in', verifyUser, async function(req, res){
    const user = await getUserWithId(req.id)
    res.json({user})
})

router.get('/log_out', async function(req, res){
  req.session.destroy()
  res.end("Logged out successfully")
})

router.post('/forgot_password', async function(req, res){
  const {email} = req.body

  const {registered, id} = await checkEmail(email)

  if(registered){
    await sendLinkToResetPassword({id, email})
  }

  res.end()

})

router.post('/reset_password', verifyPaswordToken, async function(req, res){
  const {new_password, email} = req.body
  resetPassword(new_password, email)
  res.end()
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
  const {min, max, title, artist_name, category_id, order, n, offset} = req.query
  const results = await searchArtworks(min, max, title, artist_name, category_id, order, n, offset)
  if(!results.length){
    console.log("No results for the search.")
  }
  res.json(results)
})


router.get('/find_artwork_by_id', async function(req, res){
  const {artwork_id} = req.query
  const artwork = await findArtworkWithId(artwork_id)
  res.json(artwork)
})



//artwork page
router.get('/artwork', async function(req, res){
  const {id} = req.query
  const artwork = await getDataOfArtwork(id)
  if(!artwork){
    console.log("Artwork was not found.")
  }
  res.json(artwork)
})

router.get('/reviews', async function(req, res){
  const {id} = req.query
  const reviews = await getReviewsOfArtwork(id)
  if(!reviews.length){
    console.log("No categories found.")
  }
  res.json(reviews)
})

router.get('/featured', async function(req, res){  
  const n = req.query.n
  const artworks = await getFeatured(n)
  let results = artworks
  if(!artworks.length){
    console.log("No featured artworks")
  }
  res.json(results)
})

router.get('/newest', async function(req, res){  
  const n = req.query.n
  const artworks = await getNewestArtworks(n)
  let results = artworks
  if(!artworks.length){
    console.log("No artworks")
  }
  res.json(results)
})


export default router;