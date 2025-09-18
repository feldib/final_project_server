import { Router, Request, Response } from "express";
import { graphql, buildSchema } from "graphql";
import {
  searchArtworks,
  getCategories,
  checkIfFeatured,
} from "../db_api/get_data.js";

const router = Router();

// GraphQL schema
const schema = buildSchema(`
  type Tag {
    id: Int!
    tname: String!
  }

  type Category {
    id: Int!
    cname: String!
  }

  type Artwork {
    id: Int!
    title: String!
    artist_name: String!
    price: Float!
    category_id: Int!
    featured: Boolean
    created_at: String!
    thumbnail: String
    cname: String
    tags: [Tag!]
    other_pictures: [String!]
    quantity: Int
  }

  input SearchInput {
    min: Int
    max: Int
    title: String
    artist_name: String
    category_id: String
    order: String
    n: Int
    offset: Int
    only_featured: Boolean
  }

  type Query {
    searchArtworks(input: SearchInput): [Artwork!]!
    categories: [Category!]!
  }
`);

// GraphQL resolvers
const rootValue = {
  searchArtworks: async ({
    input,
  }: {
    input: {
      min?: number;
      max?: number;
      title?: string;
      artist_name?: string;
      category_id?: string;
      order?: string;
      n?: number;
      offset?: number;
      only_featured?: boolean;
    };
  }): Promise<unknown[]> => {
    const {
      min,
      max,
      title,
      artist_name,
      category_id,
      order,
      n = 10,
      offset = 0,
      only_featured,
    } = input || {};

    const artworks = await searchArtworks(
      min && min > 0 ? min.toString() : undefined,
      max && max > 0 ? max.toString() : undefined,
      title || undefined,
      artist_name || undefined,
      category_id || undefined,
      order,
      n.toString(),
      offset.toString(),
      only_featured?.toString()
    );

    // Add featured status to each artwork
    const artworksWithFeatured = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (artworks as any[]).map(async (artwork) => {
        const featured = await checkIfFeatured(artwork.id);
        return {
          ...artwork,
          featured: Boolean(featured),
          created_at: artwork.date_added || new Date().toISOString(),
        };
      })
    );

    return artworksWithFeatured;
  },

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  categories: async () => {
    return await getCategories();
  },
};

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
