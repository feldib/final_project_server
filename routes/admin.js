import { Router } from 'express';
const router = Router()

import { 
  getUnapprovedReviews,
  verifyAdmin,
  approveReview,
  removeReview
} from '../dbAPI.js'

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/admin_page', function(req, res, next){
  res.end('Admin Page Data')
})

router.get('/get_unapproved_reviews', verifyAdmin, async function(req, res){
    const reviews = await getUnapprovedReviews()
    console.log(reviews)
    res.json(reviews)  
})

router.post('/approve_review', verifyAdmin, async function(req, res){
  const reviews = await approveReview(req.body.review_id)
  res.end()
})

router.post('/disapprove_review', verifyAdmin, async function(req, res){
  const reviews = await removeReview(req.body.review_id)
  res.end()
})

export default router;
