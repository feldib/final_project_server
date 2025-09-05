export declare const registerUser: (last_name: string, first_name: string, email: string, password: string) => Promise<void>;
export declare const saveMessgeToAdministrator: (email: string, title: string, message: string) => Promise<void>;
export declare const addNewItemToShoppingList: (user_id: number, artwork_id: number, n?: number) => Promise<void>;
export declare const addToShoppingList: (user_id: number, artwork_id: number, n?: number) => Promise<void>;
interface InvoiceData {
    [key: string]: any;
}
export declare const makeOrder: (user_id: number, invoice_data: InvoiceData) => Promise<number>;
export declare const addTag: (tag_name: string) => Promise<number>;
export declare const addArtworkTags: (artwork_id: number, tags: string[]) => Promise<void>;
export {};
//# sourceMappingURL=add_data.d.ts.map