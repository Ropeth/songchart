import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import admin from "firebase-admin"; // Changed from require to import

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

export const createStripeCheckout = onRequest({ cors: true }, async (req, res) => {
  try {
    const { userId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 150, 
      currency: "gbp",
      metadata: { userId: userId, packType: "carnet_10" },
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).send({ error: error.message });
  }
});

export const stripeWebhook = onRequest({ cors: true }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Note: In v2 functions, req.rawBody is available for webhook verification
    event = stripe.webhooks.constructEvent(req.rawBody, sig, "whsec_y9jmy7ochgUWqCjTzewBXd8E8sN2Y1KC");
    //temporary for testing:
    //event = stripe.webhooks.constructEvent(req.rawBody, sig, "whsec_fdf44c35ce59f465cbac65bcb9cdf59a32ca47637af6aceb24f8a8e9ca52e12c");
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const session = event.data.object;
    const userId = session.metadata.userId;

    const userRef = admin.firestore().collection("users").doc(userId);
    
    await userRef.update({
      boughtLikesBalance: admin.firestore.FieldValue.increment(10)
    });
  }

  res.json({ received: true });
});