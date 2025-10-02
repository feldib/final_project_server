import { Request, Response, Router } from "express";
import fs from "fs/promises";
import multer from "multer";

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
import makeConnection from "../mysqlConnection.js";

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

const createThumbnailStorage = (artwork_id: string): multer.StorageEngine =>
  multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `public/images/${artwork_id}/thumbnail`);
    },
    filename(req, file, cb) {
      cb(null, `${artwork_id}_${now.getTime()}_${file.originalname}`);
    },
  });

const createOtherImagesStorage = (artwork_id: string): multer.StorageEngine =>
  multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `public/images/${artwork_id}/other_pictures`);
    },
    filename(req, file, cb) {
      cb(null, `${artwork_id}_${now.getTime()}_${file.originalname}`);
    },
  });

// Multer configuration for adding new artwork - uses memory storage first
const addNewArtworkUpload = multer({ storage: multer.memoryStorage() });

router.post(
  "/artworks/:id/images",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const artwork_id = req.params.id;
    const imageType = req.query.type as string; // "thumbnail" or "picture"

    if (imageType === "thumbnail") {
      const imagePath = `public/images/${artwork_id}/thumbnail`;
      await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
        if (err) {
          await fs.mkdir(imagePath, { recursive: true });
        }
      });

      const upload = multer({ storage: createThumbnailStorage(artwork_id) });
      upload.single("thumbnail")(req, res, () => {
        res.end();
      });
    } else {
      const imagePath = `public/images/${artwork_id}/other_pictures`;
      await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
        if (err) {
          await fs.mkdir(imagePath, { recursive: true });
        }
      });

      const upload = multer({ storage: createOtherImagesStorage(artwork_id) });
      upload.single("picture")(req, res, () => {
        res.end();
      });
    }
  }
);

router.put(
  "/artworks/:id/images",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const artwork_id = req.params.id;
    const path = `public/images/${artwork_id}/thumbnail`;

    // Remove existing thumbnails
    const files = await fs.readdir(path).catch(() => []);
    await Promise.all(
      files.map((file) => {
        return fs.unlink(`${path}/${file}`);
      })
    );

    // Ensure directory exists
    await fs.access(path, fs.constants.F_OK).catch(async (err) => {
      if (err) {
        await fs.mkdir(path, { recursive: true });
      }
    });

    const upload = multer({ storage: createThumbnailStorage(artwork_id) });
    upload.single("thumbnail")(req, res, () => {
      res.end();
    });
  }
);

router.put(
  "/artworks/:id/images",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const artwork_id = req.params.id;
    const path = `public/images/${artwork_id}/thumbnail`;

    const files = await fs.readdir(path).catch(() => []);
    await Promise.all(
      files.map((file) => {
        return fs.unlink(`${path}/${file}`);
      })
    );

    // Ensure directory exists
    const imagePath = `public/images/${artwork_id}/thumbnail`;
    await fs.access(imagePath, fs.constants.F_OK).catch(async (err) => {
      if (err) {
        await fs.mkdir(imagePath, { recursive: true });
      }
    });

    const upload = multer({ storage: createThumbnailStorage(artwork_id) });
    upload.single("thumbnail")(req, res, () => {
      res.end();
    });
  }
);

router.delete(
  "/artworks/:id/images/:filename",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { id: artwork_id, filename: file_name } = req.params;

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

router.get(
  "/unapproved_reviews",
  verifyAdmin,
  async function (_: Request, res: Response) {
    const reviews = await getUnapprovedReviews();
    res.json(reviews);
  }
);

router.put(
  "/reviews/:id",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const id = parseInt(req.params.id);
    await approveReview(id);
    res.end();
  }
);

router.delete(
  "/reviews/:id",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const id = parseInt(req.params.id);
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

router.get(
  "/featured/:id",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const artwork_id = parseInt(req.params.id);
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

router.delete(
  "/featured/:id",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const artwork_id = parseInt(req.params.id);
    await removeFromFeatured(artwork_id);
    res.end();
  }
);

router.delete(
  "/artworks/:id",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const artwork_id = parseInt(req.params.id);
    await removeArtwork(artwork_id);
    res.end();
  }
);

router.post(
  "/artwork",
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

router.put(
  "/artwork",
  verifyAdmin,
  async function (req: Request, res: Response) {
    const { artwork_id, field_name, value } = req.body;
    await updateArtworkData(artwork_id, field_name, value);
    res.end();
  }
);

export default router;
