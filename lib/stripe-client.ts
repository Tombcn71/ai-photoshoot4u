// This file contains only client-safe Stripe constants and functions

// Credit package options
export const CREDIT_PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    credits: 10,
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || "price_basic",
    description: "10 credits for generating AI headshots",
    popular: false,
  },
  {
    id: "standard",
    name: "Standard",
    credits: 50,
    price: 39.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD || "price_standard",
    description: "50 credits for generating AI headshots",
    popular: true,
    savePercent: 20,
  },
  {
    id: "premium",
    name: "Premium",
    credits: 100,
    price: 69.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || "price_premium",
    description: "100 credits for generating AI headshots",
    popular: false,
    savePercent: 30,
  },
];
