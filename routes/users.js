import { Router } from 'express';
const router = Router();
import { 
  getFeatured, 
  getThumbnail, 
  checkIfRegistered, 
  registerUser, 
  saveMessgeToAdministrator,
  checkIfArtworkInStock,
  addToShoppingList,
  getShoppingListItems,
  setShoppingCartItemQuantityToZero,
  increaseShoppingCartItemQuantity,
  decreaseShoppingCartItemQuantity,
  addToWishlisted,
  removeFromWishlisted,
  getWishlisted,
  checkIfWishlisted
} from '../dbAPI.js'


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/user_page', function(req, res, next){
  res.end('User Page Data')
})


router.get('/recommendation/featured/', async function(req, res){  
  const artworks = await getFeatured()
  let results = artworks
  if(!artworks.length){
    console.log("No featured artworks")
  }else{
    results = await Promise.all(artworks.map(
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
  res.json(results)
})

router.post('/message_to_administrator', function(req, res){
  const {email, title, message} = req.body
  try{
    console.log(req.body)
    saveMessgeToAdministrator(email, title, message)
    res.end()
  }catch{
    res.status(401).end()
  }
})

router.get('/shopping_cart', async function(req, res){
  const artworks = await getShoppingListItems(req.session.userid)
  res.json(artworks)
})

router.post('/shopping_cart', async function(req, res){
  const artwork_id = req.body.artwork_id

  const artworkInStock = await checkIfArtworkInStock(artwork_id)

  if(artworkInStock){
    await addToShoppingList(req.session.userid, artwork_id)
  }else{
    res.status(400)
  }

  res.end()
})

router.post('/remove_item_from_shopping_cart', async function(req, res){
  const artwork_id = req.body.artwork_id
  await setShoppingCartItemQuantityToZero(req.session.userid, artwork_id)
  res.end()
})

router.post('/increase_shopping_sart_item_quantity', async function(req, res){
  const artwork_id = req.body.artwork_id
  await increaseShoppingCartItemQuantity(req.session.userid, artwork_id)
  res.end()
})

router.post('/decrease_shopping_sart_item_quantity', async function(req, res){
  const artwork_id = req.body.artwork_id
  await decreaseShoppingCartItemQuantity(req.session.userid, artwork_id)
  res.end()
})

router.get('/wishlisted', async function(req, res){
  if(req.session.userid){
    const artworks = await getWishlisted(req.session.userid)
    res.json(artworks)
  }else{
    res.status(400)
  }
})

router.post('/wishlisted', async function(req, res){
  const artwork_id = req.body.artwork_id
  if(req.session.userid){
      await addToWishlisted(req.session.userid, artwork_id)
  }
  res.end()
})

router.post('/remove_from_wishlisted', async function(req, res){
  if(req.session.userid){
      const artwork_id = req.body.artwork_id
      await removeFromWishlisted(req.session.userid, artwork_id)
  }
  res.end()

})

router.post('/is_wishlisted', async function(req, res){
  if(req.session.userid){
    const artwork_id = req.body.artwork_id
    const is_wishlisted = await checkIfWishlisted(req.session.userid, artwork_id)
    res.json(is_wishlisted)
  }else{
    res.status(400)
  }
})

router.post('/reviews', function(req, res){
  const {title, text} = req.body
  if(loggedIn){
    reviews.push({user_id: userID, title, text})
  }
  res.end(JSON.stringify(reviews))
})

const users = [
  {id: "0", email: "user@user.com", first_name:"Béla", last_name:"Nagy", password: "user", address:"Bp, Hungary", phone:"+36 1 788 8888", isAdmin: false},
  {id: "1", email: "admin@admin.com", first_name:"Elemér", last_name:"Horváth", password: "admin", address:"Malmö, Sweden", phone:"+36 1 788 7777",  isAdmin: true}
]

//registering needs to be changed!
router.post('/new_user', async function(req, res){
  const {last_name, first_name, email, password} = req.body

  const registered = await checkIfRegistered(email)
  console.log(registered)
  if(registered){
    res.end("There is a user with this email already")
  }else if(
    !last_name ||
    !first_name ||
    !email ||
    !password
  ){
    res.end("missing data")
  }else{
    await registerUser(last_name, first_name, email, password)
    res.end("true")
  }
})

//get invoice data
router.get('/invoice_data', function(req, res){
  if(loggedIn){
    //get invoice_data of user with userID
    const user = users.find((user)=>{
      return user.id === userID
    })
    const {first_name, last_name, address, email, phone} = user

    const invoice_data = {first_name, last_name, address, email, phone}

    res.end(JSON.stringify(invoice_data))

  }else{
    res.end('No data. User is not logged in')
  }
})


router.post('/invoice_data', function(req, res){
  if(loggedIn){
    // {first_name, last_name, address, email, phone, order_id}
    const new_invoice_data = req.body

    invoices.push({
      id: invoices.length,
      ...new_invoice_data
    })

    res.end(JSON.stringify(invoices))

  }else{
    res.end('No data. User is not logged in')
  }
})



export default router;