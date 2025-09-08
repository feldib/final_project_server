import { Router, Request, Response, NextFunction } from "express";
const router = Router();
import fs from "fs/promises";

import { verifyAdmin } from "../db_api/verify.js";

import {
  getUnapprovedReviews,
  getOrders,
  getUnansweredMessages,
  getRegisteredUsers,
  getOrdersOfUser,
  checkIfFeatured,
} from "../db_api/get_data.js";

// import { addToFeatured, addNewArtwork } from "../db_api/add_data.js";

import {
  approveReview,
  removeReview,
  // removeArtworkFromFeatured,
  removeArtwork,
  updateArtworkData,
} from "../db_api/change_data.js";

import { sendReplyToMessage } from "../db_api/email.js";

const now = new Date();

import multer from "multer";

const newTumbnailStorage = multer.diskStorage({
  destination(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, `public/images/${req.query.artwork_id}/thumbnail`);
  },

  filename(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    cb(null, `${req.query.artwork_id}_${now.getTime()}_${file.originalname}`);
  },
});

// const newOtherImagesStorage = multer.diskStorage({
//   destination(
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, destination: string) => void
//   ) {
//     cb(null, `public/images/${req.query.artwork_id}/other_pictures`);
//   },

//   filename(
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, filename: string) => void
//   ) {
//     cb(null, `${req.query.artwork_id}_${now.getTime()}_${file.originalname}`);
//   },
// });

const uploadNewThumbnail = multer({ storage: newTumbnailStorage });

// const uploadNewOtherImages = multer({ storage: newOtherImagesStorage });

async function checkThumbnailPath(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const imagePath = `public/images/${req.query.artwork_id}/thumbnail`;

  await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
    if (err) {
      await fs.mkdir(imagePath, { recursive: true });
    }
  });

  next();
}

// async function checkOtherPicturesPath(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   const imagePath = `public/images/${req.query.artwork_id}/other_pictures`;

//   await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
//     if (err) {
//       await fs.mkdir(imagePath, { recursive: true });
//     }
//   });

//   next();
// }

router.post(
  "/thumbnail",
  verifyAdmin,
  checkThumbnailPath,
  uploadNewThumbnail.single("thumbnail"),
  function (req: Request, res: Response) {
    res.end();
  }
);

// async function removePreviousThumbnail(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   const path = `public/images/${req.query.artwork_id}/thumbnail`;

//   const files = await fs.readdir(path);

//   await Promise.all(
//     files.map((file) => {
//       fs.unlink(`${path}/${file}`);
//     })
//   );

//   next();
// }

router.get(
  "/unapproved_reviews",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const reviews = await getUnapprovedReviews();
    res.json(reviews);
  }
);

router.post(
  "/approve_review",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { id } = req.body;
    await approveReview(id);
    res.end();
  }
);

router.post(
  "/remove_review",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { id } = req.body;
    await removeReview(id);
    res.end();
  }
);

router.get(
  "/orders",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const orders = await getOrders();
    res.json(orders);
  }
);

router.get(
  "/unanswered_messages",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const messages = await getUnansweredMessages();
    res.json(messages);
  }
);

router.post(
  "/reply_to_message",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { message_id, email, reply_title, reply_text } = req.body;
    await sendReplyToMessage(message_id, email, reply_title, reply_text);
    res.end();
  }
);

router.get("/users", verifyAdmin, async function (req: Request, res: Response) {
  const users = await getRegisteredUsers();
  res.json(users);
});

router.get(
  "/orders_of_user",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { user_id } = req.query;
    const orders = await getOrdersOfUser(parseInt(user_id as string));
    res.json(orders);
  }
);

router.post(
  "/is_featured",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id } = req.body;
    const featured = await checkIfFeatured(artwork_id);
    res.json(featured);
  }
);

router.post(
  "/remove_artwork",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id } = req.body;
    await removeArtwork(artwork_id);
    res.end();
  }
);

router.post(
  "/update_artwork_data",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id, field_name, value } = req.body;
    await updateArtworkData(artwork_id, field_name, value);
    res.end();
  }
);

export default router;
