import { User, Category } from "../types/index.js";
export declare const getUser: (email: string, password: string) => Promise<User | undefined>;
export declare const getUserWithId: (id: number) => Promise<User | undefined>;
export declare const getRegisteredUsers: () => Promise<User[]>;
export declare const getCategories: () => Promise<Category[]>;
export declare const getSpecificCategory: (category_id: number) => Promise<string>;
interface Tag {
    id: number;
    tname: string;
}
export declare const getSpecificTags: (artwork_id: number) => Promise<Tag[]>;
export declare const searchArtworks: (min?: string, max?: string, title?: string, artist_name?: string, category_id?: string, order?: string, n?: string, offset?: string, only_featured?: string) => Promise<any[]>;
export declare const findArtworkWithId: (artwork_id: string) => Promise<any>;
export declare const getFeatured: (n?: string) => Promise<any[]>;
export declare const getNewestArtworks: (n?: string) => Promise<any[]>;
export declare const getWishlistedTheMost: (n?: string) => Promise<any[]>;
export declare const getThumbnail: (artwork_id: number) => Promise<string>;
export declare const getOtherPictures: (artwork_id: number) => Promise<string[]>;
export declare const checkIfRegistered: (email: string) => Promise<boolean>;
export declare const checkEmail: (email: string) => Promise<{
    registered: boolean;
    id?: number;
}>;
export declare const getReviewsOfArtwork: (artwork_id: string) => Promise<any[]>;
export declare const getUnapprovedReviews: () => Promise<any[]>;
export declare const getReviewsOfUser: (user_id: number) => Promise<any[]>;
export declare const getDataOfArtwork: (id: string) => Promise<any>;
export declare const checkIfArtworkInStock: (id: number) => Promise<boolean | Error>;
export declare const getShoppingListItems: (user_id: number) => Promise<any[]>;
export declare const checkIfWishlisted: (user_id: number, artwork_id: number) => Promise<boolean>;
export declare const getWishlisted: (user_id: number, n?: string) => Promise<any[]>;
export declare const getOrderData: (order_id: number) => Promise<any[]>;
export declare const getOrdersOfUser: (user_id: number) => Promise<any[]>;
export declare const getOrders: () => Promise<any[]>;
export declare const getUnansweredMessages: () => Promise<any[]>;
export declare const checkIfFeatured: (artwork_id: number) => Promise<boolean>;
export declare const getQuantityOfArtworkInStock: (artwork_id: number) => Promise<number>;
export {};
//# sourceMappingURL=get_data.d.ts.map