export declare const registerUser: (last_name: string, first_name: string, email: string, password: string) => Promise<void>;
export declare const saveMessgeToAdministrator: (email: string, title: string, message: string) => Promise<void>;
export declare const addNewItemToShoppingList: (user_id: number, artwork_id: number, n?: number) => Promise<void>;
export declare const addToShoppingList: (user_id: number, artwork_id: number, n?: number) => Promise<void>;
export declare const makeOrder: (user_id: number) => Promise<number>;
export declare const addTag: (tag_name: string) => Promise<number>;
export declare const addArtworkTags: (artwork_id: number, tags: string[]) => Promise<void>;
export declare const addToWishlisted: (user_id: number, artwork_id: number) => Promise<void>;
export declare const addToFeatured: (artwork_id: number) => Promise<void>;
export declare const leaveReview: (user_id: number, artwork_id: number, title: string, review_text: string) => Promise<void>;
export declare const addPictures: (artwork_id: number, picture_paths: string[]) => Promise<void>;
interface NewArtwork {
    title: string;
    artist_name: string;
    price: number;
    quantity: number;
    description: string;
    category_id: number;
    tags: string[];
    thumbnail: string;
    other_pictures: string[];
}
export declare const addNewArtwork: (artwork: NewArtwork) => Promise<void>;
export {};
//# sourceMappingURL=add_data.d.ts.map