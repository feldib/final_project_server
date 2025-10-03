import { buildSchema } from "graphql";

// GraphQL schema
const schema = buildSchema(`
  type Tag {
    id: Int!
    tname: String!
  }

  type CategoryTranslation {
    languageCode: String!
    name: String!
  }

  type Category {
    id: Int!
    translations: [CategoryTranslation!]!
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
    admin: Boolean
  }

  type Query {
    searchArtworks(input: SearchInput): [Artwork!]!
    categories: [Category!]!
  }
`);

export default schema;
