import { Router } from 'express';
var router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/admin_page', function(req, res, next){
  res.end('Admin Page Data')
})

export default router;
