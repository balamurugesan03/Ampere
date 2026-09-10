export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Search: { categoryId?: string; categoryName?: string } | undefined;
  Categories: undefined;
  Product: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  Payment: { addressId: string; deliverySlot: string };
  Profile: undefined;
  Settings: undefined;
  Wishlist: undefined;
  Orders: undefined;
  MyTeam: undefined;
  MyEarnings: undefined;
};
