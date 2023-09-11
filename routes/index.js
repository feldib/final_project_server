import { Router } from 'express'
const router = Router()
import { getDataOfArtwork } from '../dbAPI.js'

import { 
  getUser, 
  getUserWithId, 
  getCategories, 
  searchArtworks, 
  checkEmail, 
  sendLinkToResetPassword, 
  resetPassword,
  verifyPaswordToken,
  verifyUser,
  getReviews,
  getOrdersOfUser,
  getFeatured
} from '../dbAPI.js'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', async function(req, res){
  const {email, password} = req.body
  const user = await getUser(email, password)
  if(user !== undefined){
    console.log(user)
    req.session.userid = user.id
    res.json(user)
  }else{
    res.status(401).end()
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
  const {min, max, title, artist_name, category_id, order, n} = req.query
  const results = await searchArtworks(min, max, title, artist_name, category_id, order, n)
  if(!results.length){
    console.log("No results for the search.")
  }
  res.json(results)
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
  const reviews = await getReviews(id)
  if(!reviews.length){
    console.log("No categories found.")
  }
  res.json(reviews)
})

router.get('/get_orders_of_user', async function(req, res){
  const orderData = await getOrdersOfUser(req.session.userid)
  res.json(orderData)
})

router.get('/featured', async function(req, res){  
  const reccomdendation = req.query.reccomdendation || false
  const artworks = await getFeatured(reccomdendation)
  let results = artworks
  if(!artworks.length){
    console.log("No featured artworks")
  }
  res.json(results)
})

export default router;