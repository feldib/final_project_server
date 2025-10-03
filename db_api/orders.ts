import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import makeConnection from "../mysqlConnection.js";
import { InvoiceData } from "../types/api.js";
import { OrderDataCollection, OrderDataItem } from "../types/db-helpers.js";
import { completeArtwork } from "./helpers.js";
import { getShoppingListItems } from "./shopping_list.js";

export const makeOrder = async (
  user_id: number,
  invoice_data: InvoiceData
): Promise<number> => {
  const connection = await makeConnection();
  const shoppingListItems = await getShoppingListItems(user_id);
  if (shoppingListItems.length) {
    const [insertedResults] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO orders(user_id) VALUES(?)
      `,
      [user_id]
    );

    const order_id = insertedResults.insertId;

    // Store invoice data
    await connection.query(
      `
        INSERT INTO invoice_data(last_name, first_name, email, address, phone_number, order_id) 
        VALUES(?, ?, ?, ?, ?, ?)
      `,
      [
        invoice_data.last_name,
        invoice_data.first_name,
        invoice_data.email,
        invoice_data.address,
        invoice_data.phone_number,
        order_id,
      ]
    );

    await Promise.all(
      shoppingListItems.map(async (item) => {
        await connection.query(
          `
            INSERT INTO artworks_ordered(order_id, quantity, price, artwork_id) VALUES(?, ?, ?, ?)
          `,
          [order_id, item.quantity, item.price, item.id]
        );

        await connection.query(
          `
            UPDATE 
            artworks_in_shopping_list 
            SET quantity = 0
            WHERE user_id = ? AND artwork_id = ?
          `,
          [user_id, item.id]
        );
      })
    );

    connection.end();
    return order_id;
  } else {
    connection.end();
    throw new Error("No items in shopping cart");
  }
};

export const getOrderData = async (
  order_id: number
): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();

  const [results] = await connection.query<RowDataPacket[]>(
    `
    SELECT artworks_ordered.price * artworks_ordered.quantity as cost, 
    artworks.category_id, artworks_ordered.price, artworks_ordered.quantity, artworks.id,
    artworks.title, artworks.artist_name, CONCAT(users.first_name, " ", users.last_name) as user_name,
    users.id as user_id
    FROM artworks_ordered LEFT JOIN artworks
    ON artworks.id = artworks_ordered.artwork_id
    LEFT JOIN orders ON orders.id = order_id
    LEFT JOIN users ON users.id = orders.user_id
    WHERE artworks_ordered.order_id = ?
  `,
    [order_id]
  );

  await Promise.all(results.map(completeArtwork));

  connection.end();

  return results;
};

export const getOrdersOfUser = async (
  user_id: number
): Promise<OrderDataCollection[]> => {
  const connection = await makeConnection();

  const [results] = await connection.query<RowDataPacket[]>(
    `
    SELECT id, time_ordered FROM orders WHERE user_id = ?
  `,
    [user_id]
  );

  let orderDataCollection: OrderDataCollection[] = [];
  if (results.length) {
    orderDataCollection = await Promise.all(
      results.map(async (ord) => {
        const orderData: OrderDataCollection = {
          time_ordered: ord.time_ordered,
          totalCost: 0,
          items: [],
        };
        const res = await getOrderData(ord.id);
        orderData.totalCost = res
          .map((item) => item.cost)
          .reduce((prev: number, item: number) => prev + item);
        orderData.items = res as OrderDataItem[];
        return orderData;
      })
    );

    orderDataCollection.sort((a, b) => b.time_ordered - a.time_ordered);
  }

  connection.end();

  return orderDataCollection;
};

export const getOrders = async (): Promise<OrderDataCollection[]> => {
  const connection = await makeConnection();

  const [results] = await connection.execute<RowDataPacket[]>(
    "SELECT id, time_ordered FROM orders"
  );

  let orderDataCollection: OrderDataCollection[] = [];
  if (results.length) {
    orderDataCollection = await Promise.all(
      results.map(async (ord) => {
        const orderData: OrderDataCollection = {
          time_ordered: ord.time_ordered,
          totalCost: 0,
          items: [],
        };
        const res = await getOrderData(ord.id);
        orderData.totalCost = res
          .map((item) => item.cost)
          .reduce((prev: number, item: number) => prev + item);
        orderData.items = res as OrderDataItem[];
        orderData.user = {
          user_name: res[0].user_name,
          user_id: res[0].user_id,
        };

        return orderData;
      })
    );

    orderDataCollection.sort((a, b) => b.time_ordered - a.time_ordered);
  }

  connection.end();

  return orderDataCollection;
};
