export const CREDIT_PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    description: "100 AI Headshots",
    credits: 100,
    price: 9.99,
    priceId:
      process.env.STRIPE_BASIC_PRICE_ID || "price_1O4KyJ2eZvKYlo2C3Ix0Ym6R",
  },
  {
    id: "standard",
    name: "Standard",
    description: "500 AI Headshots",
    credits: 500,
    price: 49.99,
    priceId:
      process.env.STRIPE_STANDARD_PRICE_ID || "price_1O4KzZ2eZvKYlo2C75ZDwEXG",
    popular: true,
    savePercent: 10,
  },
  {
    id: "premium",
    name: "Premium",
    description: "1000 AI Headshots",
    credits: 1000,
    price: 99.99,
    priceId:
      process.env.STRIPE_PREMIUM_PRICE_ID || "price_1O4L0i2eZvKYlo2C2Q9j3t9r",
    savePercent: 15,
  },
];
