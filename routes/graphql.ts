import { Router } from "express";

import { graphqlController } from "../controllers/graphql.js";

const router = Router();

// GraphQL endpoint
router.post("/", graphqlController);

export default router;
