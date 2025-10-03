import { RowDataPacket } from "mysql2/promise";

import makeConnection from "../mysqlConnection.js";

export const getReviewsOfArtwork = async (
  artwork_id: string
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [reviews] = await connection.query<RowDataPacket[]>(
    `SELECT CONCAT(users.last_name, " ", users.first_name) 'name', reviews.id, 
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      WHERE reviews.artwork_id = ? AND reviews.approved = true AND reviews.removed = false`,
    [artwork_id]
  );
  connection.end();

  return reviews;
};

export const getUnapprovedReviews = async (): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [reviews] = await connection.execute<RowDataPacket[]>(
    `SELECT CONCAT(users.last_name, " ", users.first_name) 'name', reviews.id, 
      reviews.user_id, reviews.time_review_posted, reviews.title, reviews.review_text,
      artworks.id as artwork_id, artworks.title as artwork_title,
      artworks.artist_name
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      LEFT JOIN artworks ON reviews.artwork_id = artworks.id
      WHERE reviews.approved = false AND reviews.removed = false`
  );
  connection.end();

  return reviews;
};

export const getReviewsOfUser = async (
  user_id: number
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [reviews] = await connection.query<RowDataPacket[]>(
    `SELECT reviews.id, reviews.time_review_posted, reviews.title, 
      artworks.id as artwork_id, artworks.title as artwork_title,
      artworks.artist_name, reviews.approved, reviews.review_text
      FROM reviews LEFT JOIN users ON reviews.user_id = users.id
      LEFT JOIN artworks ON reviews.artwork_id = artworks.id
      WHERE reviews.user_id = ? AND reviews.removed = false`,
    [user_id]
  );
  connection.end();

  return reviews;
};

export const leaveReview = async (
  user_id: number,
  artwork_id: number,
  title: string,
  review_text: string
): Promise<void> => {
  const connection = await makeConnection();

  await connection.query(
    `
      INSERT INTO reviews(user_id, artwork_id, title, review_text)
      VALUES(?, ?, ?, ?)
    `,
    [user_id, artwork_id, title, review_text]
  );

  connection.end();
};

export const approveReview = async (id: number): Promise<void> => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE reviews SET approved = true where id = ?
    `,
    [id]
  );

  connection.end();
};

export const removeReview = async (id: number): Promise<void> => {
  const connection = await makeConnection();
  await connection.query(
    `
        UPDATE reviews SET removed = true where id = ?
    `,
    [id]
  );

  connection.end();
};
