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

// export const stripeWebhook = onRequest(
//   { 
//     cors: true, 
//     secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] // Add it here
//   }, 
//   async (req, res) => {
//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//     const sig = req.headers["stripe-signature"];
//     let event;

//     try {
//       // Use the secret from process.env instead of a hardcoded string
//       event = stripe.webhooks.constructEvent(
//         req.rawBody, 
//         sig, 
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.error("Webhook Error:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     if (event.type === "payment_intent.succeeded") {
//       const paymentIntent = event.data.object;
//       const userId = paymentIntent.metadata?.userId;

//       if (userId) {
//         const userRef = admin.firestore().collection("users").doc(userId);
//         await userRef.update({
//           boughtLikesBalance: admin.firestore.FieldValue.increment(10)
//         });
//       }
//     }
//     res.json({ received: true });
//   }
// );

export const stripeWebhook = onRequest(
  { 
    cors: true, 
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] 
  }, 
  async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // --- SWITCHBOARD: Handle different event types ---

    switch (event.type) {
      
      // 1. FAN PURCHASE: When someone buys a bundle of 10 likes
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.userId;

        if (userId) {
          const userRef = admin.firestore().collection("users").doc(userId);
          await userRef.update({
            boughtLikesBalance: admin.firestore.FieldValue.increment(10)
          });
          console.log(`Updated likes for fan: ${userId}`);
        }
        break;
      }

      // 2. ARTIST ONBOARDING: When an artist finishes the Stripe form
      case "account.updated": {
        const account = event.data.object;
        const userId = account.metadata?.firebaseUserId;

        // If they finished the form and we have their Firebase ID
        if (account.details_submitted && userId) {
          await admin.firestore().collection('artists').doc(userId).update({
            stripeConnectId: account.id,
            stripeConnected: true,
            payoutsEnabled: account.payouts_enabled
          });
          console.log(`Artist ${userId} is now connected with Stripe ID: ${account.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

export const createConnectAccount = onRequest(
  { cors: true, secrets: ["STRIPE_SECRET_KEY"] },
  async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId, email } = req.body;

    try {
      // 1. Create the Express Account
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
          transfers: { requested: true },
        },
        // Add metadata for the webhook to find the right user
        metadata: {
        firebaseUserId: userId 
      }
      });

      // 2. Save the Account ID to the Artist document
      const artistRef = admin.firestore().collection("artists").doc(userId);
      await artistRef.update({ stripeConnectId: account.id });

      // 3. Create the Onboarding Link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'http://localhost:5173/artist-account', // URL if they refresh/fail
        return_url: 'http://localhost:5173/artist-account', // URL when they finish
        // refresh_url: 'https://indybop.co.uk/artist-account', // URL if they refresh/fail
        // return_url: 'https://indybop.co.uk/artist-account', // URL when they finish
        type: 'account_onboarding',
      });

      res.status(200).send({ url: accountLink.url });
    } catch (error) {
      console.error("Stripe Connect Error:", error);
      res.status(500).send({ error: error.message });
    }
  }
);

export const transferToArtist = onRequest(
  { cors: true, secrets: ["STRIPE_SECRET_KEY"] },
  async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId } = req.body;

    try {
      // 1. Get Artist Data from Firestore
      const artistRef = admin.firestore().collection("artists").doc(userId);
      const artistSnap = await artistRef.get();
      const artistData = artistSnap.data();

      const amountInPence = artistData.pendingEarnings || 0;
      const stripeConnectId = artistData.stripeConnectId;

      // 2. Safety Checks
      if (amountInPence < 2000) {
        return res.status(400).send({ error: "Minimum withdrawal is £20" });
      }
      if (!stripeConnectId) {
        return res.status(400).send({ error: "Stripe account not connected" });
      }

      // 3. Create the Transfer
      const transfer = await stripe.transfers.create({
        amount: amountInPence,
        currency: 'gbp',
        destination: stripeConnectId,
        description: `IndyBop Payout for ${artistData.name}`,
      });

      // 4. Reset Artist's Pending Balance in Firestore
      await artistRef.update({
        pendingEarnings: 0,
        lastPayoutDate: admin.firestore.FieldValue.serverTimestamp(),
        totalPaidOut: admin.firestore.FieldValue.increment(amountInPence)
      });

      return res.status(200).send({ success: true, transferId: transfer.id });
    } catch (error) {
      console.error("Transfer Error:", error);
      return res.status(500).send({ error: error.message });
    }
  }
);