
var express = require('express');
var router = express.Router()


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* logging in */
/* 
  req.body => username: "", password: ""} 
*/

const users = [
  {id: 0, email: "user@user.com", password: "user", isAdmin: false},
  {id: 1, email: "admin@admin.com", password: "admin", isAdmin: true}
]


router.post('/login', function(req, res){
  const {email, password} = req.body
  const user = users.find(
    (u) => u.email === email && u.password === password
  )
  if(user){
    if(user.isAdmin){
      res.redirect('/admin/admin_page')
    }else{
      res.redirect('/users/user_page')
    }

  }else{
    res.end("Wrong username or password!")
  }
})


/* search artwork */

const artworks = [
  {id:"0", thumnail: "as", title: "Spring", artist: "Boticelli", price:"3", quantity:"3", tags:["Italian"], categories: ["painting", "oil paining"]},
  {id:"1", thumnail: "sdf", title: "David", artist: "Michelangelo", price:"2", quantity:"6", tags:["French"], categories: ["painting", "oil paining"]}
]

router.get('/search_artworks', function(req, res){
  const {min, max, title, name, categories, n} = req.query
  
  //get fitting results from server instead of this ->
  const results = artworks

  //shouldn't return id!!!
  res.end(JSON.stringify(results))

})

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
