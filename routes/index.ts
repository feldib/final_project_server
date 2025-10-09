import { Request, Response, Router } from "express";

import {
  findArtworkWithId,
  getDataOfArtwork,
  getFeatured,
  getNewestArtworks,
  getWishlistedTheMost,
} from "../db_api/artwork.js";
import { getAllCategoriesWithTranslations } from "../db_api/categories.js";
import { sendLinkToResetPassword } from "../db_api/email.js";
import { getReviewsOfArtwork } from "../db_api/reviews.js";
import {
  checkEmail,
  getUser,
  getUserWithId,
  resetPassword,
} from "../db_api/user.js";
import { verifyPaswordToken, verifyUser } from "../db_api/verify.js";
import {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  StandardResponse,
} from "../types/api.js";
import { User } from "../types/database.js";
import { cacheMiddleware } from "../utils/cacheMiddleware.js";
import { CACHE, HTTP } from "../utils/constants.js";

const router = Router();

router.post(
  "/login",
  async function (
    req: Request<object, User, LoginRequest>,
    res: Response<User>
  ) {
    const { email, password } = req.body;
    const user = await getUser(email, password);
    if (user !== undefined) {
      req.session.userid = user.id;
      req.session.isadmin = user.is_admin;
      res.json(user);
    } else {
      res.status(HTTP.UNAUTHORIZED).end();
    }
  }
);

router.get(
  "/logged_in",
  verifyUser,
  async function (req: Request, res: Response) {
    const user = await getUserWithId(req.id!);
    res.json({ user });
  }
);

router.get("/log_out", async function (req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
    }
  });
  res.end("Logged out successfully");
});

router.post(
  "/forgot_password",
  async function (
    req: Request<object, StandardResponse, ForgotPasswordRequest>,
    res: Response<StandardResponse>
  ) {
    const { email } = req.body;

    const { registered, id } = await checkEmail(email);

    if (registered && id) {
      await sendLinkToResetPassword({ id, email });
    }

    res.end();
  }
);

router.post(
  "/reset_password",
  verifyPaswordToken,
  async function (
    req: Request<object, StandardResponse, ResetPasswordRequest>,
    res: Response<StandardResponse>
  ) {
    const { new_password, email } = req.body;
    resetPassword(new_password, email);
    res.end();
  }
);

router.get(
  "/categories",
  cacheMiddleware({ ttlSeconds: CACHE.CATEGORIES_TTL }),
  async function (req: Request, res: Response) {
    const categories = await getAllCategoriesWithTranslations();
    res.json(categories);
  }
);

router.get("/find_artwork_by_id", async function (req: Request, res: Response) {
  const { artwork_id } = req.query;
  const artwork = await findArtworkWithId(artwork_id as string);
  res.json(artwork);
});

//artwork page
router.get("/artwork", async function (req: Request, res: Response) {
  const { id } = req.query;
  const artwork = await getDataOfArtwork(id as string);
  res.json(artwork);
});

router.get("/reviews", async function (req: Request, res: Response) {
  const { id } = req.query;
  const reviews = await getReviewsOfArtwork(id as string);
  res.json(reviews);
});

router.get(
  "/featured",
  cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }),
  async function (req: Request, res: Response) {
    const n = req.query.n as string;
    const artworks = await getFeatured(n);
    const results = artworks;
    res.json(results);
  }
);

router.get(
  "/newest",
  cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }),
  async function (req: Request, res: Response) {
    const n = req.query.n as string;
    const artworks = await getNewestArtworks(n);
    const results = artworks;
    res.json(results);
  }
);

router.get(
  "/most_wishlisted",
  cacheMiddleware({ ttlSeconds: CACHE.ARTWORKS_TTL }),
  async function (req: Request, res: Response) {
    const n = req.query.n as string;
    const artworks = await getWishlistedTheMost(n);
    const results = artworks;
    res.json(results);
  }
);

export default router;
