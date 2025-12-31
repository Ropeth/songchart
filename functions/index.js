/* eslint-disable no-undef */
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import admin from "firebase-admin";

// 1. Initialize admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// 2. We don't initialize Stripe at the top level anymore 
// because the secret isn't available until the function starts.

export const createStripeCheckout = onRequest(
  { 
    cors: true, 
    secrets: ["STRIPE_SECRET_KEY"] // 3. Explicitly tell Firebase to load this secret
  }, 
  async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // 4. Now process.env works!
    
    try {
      const { userId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 150,
        currency: "gbp",
        metadata: { userId: userId },
        automatic_payment_methods: { enabled: true },
      });

      res.status(200).send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
);

export const stripeWebhook = onRequest(
  { 
    cors: true, 
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] // Add it here
  }, 
  async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Use the secret from process.env instead of a hardcoded string
      event = stripe.webhooks.constructEvent(
        req.rawBody, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        const userRef = admin.firestore().collection("users").doc(userId);
        await userRef.update({
          boughtLikesBalance: admin.firestore.FieldValue.increment(10)
        });
      }
    }
    res.json({ received: true });
  }
);