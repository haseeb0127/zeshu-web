export const CUSTOMER_CATEGORY_DEFINITIONS = [
  { id: 'All', label: 'All Products', icon: '🛍️', aliases: [] },
  { id: 'Snacks & Biscuits', label: 'Snacks & Biscuits', icon: '🍪', aliases: ['biscuits','biscuit','snacks','snack','chips','namkeen'] },
  { id: 'Dairy & Breakfast', label: 'Dairy & Breakfast', icon: '🥛', aliases: ['dairy','milk','breakfast','bread','curd','paneer','butter','cheese'] },
  { id: 'Beverages', label: 'Beverages', icon: '🥤', aliases: ['drinks','drink','beverages','beverage','soft drinks','juice','water'] },
  { id: 'Fresh Fruits', label: 'Fresh Fruits', icon: '🍎', aliases: ['fruits','fruit','fresh fruits'] },
  { id: 'Vegetables', label: 'Vegetables', icon: '🥬', aliases: ['vegetables','vegetable','fresh vegetables'] },
  { id: 'Chicken', label: 'Chicken', icon: '🍗', aliases: ['chicken','poultry'] },
  { id: 'Meat & Seafood', label: 'Meat & Seafood', icon: '🥩', aliases: ['mutton','meat','fish & seafood','fish','seafood'] },
  { id: 'Eggs', label: 'Eggs', icon: '🥚', aliases: ['eggs','egg'] },
  { id: 'Staples & Cooking', label: 'Staples & Cooking', icon: '🌾', aliases: ['staples','grocery','groceries','atta','flour','rice','oil','pulses','dal','spices'] },
] as const;

export const VENDOR_PRODUCT_CATEGORIES = CUSTOMER_CATEGORY_DEFINITIONS.filter((category) => category.id !== 'All');

export const normalizeCategoryName = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const categoryDefinition = (id: string) =>
  CUSTOMER_CATEGORY_DEFINITIONS.find((category) => category.id === id)
  || CUSTOMER_CATEGORY_DEFINITIONS[0];

export const productMatchesCustomerCategory = (rawCategory: unknown, customerCategory: string) => {
  if (customerCategory === 'All') return true;
  const raw = normalizeCategoryName(rawCategory);
  const definition = categoryDefinition(customerCategory);
  return raw === normalizeCategoryName(definition.id)
    || raw === normalizeCategoryName(definition.label)
    || definition.aliases.some((alias) => raw === normalizeCategoryName(alias));
};

export const campaignMatchesCustomerCategory = (campaignCategory: unknown, customerCategory: string) => {
  if (customerCategory === 'All') return false;
  return productMatchesCustomerCategory(campaignCategory, customerCategory);
};
