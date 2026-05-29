import { Request, Response } from "express";

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
import {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  StandardResponse,
} from "../types/api.js";
import { User } from "../types/database.js";
import { HTTP } from "../utils/constants.js";

export async function loginController(
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

export async function getLoggedInUserController(
  req: Request,
  res: Response
) {
  const user = await getUserWithId(req.id!);
  res.json({ user });
}

export const logoutController = async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
    }
  });
  res.end("Logged out successfully");
};

export async function forgotPasswordController(
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

export async function resetPasswordController(
  req: Request<object, StandardResponse, ResetPasswordRequest>,
  res: Response<StandardResponse>
) {
  const { new_password, email } = req.body;
  resetPassword(new_password, email);
  res.end();
}


export async function getCategoriesController(
  _: Request,
  res: Response
) {
  const categories = await getAllCategoriesWithTranslations();
  res.json(categories);
}

export async function findArtworkByIdController(
  req: Request,
  res: Response
) {
  const { artwork_id } = req.query;
  const artwork = await findArtworkWithId(artwork_id as string);
  res.json(artwork);
}

export async function getArtworkController(
  req: Request,
  res: Response
) {
  const { id } = req.query;
  const artwork = await getDataOfArtwork(id as string);
  res.json(artwork);
}

export async function getReviewsController(
  req: Request,
  res: Response
) {
  const { id } = req.query;
  const reviews = await getReviewsOfArtwork(id as string);
  res.json(reviews);
}

export async function getFeaturedController(
  req: Request,
  res: Response
) {
  const n = req.query.n as string;
  const artworks = await getFeatured(n);
  res.json(artworks);
}

export async function getNewestArtworksController(
  req: Request,
  res: Response
) {
  const n = req.query.n as string;
  const artworks = await getNewestArtworks(n);
  const results = artworks;
  res.json(results);
}

export async function getWishlistedTheMostController(
  req: Request,
  res: Response
) {
  const n = req.query.n as string;
  const artworks = await getWishlistedTheMost(n);
  const results = artworks;
  res.json(results);
}
