export declare const incrementItemInShoppingList: (user_id: number, artwork_id: number, n?: number) => Promise<void>;
export declare const setShoppingCartItemQuantityToZero: (user_id: number, artwork_id: number) => Promise<void>;
export declare const decreaseShoppingCartItemQuantity: (user_id: number, artwork_id: number) => Promise<void>;
export declare const increaseShoppingCartItemQuantity: (user_id: number, artwork_id: number) => Promise<void>;
export declare const resetPassword: (new_password: string, email: string) => Promise<void>;
export declare const removeFromWishlisted: (user_id: number, artwork_id: number) => Promise<void>;
type UserField = "first_name" | "last_name" | "email" | "address" | "phone_number";
export declare const updateUserData: (user_id: number, field_name: UserField, value: string) => Promise<void>;
export declare const updateArtworkTags: (artwork_id: number, tags: string[]) => Promise<void>;
type ArtworkField = "title" | "artist_name" | "price" | "quantity" | "description" | "category_id" | "tags";
interface Tag {
    tname: string;
}
export declare const updateArtworkData: (artwork_id: number, field_name: ArtworkField, value: string | number | Tag[]) => Promise<void>;
export declare const approveReview: (id: number) => Promise<void>;
export declare const removeReview: (id: number) => Promise<void>;
export declare const removeFromFeatured: (artwork_id: number) => Promise<void>;
export declare const removeArtworkFromFeatured: (artwork_id: number) => Promise<void>;
export declare const removeArtwork: (artwork_id: number) => Promise<void>;
interface ShoppingCartItem {
    artwork_id: number;
    quantity: number;
}
export declare const replaceSavedShoppingCart: (user_id: number, shopping_cart: ShoppingCartItem[]) => Promise<void>;
export {};
//# sourceMappingURL=change_data.d.ts.map