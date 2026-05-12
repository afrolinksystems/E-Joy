import type { AppPath } from "@/pages/types";

export const mawaFacts = {
  name: "Mawa Coffee and Roastery",
  localName: "ማዋ ኮፊ እና ሮስተር",
  shortName: "Mawa",
  rating: "5.0",
  reviewCount: "23",
  phone: "098 484 8499",
  address: "Africa Ave, Addis Ababa 1000",
  hours: "6:30 AM - 8:30 PM",
  instagram: "instagram.com",
};

export const navItems: Array<{ label: string; path: AppPath }> = [
  { label: "Home", path: "/" },
  { label: "Menu", path: "/menu" },
  { label: "Gallery", path: "/gallery" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export const photoLibrary = {
  hero:
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1800&q=86",
  bar:
    "https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=1400&q=86",
  pour:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=86",
  beans:
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=86",
  latte:
    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=86",
  pastries:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1300&q=86",
  brunch:
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1300&q=86",
  roaster:
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1300&q=86",
  table:
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1400&q=86",
  espresso:
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=86",
};

export const signatureMenu = [
  {
    name: "Mawa Signature Latte",
    detail: "Velvety espresso, steamed milk, soft caramel notes.",
    price: "ETB 160",
  },
  {
    name: "Roastery Cold Brew",
    detail: "Slow-steeped, clean finish, served over crystal ice.",
    price: "ETB 185",
  },
  {
    name: "Macchiato Ritual",
    detail: "Small cup, rich crema, morning energy in one sip.",
    price: "ETB 95",
  },
  {
    name: "Honey Butter Croissant",
    detail: "Warm pastry, light gloss, perfect with espresso.",
    price: "ETB 145",
  },
  {
    name: "Mawa Brunch Plate",
    detail: "Eggs, toast, greens, and the calm of a slow table.",
    price: "ETB 320",
  },
];

export const cafePromises = [
  "Freshly roasted coffee",
  "Dine-in, takeaway, and no-contact delivery",
  "QR table ordering ready",
  "Warm interiors on Africa Avenue",
];

export const reviews = [
  {
    quote:
      "A calm place to start the day. The coffee feels carefully roasted and the room has a soft, warm mood.",
    author: "Guest review",
  },
  {
    quote:
      "Clean tables, friendly service, and a coffee menu that feels serious without being complicated.",
    author: "Local customer",
  },
  {
    quote:
      "The kind of cafe where a quick cup turns into a longer conversation.",
    author: "Mawa regular",
  },
];

export const galleryItems = [
  { title: "Morning Bar", category: "Interior", image: photoLibrary.bar },
  { title: "Slow Pour", category: "Coffee", image: photoLibrary.pour },
  { title: "Fresh Roast", category: "Roastery", image: photoLibrary.beans },
  { title: "Latte Craft", category: "Coffee", image: photoLibrary.latte },
  { title: "Pastry Table", category: "Food", image: photoLibrary.pastries },
  { title: "Brunch Service", category: "Food", image: photoLibrary.brunch },
  { title: "Roastery Corner", category: "Roastery", image: photoLibrary.roaster },
  { title: "Dine-in Room", category: "Interior", image: photoLibrary.table },
  { title: "Espresso Light", category: "Coffee", image: photoLibrary.espresso },
];

export const menuFallbackImages = [
  photoLibrary.latte,
  photoLibrary.espresso,
  photoLibrary.pastries,
  photoLibrary.brunch,
  photoLibrary.beans,
  photoLibrary.pour,
];
