/**
 * Default Services and Products for Barbershops/Salons
 * 
 * This file contains comprehensive default data that can be loaded
 * when a new salon is created to help them get started quickly.
 * All prices are in NOK and can be edited by salon owners.
 */

// ============================================================================
// DEFAULT SERVICE CATEGORIES
// ============================================================================

export const defaultServiceCategories = [
  { name: "Herreklipp", displayOrder: 1 },
  { name: "Dameklipp", displayOrder: 2 },
  { name: "Skjegg & Barbering", displayOrder: 3 },
  { name: "Hårfarge", displayOrder: 4 },
  { name: "Behandlinger", displayOrder: 5 },
  { name: "Styling", displayOrder: 6 },
  { name: "Barn & Ungdom", displayOrder: 7 },
  { name: "Pakker", displayOrder: 8 },
];

// ============================================================================
// DEFAULT SERVICES
// ============================================================================

export interface DefaultService {
  categoryName: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export const defaultServices: DefaultService[] = [
  // ---- Herreklipp ----
  {
    categoryName: "Herreklipp",
    name: "Herreklipp Standard",
    description: "Klassisk herreklipp med saks og maskin, inkludert vask og styling",
    durationMinutes: 30,
    price: 399,
  },
  {
    categoryName: "Herreklipp",
    name: "Herreklipp Premium",
    description: "Herreklipp med ekstra tid for detaljert styling og finishing",
    durationMinutes: 45,
    price: 499,
  },
  {
    categoryName: "Herreklipp",
    name: "Fade / Skin Fade",
    description: "Moderne fade-klipp med gradvis overgang fra kort til lengre",
    durationMinutes: 45,
    price: 449,
  },
  {
    categoryName: "Herreklipp",
    name: "Buzz Cut",
    description: "Kort maskineklipp med én lengde over hele hodet",
    durationMinutes: 20,
    price: 299,
  },
  {
    categoryName: "Herreklipp",
    name: "Konturkutt",
    description: "Oppfriskning av konturer rundt ører og nakke",
    durationMinutes: 15,
    price: 199,
  },

  // ---- Dameklipp ----
  {
    categoryName: "Dameklipp",
    name: "Dameklipp Kort",
    description: "Klipp for kort hår, inkludert vask og føning",
    durationMinutes: 45,
    price: 549,
  },
  {
    categoryName: "Dameklipp",
    name: "Dameklipp Medium",
    description: "Klipp for medium langt hår, inkludert vask og føning",
    durationMinutes: 60,
    price: 649,
  },
  {
    categoryName: "Dameklipp",
    name: "Dameklipp Langt",
    description: "Klipp for langt hår, inkludert vask og føning",
    durationMinutes: 75,
    price: 749,
  },
  {
    categoryName: "Dameklipp",
    name: "Lugg/Pannelugg",
    description: "Klipp av pannelugg mellom besøk",
    durationMinutes: 15,
    price: 149,
  },

  // ---- Skjegg & Barbering ----
  {
    categoryName: "Skjegg & Barbering",
    name: "Skjeggtrim",
    description: "Trimming og forming av skjegg med maskin og saks",
    durationMinutes: 20,
    price: 249,
  },
  {
    categoryName: "Skjegg & Barbering",
    name: "Skjeggpleie Deluxe",
    description: "Full skjeggbehandling med olje, varmt håndkle og styling",
    durationMinutes: 30,
    price: 349,
  },
  {
    categoryName: "Skjegg & Barbering",
    name: "Klassisk Barbering",
    description: "Tradisjonell barbering med kniv, varmt håndkle og aftershave",
    durationMinutes: 30,
    price: 399,
  },
  {
    categoryName: "Skjegg & Barbering",
    name: "Head Shave",
    description: "Glattbarbering av hodet med kniv",
    durationMinutes: 30,
    price: 349,
  },

  // ---- Hårfarge ----
  {
    categoryName: "Hårfarge",
    name: "Helfarging Kort Hår",
    description: "Full farging for kort hår, inkludert vask og pleie",
    durationMinutes: 90,
    price: 899,
  },
  {
    categoryName: "Hårfarge",
    name: "Helfarging Medium Hår",
    description: "Full farging for medium langt hår",
    durationMinutes: 120,
    price: 1199,
  },
  {
    categoryName: "Hårfarge",
    name: "Helfarging Langt Hår",
    description: "Full farging for langt hår",
    durationMinutes: 150,
    price: 1499,
  },
  {
    categoryName: "Hårfarge",
    name: "Highlights / Striper",
    description: "Lyse striper eller highlights i håret",
    durationMinutes: 120,
    price: 1299,
  },
  {
    categoryName: "Hårfarge",
    name: "Balayage",
    description: "Naturlig fargeteknikk med håndmalte høylys",
    durationMinutes: 180,
    price: 1899,
  },
  {
    categoryName: "Hårfarge",
    name: "Toning",
    description: "Lett fargejustering eller glanstoning",
    durationMinutes: 45,
    price: 499,
  },
  {
    categoryName: "Hårfarge",
    name: "Grådekking",
    description: "Farging for å dekke grått hår",
    durationMinutes: 60,
    price: 699,
  },

  // ---- Behandlinger ----
  {
    categoryName: "Behandlinger",
    name: "Keratin Behandling",
    description: "Glatting og pleie av håret med keratin",
    durationMinutes: 120,
    price: 1999,
  },
  {
    categoryName: "Behandlinger",
    name: "Olaplex Behandling",
    description: "Reparerende behandling for skadet hår",
    durationMinutes: 45,
    price: 599,
  },
  {
    categoryName: "Behandlinger",
    name: "Hodebunnsbehandling",
    description: "Dyptrensende og pleiende behandling for hodebunnen",
    durationMinutes: 30,
    price: 399,
  },
  {
    categoryName: "Behandlinger",
    name: "Hårkur / Mask",
    description: "Intensiv fuktighetsbehandling for tørt hår",
    durationMinutes: 20,
    price: 249,
  },

  // ---- Styling ----
  {
    categoryName: "Styling",
    name: "Vask og Føning",
    description: "Hårvasking og profesjonell føning",
    durationMinutes: 30,
    price: 349,
  },
  {
    categoryName: "Styling",
    name: "Oppsett Enkel",
    description: "Enkelt oppsett for fest eller anledning",
    durationMinutes: 45,
    price: 499,
  },
  {
    categoryName: "Styling",
    name: "Oppsett Avansert",
    description: "Avansert oppsett med krøller eller fletter",
    durationMinutes: 75,
    price: 799,
  },
  {
    categoryName: "Styling",
    name: "Brudestyling",
    description: "Komplett brudestyling med prøvetime",
    durationMinutes: 120,
    price: 1999,
  },
  {
    categoryName: "Styling",
    name: "Krølltang / Rettetang",
    description: "Styling med varmeverktøy",
    durationMinutes: 30,
    price: 299,
  },

  // ---- Barn & Ungdom ----
  {
    categoryName: "Barn & Ungdom",
    name: "Barneklipp (0-6 år)",
    description: "Klipp for de minste, med tålmodighet og omsorg",
    durationMinutes: 20,
    price: 249,
  },
  {
    categoryName: "Barn & Ungdom",
    name: "Barneklipp (7-12 år)",
    description: "Klipp for barn i skolealder",
    durationMinutes: 25,
    price: 299,
  },
  {
    categoryName: "Barn & Ungdom",
    name: "Ungdomsklipp (13-17 år)",
    description: "Moderne klipp for ungdom",
    durationMinutes: 30,
    price: 349,
  },
  {
    categoryName: "Barn & Ungdom",
    name: "Student (m/gyldig kort)",
    description: "Rabattert klipp for studenter",
    durationMinutes: 30,
    price: 349,
  },

  // ---- Pakker ----
  {
    categoryName: "Pakker",
    name: "Herreklipp + Skjeggtrim",
    description: "Komplett pakke med klipp og skjeggpleie",
    durationMinutes: 45,
    price: 549,
  },
  {
    categoryName: "Pakker",
    name: "Herreklipp + Barbering",
    description: "Klipp med klassisk barbering",
    durationMinutes: 60,
    price: 699,
  },
  {
    categoryName: "Pakker",
    name: "Dameklipp + Farge",
    description: "Klipp og helfarging i én time",
    durationMinutes: 150,
    price: 1599,
  },
  {
    categoryName: "Pakker",
    name: "Wellness Pakke",
    description: "Klipp, behandling og styling - komplett forkjælelse",
    durationMinutes: 120,
    price: 1299,
  },
];

// ============================================================================
// DEFAULT PRODUCT CATEGORIES
// ============================================================================

export const defaultProductCategories = [
  { name: "Stylingprodukter", displayOrder: 1 },
  { name: "Hårpleie", displayOrder: 2 },
  { name: "Skjeggpleie", displayOrder: 3 },
  { name: "Verktøy & Tilbehør", displayOrder: 4 },
  { name: "Gavekort", displayOrder: 5 },
];

// ============================================================================
// DEFAULT PRODUCTS
// ============================================================================

export interface DefaultProduct {
  categoryName: string;
  sku: string;
  name: string;
  description: string;
  costPrice: number;
  retailPrice: number;
  stockQuantity: number;
  reorderPoint: number;
}

export const defaultProducts: DefaultProduct[] = [
  // ---- Stylingprodukter ----
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-001",
    name: "Pomade Matt",
    description: "Matt pomade med medium hold for naturlig look",
    costPrice: 89,
    retailPrice: 249,
    stockQuantity: 20,
    reorderPoint: 5,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-002",
    name: "Pomade Glans",
    description: "Klassisk pomade med høy glans og sterkt hold",
    costPrice: 89,
    retailPrice: 249,
    stockQuantity: 15,
    reorderPoint: 5,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-003",
    name: "Hårvoks",
    description: "Fleksibel voks for tekstur og definisjon",
    costPrice: 79,
    retailPrice: 229,
    stockQuantity: 20,
    reorderPoint: 5,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-004",
    name: "Hårspray Strong Hold",
    description: "Profesjonell hårspray med sterkt hold",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 25,
    reorderPoint: 8,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-005",
    name: "Sea Salt Spray",
    description: "Teksturspray for beach waves og volum",
    costPrice: 59,
    retailPrice: 179,
    stockQuantity: 15,
    reorderPoint: 5,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-006",
    name: "Hårgele",
    description: "Klassisk gele med wet look effekt",
    costPrice: 49,
    retailPrice: 149,
    stockQuantity: 20,
    reorderPoint: 5,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-007",
    name: "Volumspray",
    description: "Løftespray for ekstra volum ved røttene",
    costPrice: 79,
    retailPrice: 219,
    stockQuantity: 12,
    reorderPoint: 4,
  },
  {
    categoryName: "Stylingprodukter",
    sku: "STYLE-008",
    name: "Hårkrem",
    description: "Lett krem for naturlig styling og fuktighet",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 15,
    reorderPoint: 5,
  },

