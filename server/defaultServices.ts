/**
 * Default barber services for Norwegian salons
 * These can be used as presets during tenant onboarding
 */

export const DEFAULT_BARBER_SERVICES = [
  {
    name: "Herreklipp",
    durationMinutes: 30,
    priceNok: 420,
    category: "Klipp",
    description: "En klassisk herreklipp med maskin og saks. Inkluderer styling.",
    isActive: true,
    displayOrder: 1,
  },
  {
    name: "Skin Fade",
    durationMinutes: 40,
    priceNok: 500,
    category: "Klipp",
    description: "Presis fade med skarpe linjer. Perfekt for moderne stiler.",
    isActive: true,
    displayOrder: 2,
  },
  {
    name: "Barneklipp (0–12 år)",
    durationMinutes: 25,
    priceNok: 280,
    category: "Barn",
    description: "Skånsom og rask klipp til barn i trygge omgivelser.",
    isActive: true,
    displayOrder: 3,
  },
  {
    name: "Skjeggtrim",
    durationMinutes: 20,
    priceNok: 250,
    category: "Skjegg",
    description: "Forming, trimming og linjer for skjegg og bart.",
    isActive: true,
    displayOrder: 4,
  },
  {
    name: "Klipp + Skjegg",
    durationMinutes: 50,
    priceNok: 700,
    category: "Pakke",
    description: "Komplett pakke: herreklipp med skjeggforming og styling.",
    isActive: true,
    displayOrder: 5,
  },
  {
    name: "Barbering (Hot Towel)",
    durationMinutes: 35,
    priceNok: 520,
    category: "Barbering",
    description: "Tradisjonell barbering med varme håndklær og kniv.",
    isActive: true,
    displayOrder: 6,
  },
  {
    name: "Full Grooming",
    durationMinutes: 75,
    priceNok: 990,
    category: "Pakke",
    description: "Premium behandling: klipp, skjegg, barbering og styling.",
    isActive: true,
    displayOrder: 7,
  },
  {
    name: "Studentklipp",
    durationMinutes: 30,
    priceNok: 330,
    category: "Klipp",
    description: "Rabattert klipp for studenter (gyldig studentbevis kreves).",
    isActive: true,
    displayOrder: 8,
  },
  {
    name: "Pensjonistklipp",
    durationMinutes: 25,
    priceNok: 280,
    category: "Klipp",
    description: "Rimelig klipp for pensjonister.",
    isActive: true,
    displayOrder: 9,
  },
  {
    name: "Vask & Styling",
    durationMinutes: 15,
    priceNok: 130,
    category: "Tillegg",
    description: "Hårvask, føn og enkel styling for en frisk look.",
    isActive: true,
    displayOrder: 10,
  },
] as const;

export type DefaultService = typeof DEFAULT_BARBER_SERVICES[number];
