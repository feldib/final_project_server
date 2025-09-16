import { Router } from "express";
const router = Router();
import fs from "fs/promises";
import { verifyAdmin } from "../db_api/verify.js";
import { getUnapprovedReviews, getOrders, getUnansweredMessages, getRegisteredUsers, getOrdersOfUser, checkIfFeatured, } from "../db_api/get_data.js";
import { approveReview, removeReview, removeArtwork, updateArtworkData, } from "../db_api/change_data.js";
import { sendReplyToMessage } from "../db_api/email.js";
const now = new Date();
import multer from "multer";
router.get("/is_admin", verifyAdmin, function (req, res) {
    res.json({ is_admin: true });
});
const newTumbnailStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, `public/images/${req.query.artwork_id}/thumbnail`);
    },
    filename(req, file, cb) {
        cb(null, `${req.query.artwork_id}_${now.getTime()}_${file.originalname}`);
    },
});
const uploadNewThumbnail = multer({ storage: newTumbnailStorage });
async function checkThumbnailPath(req, res, next) {
    const imagePath = `public/images/${req.query.artwork_id}/thumbnail`;
    await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
        if (err) {
            await fs.mkdir(imagePath, { recursive: true });
        }
    });
    next();
}
router.post("/thumbnail", verifyAdmin, checkThumbnailPath, uploadNewThumbnail.single("thumbnail"), function (req, res) {
    res.end();
});
router.get("/unapproved_reviews", verifyAdmin, async function (req, res) {
    const reviews = await getUnapprovedReviews();
    res.json(reviews);
});
router.post("/approve_review", verifyAdmin, async function (req, res) {
    const { id } = req.body;
    await approveReview(id);
    res.end();
});
router.post("/remove_review", verifyAdmin, async function (req, res) {
    const { id } = req.body;
    await removeReview(id);
    res.end();
});
router.get("/orders", verifyAdmin, async function (req, res) {
    const orders = await getOrders();
    res.json(orders);
});
router.get("/unanswered_messages", verifyAdmin, async function (req, res) {
    const messages = await getUnansweredMessages();
    res.json(messages);
});
router.post("/reply_to_message", verifyAdmin, async function (req, res) {
    const { message_id, email, reply_title, reply_text } = req.body;
    await sendReplyToMessage(message_id, email, reply_title, reply_text);
    res.end();
});
router.get("/users", verifyAdmin, async function (req, res) {
    const users = await getRegisteredUsers();
    res.json(users);
});
router.get("/orders_of_user", verifyAdmin, async function (req, res) {
    const { user_id } = req.query;
    const orders = await getOrdersOfUser(parseInt(user_id));
    res.json(orders);
});
router.post("/is_featured", verifyAdmin, async function (req, res) {
    const { artwork_id } = req.body;
    const featured = await checkIfFeatured(artwork_id);
    res.json(featured);
});
router.post("/remove_artwork", verifyAdmin, async function (req, res) {
    const { artwork_id } = req.body;
    await removeArtwork(artwork_id);
    res.end();
});
router.post("/update_artwork_data", verifyAdmin, async function (req, res) {
    const { artwork_id, field_name, value } = req.body;
    await updateArtworkData(artwork_id, field_name, value);
    res.end();
});
export default router;
//# sourceMappingURL=admin.js.map