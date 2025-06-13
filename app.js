import express from "express";

import cors from "cors";

import cookieParser from "cookie-parser";

import { corsOptions } from "./config/corsOptions.js";

import authRouter from "./routes/auth.routes.js";
import refreshRouter from "./routes/refresh.routes.js";
import logoutRouter from "./routes/logout.routes.js";
import verifyRouter from "./routes/verify.routes.js";
import forgetRouter from "./routes/forget.routes.js";
import paymentRouter from "./routes/payment.routes.js";

import errorMiddleware from "./middlewares/error.middleware.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import resetMiddleware from "./middlewares/reset.middleware.js";

import { ENDPOINT_SECRET, STRIPE_SECRET_KEY } from "./config/env.js";
import Stripe from "stripe";
const stripe = new Stripe(STRIPE_SECRET_KEY);
import dbConnectionPromise from './config/db.js';
import { PlanValue } from "./utils/planValue.js";

const app = express();

app.set('trust proxy', true);

app.use(cors(corsOptions));

app.use(cookieParser());

let processedSessions = new Set();

// Match the raw body to content type application/json
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, ENDPOINT_SECRET);
    }
    catch (err) {
        // console.log("first", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // console.log(event.type);
  
    if (processedSessions.has(event.id)) {
      console.log(`Duplicate event received: ${event.id}`);
      return res.json({ received: true });
    }
    processedSessions.add(event.id);
  
  
    try {
        const { type, data } = event;
        let session = data.object;
        let customerId = session.id || null;
        // const clientId = session?.client_reference_id || null;
        // const socketId = clientId ? deviceToSocketMap[clientId] : null;
    
        // console.log(event.type, customerId);
      
        if (customerId) {
          // Handle the event
          switch (event.type) {  
            case 'checkout.session.completed':
                // session = event.data.object;
                // console.log(`completed ${customerId}`, session);
                const email = session.customer_details?.email;
                const subscriptionId = session?.subscription;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                // 1. Get the price ID from the subscription
                const priceId = subscription.items.data[0].price.id;
                // 2. Retrieve the Price object
                const price = await stripe.prices.retrieve(priceId);
                // 3. Retrieve the Product object using price.product
                const product = await stripe.products.retrieve(price.product);
                // 4. Get the plan name
                const planName = product.name.toUpperCase();
                // console.log(planName); // e.g., "BASIC"
                const planId = PlanValue[planName];
                // console.log(planId, email);
              
                if (planId) {
                  const dbConnection = await dbConnectionPromise;
                  await dbConnection.query(
                    'UPDATE users SET plan_id = ? WHERE email = ?',
                    [planId, email]
                  );
                  
                  // console.log(updateResonse);
                }
              // sio.getIO().to(clientId).emit("success", { action: "create", data: {value: true, session_id: customerId} });
                break;
            case 'checkout.session.expired':
                // session = event.data.object;
                console.log('expired');
              // sio.getIO().to(clientId).emit("success", { action: "create", data: {value: false, session_id: customerId} });
                break;
            case 'payment_intent.payment_failed':
                // session = event.data.object;
                // console.log('PaymentIntent was successful!');
                console.log('Customer payment_intent payment_failed...');
              // sio.getIO().to(clientId).emit("success", { action: "create", data: {value: false, session_id: customerId} });
                break;
            case 'payment_intent.succeeded':
                // session = event.data.object;
                // console.log('PaymentIntent was successful!');
                console.log('Customer payment_intent succeeded...');
              // sio.getIO().to(clientId).emit("success", { action: "create", data: {value: true, session_id: customerId} });
                break;
            default:
              console.log(`Unhandled event type ${event.type}`);
          }

          // Return a response to acknowledge receipt of the event
          return res.json({ success: true });
        }
      
        else {
          // sio.getIO().to(clientId).emit("success", { action: "create", data: { value: false, session_id: '' } });
          return res.json({ success: false });
        }
    }

    catch (error) {
      next(error);
    }
});

app.use(express.json());

// ✅ REST OF ROUTES
app.get("/", (req, res) => {
  res.send("Welcome...");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/mail", verifyRouter);
app.use("/api/v1/forget", resetMiddleware, forgetRouter);

app.use("/api/v1/logout", logoutRouter);
app.use("/api/v1/refresh", refreshRouter);

app.use("/api/v1/payments", authMiddleware, paymentRouter);

app.use((req, res, next) => {
	// return res.status(404).send("Page not found...");
	res.sendStatus(404);
})

app.use(errorMiddleware);

export default app;