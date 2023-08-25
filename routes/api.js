import { Router } from 'express';
var router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/counter/increment', function(req, res, next){
  res.end('Admin Page Data')
})

router.get('/counter/decrement', function(req, res, next){
    res.end('Admin Page Data')
  })

export default router;
