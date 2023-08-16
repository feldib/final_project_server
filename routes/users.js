var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/user_page', function(req, res, next){
  res.end('User Page Data')
})

/* get reccomendation (for homepage) */
const loggedIn = true
const userID = 11
const reccomendation_possibilities = [
  "featured",
  "recently viewed",
  "wishlisted",
  "newest"
]

router.get('/', function(req, res){
  const reccomendation = req.query.rec
  if(reccomendation_possibilities.includes(reccomendation)){
    if(loggedIn){
      res.end(`Data recommended of 2 ${reccomendation} items`)
    }else{
      res.end('No data. User is not logged in')
    }
  }else{
    res.end("No such category")
  }
})

//get shopping cart items
const id = 420
const items_added_to_shopping_cart = [
  {thumnail: "as", title: "Spring", artist: "Boticelli", price:3, quantity:3, tags:["Italian"], categories: ["painting", "oil paining"]},
  {thumnail: "sdf", title: "David", artist: "Michelangelo", price:2, quantity:6, tags:["French"], categories: ["painting", "oil paining"]}
]

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
  {id: 0, email: "user@user.com", password: "user", isAdmin: false},
  {id: 1, email: "admin@admin.com", password: "admin", isAdmin: true}
]

//registering
router.post('/new_user', function(req, res){
  const new_user = req.body
  const user = users.find(
    (old_user) => old_user.email === new_user.email
  )
  if(user){
    res.end("There is a user with this email already")
  }else{
    users.push({...new_user, id: users.length, isAdmin: false})
    res.end(JSON.stringify(users))
  }
})




module.exports = router;