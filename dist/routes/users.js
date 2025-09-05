import { Router } from "express";
const router = Router();
import { verifyUser } from "../db_api/verify.js";
import { checkIfRegistered, checkIfArtworkInStock, getShoppingListItems, getWishlisted, checkIfWishlisted, getOrdersOfUser, getReviewsOfUser, } from "../db_api/get_data.js";
import { registerUser, saveMessgeToAdministrator, addToShoppingList, makeOrder, } from "../db_api/add_data.js";
import { setShoppingCartItemQuantityToZero, increaseShoppingCartItemQuantity, decreaseShoppingCartItemQuantity, replaceSavedShoppingCart, } from "../db_api/change_data.js";
import { removeFromWishlisted, updateUserData } from "../db_api/change_data.js";
router.post("/message_to_administrator", function (req, res) {
    const { email, title, message } = req.body;
    try {
        console.log(req.body);
        saveMessgeToAdministrator(email, title, message);
        res.end();
    }
    catch {
        res.status(401).end();
    }
});
router.get("/shopping_cart", verifyUser, async function (req, res) {
    const artworks = await getShoppingListItems(req.id);
    res.json(artworks);
});
router.post("/shopping_cart", verifyUser, async function (req, res) {
    const artwork_id = req.body.artwork_id;
    const artworkInStock = await checkIfArtworkInStock(artwork_id);
    if (artworkInStock) {
        await addToShoppingList(req.id, artwork_id);
    }
    else {
        res.status(400);
    }
    res.end();
});
router.post("/remove_item_from_shopping_cart", verifyUser, async function (req, res) {
    const artwork_id = req.body.artwork_id;
    await setShoppingCartItemQuantityToZero(req.id, artwork_id);
    res.end();
});
router.post("/increase_shopping_sart_item_quantity", verifyUser, function (req, res) {
    const artwork_id = req.body.artwork_id;
    increaseShoppingCartItemQuantity(req.id, artwork_id)
        .then(() => {
        res.end();
    })
        .catch(() => {
        res.status(400).end();
    });
});
router.post("/decrease_shopping_sart_item_quantity", verifyUser, async function (req, res) {
    const artwork_id = req.body.artwork_id;
    await decreaseShoppingCartItemQuantity(req.id, artwork_id);
    res.end();
});
router.get("/wishlisted", verifyUser, async function (req, res) {
    const n = req.query.n;
    const artworks = await getWishlisted(req.id, n);
    res.json(artworks);
});
router.post("/wishlisted", verifyUser, async function (req, res) {
    const artwork_id = req.body.artwork_id;
    res.end();
});
router.post("/remove_from_wishlisted", verifyUser, async function (req, res) {
    const artwork_id = req.body.artwork_id;
    await removeFromWishlisted(req.id, artwork_id);
    res.end();
});
router.post("/is_wishlisted", verifyUser, async function (req, res) {
    const artwork_id = req.body.artwork_id;
    const is_wishlisted = await checkIfWishlisted(req.id, artwork_id);
    res.json(is_wishlisted);
});
router.post("/update_data", verifyUser, async (req, res) => {
    await updateUserData(req.id, req.body.field_name, req.body.value);
    res.end();
});
router.post("/new_user", async function (req, res) {
    const { last_name, first_name, email, password } = req.body;
    const registered = await checkIfRegistered(email);
    console.log(registered);
    if (registered) {
        res.end("There is a user with this email already");
    }
    else if (!last_name || !first_name || !email || !password) {
        res.status(400).end();
    }
    else {
        await registerUser(last_name, first_name, email, password);
        res.end();
    }
});
router.post("/make_order", verifyUser, async (req, res) => {
    await makeOrder(req.id, req.body.invoice_data);
    res.end();
});
router.post("/leave_review", verifyUser, async (req, res) => {
    res.end();
});
router.get("/get_orders_of_user", verifyUser, async function (req, res) {
    const orderData = await getOrdersOfUser(req.id);
    res.json(orderData);
});
router.get("/get_reviews_of_user", verifyUser, async function (req, res) {
    const reviewData = await getReviewsOfUser(req.id);
    res.json(reviewData);
});
router.post("/replace_saved_shopping_cart", verifyUser, async (req, res) => {
    await replaceSavedShoppingCart(req.id, req.body.shopping_cart);
    res.end();
});
export default router;
//# sourceMappingURL=users.js.map