  // ---- Hårpleie ----
  {
    categoryName: "Hårpleie",
    sku: "CARE-001",
    name: "Sjampo Daglig Bruk",
    description: "Mild sjampo for daglig bruk, alle hårtyper",
    costPrice: 59,
    retailPrice: 179,
    stockQuantity: 30,
    reorderPoint: 10,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-002",
    name: "Sjampo Tørt Hår",
    description: "Fuktgivende sjampo for tørt og skadet hår",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 20,
    reorderPoint: 8,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-003",
    name: "Sjampo Fett Hår",
    description: "Dyptrensende sjampo for fett hår og hodebunn",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 15,
    reorderPoint: 5,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-004",
    name: "Balsam",
    description: "Pleiende balsam for mykere og lettere hår",
    costPrice: 59,
    retailPrice: 179,
    stockQuantity: 25,
    reorderPoint: 8,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-005",
    name: "Hårkur Intensiv",
    description: "Dyppleie for ekstremt tørt eller skadet hår",
    costPrice: 99,
    retailPrice: 299,
    stockQuantity: 12,
    reorderPoint: 4,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-006",
    name: "Hårolje",
    description: "Nærende olje for glans og beskyttelse",
    costPrice: 89,
    retailPrice: 269,
    stockQuantity: 15,
    reorderPoint: 5,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-007",
    name: "Leave-in Conditioner",
    description: "Utvaskes ikke - gir fuktighet hele dagen",
    costPrice: 79,
    retailPrice: 229,
    stockQuantity: 12,
    reorderPoint: 4,
  },
  {
    categoryName: "Hårpleie",
    sku: "CARE-008",
    name: "Varmebeskyttelse",
    description: "Spray som beskytter mot varme fra føner og rettetang",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 18,
    reorderPoint: 6,
  },

