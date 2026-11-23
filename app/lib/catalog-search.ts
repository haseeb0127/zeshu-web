type SearchableProduct = {
  id?: string | number;
  name?: unknown;
  brand?: unknown;
  category?: unknown;
  weight?: unknown;
  unit?: unknown;
  description?: unknown;
  tags?: unknown;
  keywords?: unknown;
  in_stock?: unknown;
  quantity?: unknown;
};

const SYNONYM_GROUPS = [
  ['atta', 'aata', 'flour', 'wheat', 'gehun', 'gehhu'],
  ['milk', 'doodh', 'dudh'],
  ['curd', 'dahi', 'yogurt', 'yoghurt'],
  ['paneer', 'cottage cheese'],
  ['butter', 'makhan'],
  ['ghee', 'clarified butter'],
  ['egg', 'eggs', 'anda', 'ande'],
  ['onion', 'onions', 'pyaz', 'pyaaz'],
  ['potato', 'potatoes', 'aloo'],
  ['tomato', 'tomatoes', 'tamatar'],
  ['vegetable', 'vegetables', 'veg', 'sabzi', 'sabji'],
  ['fruit', 'fruits', 'phal'],
  ['rice', 'chawal'],
  ['dal', 'daal', 'lentil', 'lentils', 'pulses'],
  ['oil', 'cooking oil', 'tel'],
  ['sugar', 'cheeni', 'chini'],
  ['salt', 'namak'],
  ['tea', 'chai'],
  ['bread', 'pav'],
  ['biscuit', 'biscuits', 'cookie', 'cookies'],
  ['chips', 'chip', 'snack', 'snacks', 'namkeen'],
  ['soft drink', 'cold drink', 'cool drink', 'cooldrink', 'soda', 'cola', 'coke', 'coca cola', 'cocacola'],
  ['water', 'mineral water', 'drinking water'],
  ['chicken', 'poultry'],
  ['mutton', 'goat', 'goat meat'],
  ['fish', 'seafood', 'machli', 'machhli'],
  ['soap', 'bath soap', 'bath bar'],
  ['detergent', 'washing powder', 'laundry'],
  ['shampoo', 'hair wash'],
  ['toothpaste', 'tooth paste', 'dental'],
  ['diaper', 'diapers', 'nappy', 'nappies'],
  ['baby food', 'infant food'],
  ['maida', 'refined flour', 'all purpose flour', 'all-purpose flour'],
  ['besan', 'gram flour', 'chana flour'],
  ['rava', 'suji', 'sooji', 'semolina'],
  ['poha', 'flattened rice', 'aval'],
  ['oats', 'oatmeal'],
  ['cereal', 'corn flakes', 'cornflakes', 'breakfast cereal'],
  ['juice', 'fruit juice'],
  ['energy drink', 'sports drink'],
  ['dry fruit', 'dry fruits', 'nuts', 'almonds', 'badam', 'cashew', 'kaju', 'raisins', 'kishmish'],
  ['spice', 'spices', 'masala', 'masalas'],
  ['noodles', 'instant noodles', 'maggi'],
  ['instant food', 'ready to eat', 'ready-to-eat', 'ready to cook', 'ready-to-cook'],
  ['frozen food', 'frozen'],
  ['ice cream', 'icecream'],
  ['chocolate', 'chocolates', 'candy', 'sweets', 'mithai'],
  ['dishwash', 'dish wash', 'dishwashing', 'dishwashing liquid'],
  ['floor cleaner', 'floor cleaning', 'phenyl'],
  ['toilet cleaner', 'toilet cleaning'],
  ['cleaner', 'cleaning supplies', 'home care', 'household cleaning'],
  ['handwash', 'hand wash', 'liquid soap'],
  ['sanitary pad', 'sanitary pads', 'pads', 'period care', 'feminine hygiene'],
  ['personal care', 'body care', 'grooming'],
  ['baby care', 'baby products'],
] as const;

const SYNONYMS = new Map<string, Set<string>>();

const normalizeBasic = (value: unknown) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const stemToken = (token: string) => {
  if (token.length > 5 && token.endsWith('ies')) return token.slice(0, -3) + 'y';
  if (token.length > 5 && token.endsWith('oes')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
};

for (const group of SYNONYM_GROUPS) {
  const normalized = group.map((entry) => normalizeBasic(entry)).filter(Boolean);
  for (const term of normalized) {
    const set = SYNONYMS.get(term) || new Set<string>();
    for (const related of normalized) set.add(related);
    SYNONYMS.set(term, set);
    const stemmed = stemToken(term);
    if (stemmed !== term) {
      const stemSet = SYNONYMS.get(stemmed) || new Set<string>();
      for (const related of normalized) stemSet.add(related);
      SYNONYMS.set(stemmed, stemSet);
    }
  }
}

export const normalizeCatalogText = normalizeBasic;

const tokenize = (value: unknown) => {
  const normalized = normalizeBasic(value);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
};

const boundedLevenshtein = (a: string, b: string, maxDistance: number) => {
  if (a === b) return 0;
  if (!a || !b) return Math.max(a.length, b.length);
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    previous = current;
  }
  return previous[b.length];
};

