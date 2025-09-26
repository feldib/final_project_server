import { Request, Response,Router } from "express";
import { graphql } from "graphql";

import rootValue from "../graphql/resolvers.js";
import schema from "../graphql/schema.js";
import { HTTP } from "../utils/constants.js";

const router = Router();

// GraphQL endpoint
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, variables } = req.body;

    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
      rootValue,
    });

    res.json(result);
  } catch (error) {
    console.error("GraphQL Error:", error);
    res
      .status(HTTP.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
});

export default router;
