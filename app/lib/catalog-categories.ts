export const CUSTOMER_CATEGORY_DEFINITIONS = [
  { id: 'All', label: 'All Products', icon: '🛍️', aliases: [] },
  { id: 'Snacks & Biscuits', label: 'Snacks & Biscuits', icon: '🍪', aliases: ['biscuits','biscuit','snacks','snack','chips','namkeen','cookies','bakery snacks'] },
  { id: 'Dairy & Breakfast', label: 'Dairy & Breakfast', icon: '🥛', aliases: ['dairy','dairy products','milk','breakfast','bread','curd','paneer','butter','cheese','yogurt','eggs & dairy'] },
  { id: 'Beverages', label: 'Drinks & Beverages', icon: '🥤', aliases: ['drinks','drink','beverages','beverage','soft drinks','cold drinks','cool drinks','juice','water','energy drinks'] },
  { id: 'Fresh Fruits', label: 'Fresh Fruits', icon: '🍎', aliases: ['fruits','fruit','fresh fruits','fresh fruit'] },
  { id: 'Vegetables', label: 'Fresh Vegetables', icon: '🥬', aliases: ['vegetables','vegetable','fresh vegetables','fresh vegetable','veg','sabzi'] },
  { id: 'Chicken', label: 'Chicken & Poultry', icon: '🍗', aliases: ['chicken','poultry','fresh chicken'] },
  { id: 'Meat & Seafood', label: 'Meat & Seafood', icon: '🥩', aliases: ['mutton','meat','fish & seafood','fish','seafood','fresh meat','fresh fish'] },
  { id: 'Eggs', label: 'Eggs', icon: '🥚', aliases: ['eggs','egg'] },
  { id: 'Staples & Cooking', label: 'Staples & Cooking', icon: '🌾', aliases: ['staples','grocery','groceries','atta','flour','rice','oil','pulses','dal','spices','masala','sugar','salt'] },
  { id: 'Instant & Frozen', label: 'Instant & Frozen Food', icon: '🍜', aliases: ['instant food','ready to eat','ready to cook','noodles','frozen','frozen food','ice cream','icecream'] },
  { id: 'Sweets & Chocolates', label: 'Sweets & Chocolates', icon: '🍫', aliases: ['sweets','sweet','chocolate','chocolates','candy','mithai'] },
  { id: 'Personal Care', label: 'Personal Care', icon: '🧴', aliases: ['personal care','body care','grooming','soap','shampoo','toothpaste','sanitary pads','feminine hygiene'] },
  { id: 'Home Care', label: 'Home & Cleaning', icon: '🧹', aliases: ['home care','household','household cleaning','cleaning','detergent','dishwash','floor cleaner','toilet cleaner','laundry'] },
  { id: 'Baby Care', label: 'Baby Care', icon: '🍼', aliases: ['baby care','baby products','diapers','diaper','nappies','baby food','infant food'] },
  { id: 'Beauty & Wellness', label: 'Beauty & Wellness', icon: '💄', aliases: ['beauty','wellness','skin care','skincare','cosmetics','makeup','fragrance','perfume','hair care'] },
  { id: 'Electronics & Accessories', label: 'Electronics & Accessories', icon: '🎧', aliases: ['electronics','electronic accessories','mobile accessories','mobiles','mobile phones','smartphones','phones','headphones','earbuds','chargers','power banks','smartwatches','laptops','computer accessories'] },
  { id: 'Fashion & Clothing', label: 'Fashion & Clothing', icon: '👕', aliases: ['fashion','clothing','clothes','menswear','men clothing','womenswear','women clothing','kids wear','footwear','shoes','ethnic wear','western wear'] },
  { id: 'Home & Kitchen', label: 'Home & Kitchen', icon: '🏠', aliases: ['home and kitchen','home & kitchen','kitchen','cookware','home appliances','small appliances','storage','home furnishing','home decor'] },
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
  const candidates = [definition.id, definition.label, ...definition.aliases]
    .map(normalizeCategoryName)
    .filter(Boolean);
  if (candidates.includes(raw)) return true;

  // Vendors sometimes save slightly richer category labels such as
  // "Fresh Fruits & Imported" or "Dairy Products". Keep customer grouping
  // forgiving without matching very short generic fragments.
  return candidates.some((candidate) =>
    candidate.length >= 4 && (raw.includes(candidate) || candidate.includes(raw)),
  );
};

export const campaignMatchesCustomerCategory = (campaignCategory: unknown, customerCategory: string) => {
  if (customerCategory === 'All') return false;
  return productMatchesCustomerCategory(campaignCategory, customerCategory);
};