const queryVariants = (token: string) => {
  const result = new Set<string>([token, stemToken(token)]);
  const direct = SYNONYMS.get(token);
  const stemmed = SYNONYMS.get(stemToken(token));
  direct?.forEach((entry) => {
    result.add(entry);
    tokenize(entry).forEach((part) => result.add(part));
  });
  stemmed?.forEach((entry) => {
    result.add(entry);
    tokenize(entry).forEach((part) => result.add(part));
  });
  return Array.from(result).filter(Boolean);
};

const tokenMatchScore = (queryToken: string, targetToken: string) => {
  if (!queryToken || !targetToken) return 0;
  if (queryToken === targetToken || stemToken(queryToken) === stemToken(targetToken)) return 34;

  const variants = queryVariants(queryToken);
  for (const variant of variants) {
    if (variant === targetToken || stemToken(variant) === stemToken(targetToken)) return variant === queryToken ? 34 : 29;
  }

  const comparable = variants.filter((variant) => variant.length >= 3);
  let best = 0;
  for (const variant of comparable) {
    if (targetToken.startsWith(variant) || variant.startsWith(targetToken)) best = Math.max(best, 24);
    else if (variant.length >= 4 && targetToken.includes(variant)) best = Math.max(best, 19);

    if (variant.length === targetToken.length && variant.length >= 4) {
      for (let index = 0; index < variant.length - 1; index += 1) {
        if (variant[index] === targetToken[index + 1]
          && variant[index + 1] === targetToken[index]
          && variant.slice(0, index) === targetToken.slice(0, index)
          && variant.slice(index + 2) === targetToken.slice(index + 2)) {
          best = Math.max(best, 20);
          break;
        }
      }
    }

    if (variant.length >= 4 && targetToken.length >= 4) {
      const longest = Math.max(variant.length, targetToken.length);
      const maxDistance = longest >= 5 ? 2 : 1;
      const distance = boundedLevenshtein(variant, targetToken, maxDistance);
      if (distance <= maxDistance) best = Math.max(best, 20 - distance * 3);
    }
  }
  return best;
};

const fieldScore = (field: unknown, query: string, weight: number) => {
  const normalizedField = normalizeBasic(field);
  if (!normalizedField) return 0;
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;

  let score = 0;
  if (normalizedField === query) score += 80 * weight;
  else if (normalizedField.includes(query) && query.length >= 2) score += 48 * weight;

  // Phrase-aware synonym expansion lets customer intent such as "cold drink",
  // "ready to eat" or "baby care" match catalog wording without requiring
  // the same phrase to appear in the product row.
  const phraseSynonyms = SYNONYMS.get(query);
  phraseSynonyms?.forEach((related) => {
    if (related !== query && normalizedField.includes(related)) score = Math.max(score, 44 * weight);
  });

  const targetTokens = tokenize(normalizedField);
  for (const queryToken of queryTokens) {
    let best = 0;
    for (const targetToken of targetTokens) {
      best = Math.max(best, tokenMatchScore(queryToken, targetToken));
    }
    score += best * weight;
  }
  return score;
};

export const smartTextMatchScore = (text: unknown, rawQuery: unknown) => {
  const query = normalizeBasic(rawQuery);
  if (!query) return 0;
  return fieldScore(text, query, 1);
};

export const catalogSearchScore = (product: SearchableProduct, rawQuery: unknown) => {
  const query = normalizeBasic(rawQuery);
  if (!query || !product?.name) return 0;

  const nameScore = fieldScore(product.name, query, 5);
  const brandScore = fieldScore(product.brand, query, 2.5);
  const categoryScore = fieldScore(product.category, query, 2.25);
  const sizeScore = fieldScore([product.weight, product.unit].filter(Boolean).join(' '), query, 0.75);
  const descriptionScore = fieldScore(product.description, query, 1.15);
  const metadataScore = fieldScore([product.tags, product.keywords].filter(Boolean).join(' '), query, 1.4);
  const score = nameScore + brandScore + categoryScore + sizeScore + descriptionScore + metadataScore;

  const queryTokens = tokenize(query);
  const completeIndexTokens = tokenize([product.name, product.brand, product.category, product.weight, product.unit, product.description, product.tags, product.keywords].filter(Boolean).join(' '));
  const matchedTokenCount = queryTokens.filter((queryToken) => completeIndexTokens.some((targetToken) => tokenMatchScore(queryToken, targetToken) >= 16)).length;
  const coverage = queryTokens.length ? matchedTokenCount / queryTokens.length : 0;

  if (queryTokens.length > 1 && coverage < 0.5) return 0;
  return Math.round(score * (0.65 + 0.35 * coverage));
};

export const isCatalogSearchMatch = (product: SearchableProduct, rawQuery: unknown) => {
  const query = normalizeBasic(rawQuery);
  if (!query) return true;
  const tokenCount = tokenize(query).length;
  const threshold = tokenCount > 1 ? 105 : 70;
  return catalogSearchScore(product, query) >= threshold;
};

export const getCatalogSearchRecommendations = <T extends SearchableProduct>(products: T[], rawQuery: unknown, limit = 5) => {
  const query = normalizeBasic(rawQuery);
  if (!query) return [] as T[];
  return products
    .map((product, index) => ({ product, index, score: catalogSearchScore(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.product);
};
