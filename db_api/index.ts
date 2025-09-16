// Export all functions from the different modules to match dbAPI.js structure

// Get data functions
export {
  getUser,
  getUserWithId,
  getRegisteredUsers,
  getCategories,
  getSpecificCategory,
  getSpecificTags,
  searchArtworks,
  findArtworkWithId,
  getFeatured,
  getNewestArtworks,
  getWishlistedTheMost,
  getThumbnail,
  getOtherPictures,
  checkIfRegistered,
  checkEmail,
  getReviewsOfArtwork,
  getUnapprovedReviews,
  getReviewsOfUser,
  getDataOfArtwork,
  checkIfArtworkInStock,
  getShoppingListItems,
  checkIfWishlisted,
  getWishlisted,
  getOrderData,
  getOrdersOfUser,
  getOrders,
  getUnansweredMessages,
  checkIfFeatured,
  getQuantityOfArtworkInStock,
} from "./get_data.js";

// Add data functions
export {
  registerUser,
  saveMessgeToAdministrator,
  addNewItemToShoppingList,
  addToShoppingList,
  makeOrder,
  addTag,
  addArtworkTags,
  addToWishlisted,
  addToFeatured,
  leaveReview,
  addPictures,
  addNewArtwork,
} from "./add_data.js";

// Change data functions
export {
  incrementItemInShoppingList,
  setShoppingCartItemQuantityToZero,
  decreaseShoppingCartItemQuantity,
  increaseShoppingCartItemQuantity,
  resetPassword,
  removeFromWishlisted,
  updateUserData,
  updateArtworkTags,
  updateArtworkData,
  approveReview,
  removeReview,
  removeFromFeatured,
  removeArtworkFromFeatured,
  removeArtwork,
  replaceSavedShoppingCart,
} from "./change_data.js";

// Email functions
export { sendReplyToMessage, sendLinkToResetPassword } from "./email.js";

// Verification functions
export { verifyPaswordToken, verifyUser, verifyAdmin } from "./verify.js";
