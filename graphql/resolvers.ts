import { checkIfFeatured, searchArtworks } from "../db_api/artwork.js";

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
      admin?: boolean;
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
      admin = false,
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
      only_featured?.toString(),
      admin.toString()
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
};

export default rootValue;
