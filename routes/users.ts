import { Request, Response, Router } from "express";

import { checkIfArtworkInStock } from "../db_api/artwork.js";
import { saveMessageToAdministrator } from "../db_api/messages.js";
import { getOrdersOfUser, makeOrder } from "../db_api/orders.js";
import { getReviewsOfUser, leaveReview } from "../db_api/reviews.js";
import {
  addToShoppingList,
  decreaseShoppingCartItemQuantity,
  getShoppingListItems,
  increaseShoppingCartItemQuantity,
  replaceSavedShoppingCart,
  setShoppingCartItemQuantityToZero,
} from "../db_api/shopping_list.js";
import {
  checkIfRegistered,
  registerUser,
  updateUserData,
} from "../db_api/user.js";
import { verifyUser } from "../db_api/verify.js";
import {
  addToWishlisted,
  checkIfWishlisted,
  getWishlisted,
  removeFromWishlisted,
} from "../db_api/wishlist.js";
import { RegisterRequest, StandardResponse } from "../types/api.js";
import { HTTP } from "../utils/constants.js";

const router = Router();

router.post(
  "/message_to_administrator",
  function (req: Request, res: Response) {
    const { email, title, message } = req.body;
    try {
      saveMessageToAdministrator(email, title, message);
      res.end();
    } catch {
      res.status(HTTP.UNAUTHORIZED).end();
    }
  }
);

router.get(
  "/shopping_cart",
  verifyUser,
  async function (req: Request, res: Response) {
    const artworks = await getShoppingListItems(req.id!);
    res.json(artworks);
  }
);

router.post(
  "/shopping_cart",
  verifyUser,
  async function (req: Request, res: Response) {
    const artwork_id = req.body.artwork_id;

    const artworkInStock = await checkIfArtworkInStock(artwork_id);

    if (artworkInStock) {
      await addToShoppingList(req.id!, artwork_id);
    } else {
      res.status(HTTP.BAD_REQUEST);
    }

    res.end();
  }
);

router.put(
  "/shopping_cart",
  verifyUser,
  async function (req: Request, res: Response) {
    const { action, artwork_id } = req.body;

    try {
      switch (action) {
      case "increase":
        await increaseShoppingCartItemQuantity(req.id!, artwork_id);
        break;
      case "decrease":
        await decreaseShoppingCartItemQuantity(req.id!, artwork_id);
        break;
      case "replace":
        await replaceSavedShoppingCart(req.id!, req.body.shopping_cart);
        break;
      default:
        return res.status(HTTP.BAD_REQUEST).json({ error: "Invalid action" });
      }
      res.end();
    } catch {
      res.status(HTTP.BAD_REQUEST).end();
    }
  }
);

router.delete(
  "/shopping_cart/:artwork_id",
  verifyUser,
  async function (req: Request, res: Response) {
    const artwork_id = parseInt(req.params.artwork_id);
    await setShoppingCartItemQuantityToZero(req.id!, artwork_id);
    res.end();
  }
);

router.get(
  "/wishlist",
  verifyUser,
  async function (req: Request, res: Response) {
    const n = req.query.n as string;
    const artworks = await getWishlisted(req.id!, n);
    res.json(artworks);
  }
);

router.get(
  "/wishlist/:artwork_id",
  verifyUser,
  async function (req: Request, res: Response) {
    const artwork_id = parseInt(req.params.artwork_id);
    const is_wishlisted = await checkIfWishlisted(req.id!, artwork_id);
    res.json(is_wishlisted);
  }
);

router.post(
  "/wishlist",
  verifyUser,
  async function (req: Request, res: Response) {
    const artwork_id = req.body.artwork_id;
    await addToWishlisted(req.id!, artwork_id);
    res.end();
  }
);

router.delete(
  "/wishlist/:artwork_id",
  verifyUser,
  async function (req: Request, res: Response) {
    const artwork_id = parseInt(req.params.artwork_id);
    await removeFromWishlisted(req.id!, artwork_id);
    res.end();
  }
);

router.post("/update_data", verifyUser, async (req: Request, res: Response) => {
  await updateUserData(req.id!, req.body.field_name, req.body.value);
  res.end();
});

router.post(
  "/new_user",
  async function (
    req: Request<object, StandardResponse, RegisterRequest>,
    res: Response<StandardResponse>
  ) {
    const { last_name, first_name, email, password } = req.body;

    const registered = await checkIfRegistered(email);
    if (registered) {
      res.end("There is a user with this email already");
    } else if (!last_name || !first_name || !email || !password) {
      res.status(HTTP.BAD_REQUEST).end();
    } else {
      await registerUser(last_name, first_name, email, password);
      res.end();
    }
  }
);

router.post("/make_order", verifyUser, async (req: Request, res: Response) => {
  await makeOrder(req.id!, req.body.invoice_data);
  res.end();
});

router.post("/review", verifyUser, async (req: Request, res: Response) => {
  await leaveReview(
    req.id!,
    req.body.artwork_id,
    req.body.title,
    req.body.review_text
  );
  res.end();
});

router.get(
  "/get_orders_of_user",
  verifyUser,
  async function (req: Request, res: Response) {
    const orderData = await getOrdersOfUser(req.id!);
    res.json(orderData);
  }
);

router.get(
  "/get_reviews_of_user",
  verifyUser,
  async function (req: Request, res: Response) {
    const reviewData = await getReviewsOfUser(req.id!);
    res.json(reviewData);
  }
);

export default router;