  // ---- Skjeggpleie ----
  {
    categoryName: "Skjeggpleie",
    sku: "BEARD-001",
    name: "Skjeggolje",
    description: "Nærende olje for mykere skjegg og hud",
    costPrice: 79,
    retailPrice: 229,
    stockQuantity: 20,
    reorderPoint: 5,
  },
  {
    categoryName: "Skjeggpleie",
    sku: "BEARD-002",
    name: "Skjeggbalsam",
    description: "Pleiende balsam som gir hold og form",
    costPrice: 89,
    retailPrice: 249,
    stockQuantity: 15,
    reorderPoint: 5,
  },
  {
    categoryName: "Skjeggpleie",
    sku: "BEARD-003",
    name: "Skjeggvoks",
    description: "Sterk voks for styling av bart og skjegg",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 12,
    reorderPoint: 4,
  },
  {
    categoryName: "Skjeggpleie",
    sku: "BEARD-004",
    name: "Skjeggsjampo",
    description: "Mild sjampo spesielt utviklet for skjegg",
    costPrice: 59,
    retailPrice: 179,
    stockQuantity: 15,
    reorderPoint: 5,
  },
  {
    categoryName: "Skjeggpleie",
    sku: "BEARD-005",
    name: "Aftershave Balm",
    description: "Beroligende balsam etter barbering",
    costPrice: 69,
    retailPrice: 199,
    stockQuantity: 18,
    reorderPoint: 6,
  },
  {
    categoryName: "Skjeggpleie",
    sku: "BEARD-006",
    name: "Aftershave Splash",
    description: "Klassisk aftershave med frisk duft",
    costPrice: 59,
    retailPrice: 179,
    stockQuantity: 15,
    reorderPoint: 5,
  },

