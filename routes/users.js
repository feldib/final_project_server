import { Router } from 'express';
const router = Router();
import { getFeatured, getThumbnail, checkIfRegistered, registerUser, saveMessgeToAdministrator } from '../dbAPI.js'


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

router.get('/shopping_cart', function(req, res){
  if(loggedIn){
    //get items_added_to_shopping_cart based on userid
    const items = items_added_to_shopping_cart
    if(items){
      res.end(JSON.stringify(items))
    }else{
      res.end("Your shopping cart is empty")
    }
  }else{
    res.end('No data. User is not logged in')
  }
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

//get wishlist  items
const items_added_to_wishlist = [
  {thumnail: "as", title: "Spring", artist: "Boticelli", price:3, quantity:3, tags:["Italian"], categories: ["painting", "oil paining"]},
  {thumnail: "sdf", title: "David", artist: "Michelangelo", price:2, quantity:6, tags:["French"], categories: ["painting", "oil paining"]}
]

router.get('/shopping_cart', function(req, res){
  if(loggedIn){
    //get items_added_to_wishlist based on userid
    const items = items_added_to_wishlist
    if(items){
      res.end(JSON.stringify(items))
    }else{
      res.end("Your wishlist is empty")
    }
  }else{
    res.end('No data. User is not logged in')
  }
})

//save to shopping cart
router.post('/shopping_cart', function(req, res){
  const individual_users_shopping_cart = [
    {id: "0", thumnail: "as", title: "Spring", artist: "Boticelli", price:3, quantity:3, tags:["Italian"], categories: ["painting", "oil paining"]}
  ]
  const new_item = req.body
  if(loggedIn){
    if(new_item.quantity != 0){
      const item = individual_users_shopping_cart.find((artwork)=>{
        return artwork.id === new_item.id
      })

      if(item){
        item.quantity++
      }
      
      else{
        individual_users_shopping_cart.push(new_item)
      }

      res.end(JSON.stringify(individual_users_shopping_cart))
    }else{
      res.end('No pieces left of item')
    }
    
  }else{
    res.end('No success. User is not logged in')
  }
})

//save to wishlist 
router.post('/wishlist', function(req, res){
  const individual_users_wishlist = [
    {id: "0", thumnail: "as", title: "Spring", artist: "Boticelli", price:3, quantity:3, tags:["Italian"], categories: ["painting", "oil paining"]}
  ]
  const new_item = req.body
  if(loggedIn){
    if(new_item.quantity != 0){
      const item = individual_users_wishlist.find((artwork)=>{
        return artwork.id === new_item.id
      })

      if(!item){
        individual_users_wishlist.push(new_item)
      }

      res.end(JSON.stringify(individual_users_wishlist))
    }else{
      res.end('No pieces left of item')
    }
    
  }else{
    res.end('No success. User is not logged in')
  }
})

//post review
const reviews = [{user_id: "0", text: "blabla"}]

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
  const {last_name, first_name, email, password, address, phone_number} = req.body

  const registered = await checkIfRegistered(email)
  console.log(registered)
  if(registered){
    res.end("There is a user with this email already")
  }else if(
    !last_name ||
    !first_name ||
    !email ||
    !password ||
    !address
  ){
    res.end("missing data")
  }else{
    await registerUser(last_name, first_name, email, password, address, phone_number)
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

//post invoice data
const invoices = [
  { id: "0", 
    first_name:"Elemér", 
    last_name:"Horváth", 
    address:"Malmö, Sweden", 
    phone:"+36 1 788 7777",
    order_id: "124"
  },
  { id: "1", 
    first_name:"Dezső", 
    last_name:"Lakatos-Weißburger", 
    address:"Oslo, Norway", 
    phone:"+33 7 420 7777",
    order_id: "678765"
  },
]

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