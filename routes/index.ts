import { Router, Request, Response } from "express";
const router = Router();

import { verifyUser, verifyPaswordToken } from "../db_api/verify.js";

import {
  getDataOfArtwork,
  getUser,
  getUserWithId,
  getCategories,
  searchArtworks,
  checkEmail,
  getReviewsOfArtwork,
  getFeatured,
  getNewestArtworks,
  getWishlistedTheMost,
  findArtworkWithId,
} from "../db_api/get_data.js";

import { sendLinkToResetPassword } from "../db_api/email.js";

import { resetPassword } from "../db_api/change_data.js";

import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SearchArtworksQuery,
} from "../types/index.js";

router.post(
  "/login",
  async function (req: Request<{}, any, LoginRequest>, res: Response) {
    const { email, password } = req.body;
    const user = await getUser(email, password);
    if (user !== undefined) {
      console.log(user);
      req.session.userid = user.id;
      req.session.isadmin = user.is_admin;
      res.json(user);
    } else {
      res.status(401).end();
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
  async function (req: Request<{}, any, ForgotPasswordRequest>, res: Response) {
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
  async function (req: Request<{}, any, ResetPasswordRequest>, res: Response) {
    const { new_password, email } = req.body;
    resetPassword(new_password, email);
    res.end();
  }
);

router.get("/categories", async function (req: Request, res: Response) {
  const categories = await getCategories();
  console.log(JSON.stringify(categories));
  if (!categories.length) {
    console.log("No categories found.");
  }
  res.json(categories);
});

router.get(
  "/search_artworks",
  async function (
    req: Request<{}, any, any, SearchArtworksQuery>,
    res: Response
  ) {
    const {
      min,
      max,
      title,
      artist_name,
      category_id,
      order,
      n,
      offset,
      only_featured,
    } = req.query;
    const results = await searchArtworks(
      min,
      max,
      title,
      artist_name,
      category_id,
      order,
      n,
      offset,
      only_featured
    );
    if (!results.length) {
      console.log("No results for the search.");
    }
    res.json(results);
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
  if (!artwork) {
    console.log("Artwork was not found.");
  }
  res.json(artwork);
});

router.get("/reviews", async function (req: Request, res: Response) {
  const { id } = req.query;
  const reviews = await getReviewsOfArtwork(id as string);
  if (!reviews.length) {
    console.log("No reviews found.");
  }
  res.json(reviews);
});

router.get("/featured", async function (req: Request, res: Response) {
  const n = req.query.n as string;
  const artworks = await getFeatured(n);
  let results = artworks;
  if (!artworks.length) {
    console.log("No featured artworks");
  }
  res.json(results);
});

router.get("/newest", async function (req: Request, res: Response) {
  const n = req.query.n as string;
  const artworks = await getNewestArtworks(n);
  let results = artworks;
  if (!artworks.length) {
    console.log("No artworks");
  }
  res.json(results);
});

router.get("/most_wishlisted", async function (req: Request, res: Response) {
  const n = req.query.n as string;
  const artworks = await getWishlistedTheMost(n);
  let results = artworks;
  if (!artworks.length) {
    console.log("No artworks");
  }
  res.json(results);
});

export default router;