  // ---- Verktøy & Tilbehør ----
  {
    categoryName: "Verktøy & Tilbehør",
    sku: "TOOL-001",
    name: "Skjeggkam",
    description: "Håndlaget kam i tre for skjegg",
    costPrice: 49,
    retailPrice: 149,
    stockQuantity: 20,
    reorderPoint: 5,
  },
  {
    categoryName: "Verktøy & Tilbehør",
    sku: "TOOL-002",
    name: "Skjeggbørste",
    description: "Børste med villsvinhår for skjeggpleie",
    costPrice: 79,
    retailPrice: 229,
    stockQuantity: 15,
    reorderPoint: 4,
  },
  {
    categoryName: "Verktøy & Tilbehør",
    sku: "TOOL-003",
    name: "Hårbørste",
    description: "Profesjonell børste for alle hårtyper",
    costPrice: 89,
    retailPrice: 249,
    stockQuantity: 12,
    reorderPoint: 4,
  },
  {
    categoryName: "Verktøy & Tilbehør",
    sku: "TOOL-004",
    name: "Kam Profesjonell",
    description: "Antistatisk kam for styling",
    costPrice: 29,
    retailPrice: 99,
    stockQuantity: 25,
    reorderPoint: 8,
  },
  {
    categoryName: "Verktøy & Tilbehør",
    sku: "TOOL-005",
    name: "Hårklips (10-pack)",
    description: "Profesjonelle klips for seksjonering",
    costPrice: 39,
    retailPrice: 119,
    stockQuantity: 20,
    reorderPoint: 5,
  },
  {
    categoryName: "Verktøy & Tilbehør",
    sku: "TOOL-006",
    name: "Hårstrikk (20-pack)",
    description: "Skånsomme strikker uten metall",
    costPrice: 19,
    retailPrice: 69,
    stockQuantity: 30,
    reorderPoint: 10,
  },

  // ---- Gavekort ----
  {
    categoryName: "Gavekort",
    sku: "GIFT-500",
    name: "Gavekort 500 kr",
    description: "Gavekort på 500 kr - gyldig i 12 måneder",
    costPrice: 500,
    retailPrice: 500,
    stockQuantity: 50,
    reorderPoint: 10,
  },
  {
    categoryName: "Gavekort",
    sku: "GIFT-1000",
    name: "Gavekort 1000 kr",
    description: "Gavekort på 1000 kr - gyldig i 12 måneder",
    costPrice: 1000,
    retailPrice: 1000,
    stockQuantity: 30,
    reorderPoint: 5,
  },
  {
    categoryName: "Gavekort",
    sku: "GIFT-1500",
    name: "Gavekort 1500 kr",
    description: "Gavekort på 1500 kr - gyldig i 12 måneder",
    costPrice: 1500,
    retailPrice: 1500,
    stockQuantity: 20,
    reorderPoint: 5,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getServiceCategoryNames(): string[] {
  return [...new Set(defaultServices.map(s => s.categoryName))];
}

export function getProductCategoryNames(): string[] {
  return [...new Set(defaultProducts.map(p => p.categoryName))];
}

export function getServicesByCategory(categoryName: string): DefaultService[] {
  return defaultServices.filter(s => s.categoryName === categoryName);
}

export function getProductsByCategory(categoryName: string): DefaultProduct[] {
  return defaultProducts.filter(p => p.categoryName === categoryName);
}

export const defaultDataSummary = {
  serviceCategories: defaultServiceCategories.length,
  services: defaultServices.length,
  productCategories: defaultProductCategories.length,
  products: defaultProducts.length,
};
