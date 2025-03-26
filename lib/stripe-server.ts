"use server";

import Stripe from "stripe";

// This file can only export async functions when marked with "use server"
// So we'll create async wrapper functions for all Stripe operations

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  appInfo: {
    name: "AI Headshots Generator",
    version: "1.0.0",
  },
});

// Create a Stripe Checkout Session
export async function createCheckoutSession({
  priceId,
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      ...(customerEmail && { customer_email: customerEmail }),
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

// Retrieve a Stripe Checkout Session
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items"],
    });
    return session;
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    throw error;
  }
}

// Create a Stripe Customer
export async function createCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

// Get or create a Stripe Customer
export async function getOrCreateCustomer({
  email,
  name,
  userId,
}: {
  email: string;
  name?: string;
  userId: string;
}) {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer if not found
    return createCustomer({
      email,
      name,
      metadata: { userId },
    });
  } catch (error) {
    console.error("Error getting or creating customer:", error);
    throw error;
  }
}
