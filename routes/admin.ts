import { NextFunction, Request, Response, Router } from "express";
import fs from "fs/promises";
import multer from "multer";

import makeConnection from "../connection.js";
import {
  addNewArtwork,
  addPictures,
  addToFeatured,
  checkIfFeatured,
  removeArtwork,
  removeFromFeatured,
  updateArtworkData,
} from "../db_api/artwork.js";
import { sendReplyToMessage } from "../db_api/email.js";
import { getUnansweredMessages } from "../db_api/messages.js";
import { getOrders, getOrdersOfUser } from "../db_api/orders.js";
import {
  approveReview,
  getUnapprovedReviews,
  removeReview,
} from "../db_api/reviews.js";
import { getRegisteredUsers } from "../db_api/user.js";
import { verifyAdmin } from "../db_api/verify.js";

const router = Router();

const now = new Date();

// Helper function to add thumbnail to database
async function addThumbnailToDatabase(
  artwork_id: number,
  thumbnailPath: string
): Promise<void> {
  const connection = await makeConnection();
  await connection.query(
    "INSERT INTO artwork_pictures(artwork_id, picture_path, is_thumbnail) VALUES (?, ?, ?)",
    [artwork_id, thumbnailPath, true]
  );
  connection.end();
}

// Admin authentication check endpoint
router.get("/is_admin", verifyAdmin, function (req: Request, res: Response) {
  res.json({ is_admin: true });
});

const newThumbnailStorage = multer.diskStorage({
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

const newOtherImagesStorage = multer.diskStorage({
  destination(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, `public/images/${req.query.artwork_id}/other_pictures`);
  },

  filename(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    cb(null, `${req.query.artwork_id}_${now.getTime()}_${file.originalname}`);
  },
});

const uploadNewThumbnail = multer({ storage: newThumbnailStorage });

const uploadNewOtherImages = multer({ storage: newOtherImagesStorage });

// Multer configuration for adding new artwork - uses memory storage first
const addNewArtworkUpload = multer({ storage: multer.memoryStorage() });

async function checkThumbnailPath(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const imagePath = `public/images/${req.query.artwork_id}/thumbnail`;

  await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
    if (err) {
      await fs.mkdir(imagePath, { recursive: true });
    }
  });

  next();
}

async function checkOtherPicturesPath(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const imagePath = `public/images/${req.query.artwork_id}/other_pictures`;

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
  function (req: Request, res: Response) {
    res.end();
  }
);

// Add new picture to artwork
router.post(
  "/picture",
  verifyAdmin,
  checkOtherPicturesPath,
  uploadNewOtherImages.single("picture"),
  function (req: Request, res: Response) {
    res.end();
  }
);

// Replace thumbnail
router.post(
  "/replace_thumbnail",
  verifyAdmin,
  removePreviousThumbnail,
  checkThumbnailPath,
  uploadNewThumbnail.single("thumbnail"),
  function (req: Request, res: Response) {
    res.end();
  }
);

// Remove picture
router.post(
  "/remove_picture",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id, file_name } = req.body;

    try {
      // Try thumbnail folder first
      const thumbnailPath = `public/images/${artwork_id}/thumbnail/${file_name}`;
      await fs.unlink(thumbnailPath).catch(() => {
        // If not in thumbnail folder, try other_pictures folder
        const otherPicturePath = `public/images/${artwork_id}/other_pictures/${file_name}`;
        return fs.unlink(otherPicturePath);
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing picture:", error);
      res.status(500).json({ error: "Failed to remove picture" });
    }
  }
);

async function removePreviousThumbnail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const path = `public/images/${req.query.artwork_id}/thumbnail`;

  const files = await fs.readdir(path).catch(() => []);

  await Promise.all(
    files.map((file) => {
      return fs.unlink(`${path}/${file}`);
    })
  );

  next();
}

router.get(
  "/unapproved_reviews",
  verifyAdmin,
  async function (_: Request, res: Response) {
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

router.get("/orders", verifyAdmin, async function (_: Request, res: Response) {
  const orders = await getOrders();
  res.json(orders);
});

router.get(
  "/unanswered_messages",
  verifyAdmin,
  async function (_: Request, res: Response) {
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
  "/featured",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id } = req.body;
    await addToFeatured(artwork_id);
    res.end();
  }
);

router.post(
  "/remove_from_featured",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id } = req.body;
    await removeFromFeatured(artwork_id);
    res.end();
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
  "/add_new_artwork",
  verifyAdmin,
  addNewArtworkUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "other_pictures", maxCount: 10 },
  ]),
  async function (req: Request, res: Response) {
    try {
      // Parse the artwork data from form fields
      const artworkData = {
        title: req.body.title,
        artist_name: req.body.artist_name,
        price: parseFloat(req.body.price),
        quantity: parseInt(req.body.quantity),
        description: req.body.description,
        category_id: parseInt(req.body.category_id),
        tags: JSON.parse(req.body.tags || "[]"),
      };

      // Create the artwork first to get artwork_id
      const artwork_id = await addNewArtwork(artworkData);

      // Create directories for images
      await fs.mkdir(`public/images/${artwork_id}/thumbnail`, {
        recursive: true,
      });
      await fs.mkdir(`public/images/${artwork_id}/other_pictures`, {
        recursive: true,
      });

      const files = req.files as {
        thumbnail?: Express.Multer.File[];
        other_pictures?: Express.Multer.File[];
      };

      // Thumbnail is required - frontend validation ensures it's always provided
      if (!files.thumbnail || !files.thumbnail[0]) {
        return res.status(400).json({ error: "Thumbnail is required" });
      }

      const thumbnailFile = files.thumbnail[0];
      const thumbnailPath = `images/${artwork_id}/thumbnail/${artwork_id}_${now.getTime()}_${
        thumbnailFile.originalname
      }`;
      const fullThumbnailPath = `public/${thumbnailPath}`;

      await fs.writeFile(fullThumbnailPath, thumbnailFile.buffer);

      // Save thumbnail path to database
      await addThumbnailToDatabase(artwork_id, thumbnailPath);

      // Save other pictures if provided
      if (files.other_pictures && files.other_pictures.length > 0) {
        const otherPicturePaths: string[] = [];

        for (const file of files.other_pictures) {
          const picturePath = `images/${artwork_id}/other_pictures/${artwork_id}_${now.getTime()}_${
            file.originalname
          }`;
          const fullPicturePath = `public/${picturePath}`;

          await fs.writeFile(fullPicturePath, file.buffer);
          otherPicturePaths.push(picturePath);
        }

        // Save other picture paths to database
        await addPictures(artwork_id, otherPicturePaths);
      }

      res.json(artwork_id);
    } catch (error) {
      console.error("Error adding new artwork:", error);
      res.status(500).json({ error: "Failed to add new artwork" });
    }
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
