import { Router, Request, Response } from "express";
import { graphql } from "graphql";
import schema from "../graphql/schema.js";
import rootValue from "../graphql/resolvers.js";

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
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
