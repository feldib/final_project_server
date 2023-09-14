import { Router } from 'express';
const router = Router()

import { 
  getUnapprovedReviews,
  verifyAdmin,
  approveReview,
  removeReview,
  getOrders,
  getUnansweredMessages,
  sendReplyToMessage,
  getRegisteredUsers,
  getOrdersOfUser,
  removeArtwork,
  checkIfFeatured,
  addToFeatured,
  removeFromFeatured,
  addNewArtwork
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

router.get('/users', verifyAdmin, async function(req, res){
  const users = await getRegisteredUsers()
  res.json(users)
})

router.post('/get_orders_of_user', verifyAdmin, async function(req, res){
  const orderData = await getOrdersOfUser(req.body.user_id)
  res.json(orderData)
})

router.post('/remove_artwork', verifyAdmin, async function(req, res){
  const artwork = await removeArtwork(req.body.artwork_id)
  res.end()
})

router.post('/is_featured', verifyAdmin, async function(req, res){
  const artwork_id = req.body.artwork_id
  const is_wishlisted = await checkIfFeatured(artwork_id)
  res.json(is_wishlisted)
})

router.post('/featured', verifyAdmin, async function(req, res){
  const artwork_id = req.body.artwork_id
    await addToFeatured(artwork_id)
  res.end()
})

router.post('/remove_from_featured', verifyAdmin, async function(req, res){
  const artwork_id = req.body.artwork_id
  await removeFromFeatured(artwork_id)
  res.end()

})

router.post('/add_new_artwork', verifyAdmin, async function(req, res){
  const artwork = req.body.artwork
  await addNewArtwork(artwork)
  res.end()

})


export default router;
