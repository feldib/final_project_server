import { Router } from 'express';
const router = Router()

import { 
  getUnapprovedReviews,
  verifyAdmin,
  approveReview,
  removeReview,
  getOrders,
  getUnansweredMessages,
  sendReplyToMessage
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

router.get('/get_orders', verifyAdmin, async function(req, res){
  const orderData = await getOrders()
  res.json(orderData)
})

router.get('/unanswered_messages', verifyAdmin, async function(req, res){
  const messages = await getUnansweredMessages()
  res.json(messages)
})

router.post('/reply_to_message', verifyAdmin, async function(req, res){
  await sendReplyToMessage(req.body.message_id, req.body.email, req.body.reply_title, req.body.reply_text)
  res.end()
})

export default router;
