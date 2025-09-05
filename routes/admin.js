import { Router } from "express";
const router = Router();
import fs from "fs/promises";
import dotenv from "dotenv";
dotenv.config();

import { verifyAdmin } from "../db_api/verification.js";

import {
  getUnapprovedReviews,
  getOrders,
  getUnansweredMessages,
  getRegisteredUsers,
  getOrdersOfUser,
  checkIfFeatured,
} from "../db_api/get_data_from_db.js";

import { addToFeatured, addNewArtwork } from "../db_api/add_to_database.js";

import {
  approveReview,
  removeReview,
  removeFromFeatured,
  removeArtwork,
  updateArtworkData,
} from "../db_api/change_value_in_database.js";

import { sendReplyToMessage } from "../db_api/send_email.js";

const now = new Date();

import multer from "multer";

const newTumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `public/images/${req.query.artwork_id}/thumbnail`);
  },

  filename: function (req, file, cb) {
    cb(null, `${req.query.artwork_id}_${now.getTime()}_${file.originalname}`);
  },
});

const newOtherImagesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `public/images/${req.query.artwork_id}/other_pictures`);
  },

  filename: function (req, file, cb) {
    cb(null, `${req.query.artwork_id}_${now.getTime()}_${file.originalname}`);
  },
});

const uploadNewThumbnail = multer({ storage: newTumbnailStorage });

const uploadNewOtherImages = multer({ storage: newOtherImagesStorage });

async function checkThumbnailPath(req, res, next) {
  let imagePath = `public/images/${req.query.artwork_id}/thumbnail`;

  await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
    if (err) {
      await fs.mkdir(imagePath, { recursive: true });
    }
  });

  next();
}

async function checkOtherPicturesPath(req, res, next) {
  let imagePath = `public/images/${req.query.artwork_id}/other_pictures`;

  await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
    if (err) {
      await fs.mkdir(imagePath, { recursive: true });
    }
  });

  next();
}

router.post(
  "/thumbnail",
  verifyAdmin,
  checkThumbnailPath,
  uploadNewThumbnail.single("thumbnail"),
  function (req, res) {
    res.end();
  }
);

async function removePreviousThumbnail(req, res, next) {
  const path = `public/images/${req.query.artwork_id}/thumbnail`;

  const files = await fs.readdir(path);

  await Promise.all(
    files.map((file) => {
      fs.unlink(`${path}/${file}`);
    })
  );

  next();
}

router.post(
  "/replace_thumbnail",
  verifyAdmin,
  removePreviousThumbnail,
  checkThumbnailPath,
  uploadNewThumbnail.single("thumbnail"),
  function (req, res) {
    res.end();
  }
);

async function removePicture(artwork_id, file_name) {
  const path = `public/images/${artwork_id}/other_pictures`;
  await fs.unlink(`${path}/${file_name}`);
}

router.post("/remove_picture", verifyAdmin, async function (req, res) {
  await removePicture(req.body.artwork_id, req.body.file_name);
  res.end();
});

router.post(
  "/picture",
  verifyAdmin,
  checkOtherPicturesPath,
  uploadNewOtherImages.single("picture"),
  function (req, res) {
    res.end();
  }
);

router.get("/get_unapproved_reviews", verifyAdmin, async function (req, res) {
  const reviews = await getUnapprovedReviews();
  res.json(reviews);
});

router.post("/approve_review", verifyAdmin, async function (req, res) {
  const reviews = await approveReview(req.body.review_id);
  res.end();
});

router.post("/disapprove_review", verifyAdmin, async function (req, res) {
  const reviews = await removeReview(req.body.review_id);
  res.end();
});

router.get("/get_orders", verifyAdmin, async function (req, res) {
  const orderData = await getOrders();
  res.json(orderData);
});

router.get("/unanswered_messages", verifyAdmin, async function (req, res) {
  const messages = await getUnansweredMessages();
  res.json(messages);
});

router.post("/reply_to_message", verifyAdmin, async function (req, res) {
  await sendReplyToMessage(
    req.body.message_id,
    req.body.email,
    req.body.reply_title,
    req.body.reply_text
  );
  res.end();
});

router.get("/users", verifyAdmin, async function (req, res) {
  const users = await getRegisteredUsers();
  res.json(users);
});

router.post("/get_orders_of_user", verifyAdmin, async function (req, res) {
  const orderData = await getOrdersOfUser(req.body.user_id);
  res.json(orderData);
});

router.post("/remove_artwork", verifyAdmin, async function (req, res) {
  const artwork = await removeArtwork(req.body.artwork_id);
  res.end();
});

router.post("/is_featured", verifyAdmin, async function (req, res) {
  const artwork_id = req.body.artwork_id;
  const is_featured = await checkIfFeatured(artwork_id);
  res.json(is_featured);
});

router.post("/featured", verifyAdmin, async function (req, res) {
  const artwork_id = req.body.artwork_id;
  await addToFeatured(artwork_id);
  res.end();
});

router.post("/remove_from_featured", verifyAdmin, async function (req, res) {
  const artwork_id = req.body.artwork_id;
  await removeFromFeatured(artwork_id);
  res.end();
});

router.post("/add_new_artwork", verifyAdmin, async function (req, res) {
  const artwork = req.body.artwork;
  const artwork_id = await addNewArtwork(artwork);

  res.json(artwork_id);
});

router.get("/is_admin", verifyAdmin, async function (req, res) {
  res.end();
});

router.post("/update_artwork_data", verifyAdmin, async (req, res) => {
  await updateArtworkData(
    req.body.artwork_id,
    req.body.field_name,
    req.body.value
  );
  res.end();
});

export default router;
