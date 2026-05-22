export type CategoryId =
  | 'doener'
  | 'duerum'
  | 'lahmacun'
  | 'pide'
  | 'pizza'
  | 'burger'
  | 'beilagen'
  | 'salate'
  | 'suesses'
  | 'getraenke';

export type Locale = 'de' | 'en' | 'tr' | 'ru';

export interface LocalizedText {
  de: string;
  en: string;
  tr: string;
  ru: string;
}

export interface Category {
  id: CategoryId;
  slug: string;
  name: LocalizedText;
  tagline: LocalizedText;
  icon: string;
  order: number;
}

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: LocalizedText;
  description: LocalizedText;
  /** Price in EUR cents to avoid float issues */
  priceCents: number;
  image?: string;
  spicy?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  popular?: boolean;
  /** Visible allergen letters per German Allergenkennzeichnung (A–N) */
  allergens?: string[];
  /** Available add-ons identifiers (optional) */
  addons?: string[];
}

export interface AddOn {
  id: string;
  name: LocalizedText;
  priceCents: number;
}

export interface MenuData {
  categories: Category[];
  products: Product[];
  addons: AddOn[];
}
