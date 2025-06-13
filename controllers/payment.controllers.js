import io from "../config/socket.js";
import Stripe from "stripe";
import dbConnectionPromise from "../config/db.js";
import { validationResult } from "express-validator";

import {
  STRIPE_SECRET_KEY,
  PLAN_ID1,
  PLAN_ID2,
  PLAN_ID3,
  BASE_URL2
} from "../config/env.js";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const get_subscription_home = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    const email = req.params.email?.toLowerCase();

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      throw error;
    }

    const db = await dbConnectionPromise;

    const [existingUser] = await db.query(
      "SELECT email FROM users WHERE email = ?", 
      [email]
    );

    if (!existingUser || existingUser.length === 0) {
      const error = new Error("User not found. Please Login again.");
      error.statusCode = 404;
      throw error;
    }

    const customer = await stripe.customers.list({
      email: existingUser[0]?.email
    });
    const customerId = customer.data[0]?.id;
    // console.log(customerId, !customerId);

    if (!customerId) {
      const error1 = new Error("No customer found with this email");
      error1.statusCode = 400;
      throw error1;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
    });

    const cancelPromises = subscriptions.data
      .filter(
        (i) =>
          i.status !== "canceled" &&
          i.status !== "active" &&
          i.status !== "paused"
      )
      .map((i) =>
        stripe.subscriptions
          .cancel(i.id)
          .then(() => {
            console.log(
              `Subscription ${i.id} with status ${i.status} has been canceled.`
            );
            return true; // Return a value to track success
          })
          .catch((error) => {
            console.error(
              `Failed to cancel subscription ${i.id}:`,
              error.message
            );
            return false; // Return a value to track failure
          })
      );

    const results = await Promise.allSettled(cancelPromises);

    return res.status(200).json({
      isSuccess: true
    });
  } 

  catch (error) {
    console.log("get subscriptions home error: ", error);

    next(error);
  }
};

export const post_subscription_plan = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    const email = req.body?.email.toLowerCase() || "";

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      error.oldInput = { email };
      throw error;
    }

    
    const customer = await stripe.customers.list({
      email: email
    });
    const customerId = customer.data[0]?.id;

    if (!customerId) {
      const error1 = new Error("No customer found with this email");
      error1.statusCode = 400;
      throw error1;
    } 

    const products = await stripe.products.list({
      active: true,
    });

    // console.log(products.data);

    const prices = await stripe.prices.list({
      active: true,
    });

    // console.log(prices.data);
        
    const plans = products.data
      .map((product, index) => {
        const matchingPrice = prices.data
          .filter(i => i.type === "recurring")
          .find(price => price.id === product.default_price);

        if (!matchingPrice) return null; // skip if not found

        return {
          id: index+1,
          name: product?.name,
          description: product?.description,
          amount: matchingPrice?.unit_amount_decimal,
          interval: matchingPrice?.recurring?.interval,
          interval_count: matchingPrice?.recurring?.interval_count,
        };
      })
      .filter(Boolean) // remove nulls
      .reverse();

        
    // console.log(plans)

    if (!plans) {
      const error1 = new Error(
        "Sorry there has been a issue....... Kindly refresh the page"
      );
      error1.statusCode = 400;
      throw error1;
    } else {
      return res.status(200).json({
        isSuccess: true,
        plans: plans
      });
    }
  } catch (error) {
    console.log("get subscription plans error...");

    next(error);
  }
};

export const post_subscription = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    const email = req.body?.email.toLowerCase() || "";

    const { plan } = req.body;

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      error.oldInput = { email };
      throw error;
    } 

    const customer = await stripe.customers.list({
      email: email
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      const error1 = new Error("No customer found with this email");
      error1.statusCode = 400;
      throw error1;
    } 

    else {
      let priceID;

      switch (plan.toUpperCase()) {
        case "BASIC":
          priceID = PLAN_ID1;
          break;
        case "STANDARD":
          priceID = PLAN_ID2;
          break;
        case "PREMIUM":
          priceID = PLAN_ID3;
          break;
        default:
          const error1 = new Error("Invalid plan found. Please Try Again...");
          error1.statusCode = 400;
          throw error1;
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });

      // const alreadySubscribed = subscriptions.data.some((sub) =>
      //   sub.items.data.some((item) => item.price.id == priceID)
      // )

      // console.log(subscriptions.data[0].items);
      // console.log("already subscribed: ", alreadySubscribed);

      if (subscriptions.data.length >= 1) {
        return res.status(200).json({
          isSuccess: true,
          message: "Your account already has an active plan"
        });
      } 
        
      else {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer: customerId,
          line_items: [
            {
              price: priceID,
              quantity: 1
            },
          ],
          // subscription_data: {
          //   trial_period_days: 7,
          // },
          success_url: `${BASE_URL1}/users?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${BASE_URL1}/cancel`
        });

        // console.log(session?.url);

        return res.status(200).json({
          isSuccess: true,
          url: session?.url
        });

        // return res.redirect(session.url);
      }
    }
  } catch (error) {
    console.log("post subscription error: ", error);

    next(error);
  }
};

export const get_user_subscriptions = async (req, res, next) => {
  try {
    const email = req.body?.email.toLowerCase() || "";

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      error.oldInput = { email };
      throw error;
    } 

    const customer = await stripe.customers.list({
      email: email
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, email);

    if (!customerId) {
      const error1 = new Error("No customer found with this email");
      error1.statusCode = 400;
      throw error1;
    } 

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          expand: ['data.default_payment_method']
        });

        // console.log(subscriptions.data[0]);

    if (subscriptions?.data.length >= 1) {
          const subscriptionDetailsPromises = subscriptions.data.map(
            async (subscription) => {
              // console.log(subscription.status);
              // Check if the subscription status is not 'canceled'
              if (
                subscription.status !== "canceled" &&
                subscription.status !== "incomplete" &&
                subscription.status !== "incomplete_expired"
              ) {
                // Process the items of the subscription if it's not canceled
                const itemDetailsPromises = subscription.items.data.map(
                  async (item) => {
                    const productId = item.plan.product;

                    // Fetch the product and its associated prices concurrently
                    const [product, prices] = await Promise.allSettled([
                      stripe.products.retrieve(productId),
                      stripe.prices.list({ product: productId }), // Get all prices for the product
                    ]);
                    
                    // console.log(product, prices.value.data);

                    // Step 4: Find the matching price by comparing with the product's default price
                    const matchingPrice = prices.value.data.find(
                      (price) => price.id === product.value.default_price
                    );
                    
                    // console.log(matchingPrice);

                    // Step 5: Return the details for the subscription item if a match is found
                    if (matchingPrice) {
                      return {
                        subscription_id: subscription?.id,
                        subscription_status: subscription?.status,
                        product_name: product.value?.name,
                        product_description: product.value?.description,
                        amount: matchingPrice?.unit_amount_decimal, // Price in decimal format
                        interval: matchingPrice?.recurring?.interval, // Recurring billing interval (if applicable)
                        interval_count:
                          matchingPrice?.recurring?.interval_count, // Interval count (if applicable)
                        created: subscription?.created ? new Date(subscription.created * 1000) : null,
                        card: { 
                          brand: subscription?.default_payment_method.card.brand,
                          country: subscription?.default_payment_method.card.country,
                          exp_month: subscription?.default_payment_method.card.exp_month,
                          exp_year: subscription?.default_payment_method.card.exp_year,
                          last4: subscription?.default_payment_method.card.last4
                        }
                      };
                    } else {
                      return null; // Handle case where no matching price is found
                    }
                  }
                );

                // Filter out null values if no matching price is found for any item
                const validItemDetails = (
                  await Promise.allSettled(itemDetailsPromises)
                ).filter((item) => item !== null);

                // console.log(validItemDetails);

                return {
                  subscription_id: subscription?.id,
                  subscription_status: subscription?.status,
                  product_name: validItemDetails[0].value?.product_name,
                  product_description: validItemDetails[0].value?.product_description,
                  amount: validItemDetails[0].value?.amount,
                  interval: validItemDetails[0].value?.interval,
                  interval_count: validItemDetails[0].value?.interval_count,
                  created: validItemDetails[0].value?.created,
                  card_details: validItemDetails[0].value?.card
                };
              } else {
                // Return null or an empty object if subscription is canceled
                return null;
              }
            }
          );

          // Step 6: Wait for all subscription details to resolve
          const allSubscriptionDetails = (
            await Promise.allSettled(subscriptionDetailsPromises)
          ).filter((subscription) => subscription.value !== null);

          // Flatten the array (because we have an array of arrays)
          const flatSubscriptionDetails = allSubscriptionDetails.flat();

          // console.log(flatSubscriptionDetails);

          // Step 7: Log the subscription details or process further
          // flatSubscriptionDetails.forEach(details => {
          //   console.log('Subscription Item Details:', details);
          // });

          if (flatSubscriptionDetails.length >= 1) {
            return res.status(200).json({
              isSuccess: true,
              plans: flatSubscriptionDetails
            });
          } 
          
          const error1 = new Error(
            "You don’t have an active subscription. Please choose a plan to start streaming."
          );
          error1.statusCode = 400;
          throw error1;

          // return res.status(200).json({
          //   isSuccess: false,
          //   plans: [],
          //   message: "You don’t have an active subscription. Please choose a plan to start streaming.",
          //   suggestion: "Visit the Plans section to explore available options.",
          // });
    } 

    else {
      const error1 = new Error(
        "Failed. Try Again..."
      );
      error1.statusCode = 500;
      throw error1;
    }
  } catch (error) {
    console.log("post user subscriptions error: ", error);

    next(error);
  }
};

export const cancel_subscription = async (req, res, next) => {
  try {
    const { subscription_id } = req.body;

    const email = req.body?.email.toLowerCase() || "";

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      error.oldInput = { email };
      throw error;
    }

    const customer = await stripe.customers.list({
      email: email
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email, s_id);

    if (!customerId && !subscription_id) {
      const error1 = new Error("No customer found with this email");
      error1.statusCode = 400;
      throw error1;
    }
    const subscription = await stripe.subscriptions.cancel(subscription_id);

    // console.log(subscription);

    if (!subscription) {
      const error1 = new Error("Failed to cancel subscription. Try Again...");
      error1.statusCode = 400;
      throw error1;
    }
    
    const db = await dbConnectionPromise;
    
    await db.query(
        'UPDATE users SET plan_id = ? WHERE email = ?',
        [null, email]
    );

    return res.status(200).json({
      isSuccess: true,
    });
  } catch (error) {
    console.log("get cancel subscription error: ", error);

    next(error);
  }
};

export const get_subscription_status = async (req, res, next) => {
  try {
    const email = req.body?.email.toLowerCase() || "";

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      error.oldInput = { email };
      throw error;
    }

    const customer = await stripe.customers.list({
      email: email
    });
    const customerId = customer.data[0]?.id;

    // console.log(customerId, req.cookies._prod_email);

    if (!customerId) {
      const error1 = new Error("No customer found with this email");
      error1.statusCode = 400;
      throw error1;
    } 

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all"
    });

    // console.log(subscriptions?.data);

    if (subscriptions?.data && subscriptions?.data.length >= 1) {
          const isTrial = subscriptions?.data
            .filter(
              (i) =>
                i.status === "trialing" ||
                i.status === "active" ||
                i.status === "canceled" ||
                i.status === "past_due" ||
                i.status === "incomplete" ||
                i.status === "incomplete_expired" ||
                i.status === "unpaid" ||
                i.status === "paused"
            )
            .map((i) => ({ status: i.status, id: i.id, data: i.items.data }));

          // console.log(isTrial);

          if (isTrial) {
            const activeOrTrialing = isTrial.some(
              (sub) => sub.status === "active" || sub.status === "trialing"
            );

            // Find the first active or trialing subscription to get its details
            const activeSub = isTrial.find(
              (sub) => sub.status === "active" || sub.status === "trialing"
            );

            // console.log(activeOrTrialing, activeSub);
            return res.status(200).json({
              isCustomerExist: true,
              isSubActive: activeOrTrialing,
              start_date: activeSub?.data[0].current_period_start,
              end_date: activeSub?.data[0].current_period_end,
              subId: activeSub?.id
            });
          } else {
            return res.status(200).json({
              isCustomerExist: true,
              isSubActive: false
            });
          }
    }

    return res.status(200).json({
      isCustomerExist: true,
      isSubActive: false
    });
  } catch (error) {
    console.log("get subscription status error: ", error);

    next(error);
  }
};

export const check_subscription_status = async (req, res, next) => {
  try {
    const email = req.body?.email.toLowerCase() || "";
    const sessionId = req.body.customer || '';    
    // console.log(req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      error.oldInput = { email };
      throw error;
    }

    const db = await dbConnectionPromise;

    const [existingUser] = await db.query(
      "SELECT device_id FROM users WHERE email = ?",
      [email]
    );

    if (!existingUser || existingUser.length === 0) {
      const error = new Error("User not found. Please Login again...");
      error.statusCode = 404;
      throw error;
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // console.log(session);

    if (session.payment_status === 'paid') {
      io.getIO().to(existingUser[0]?.device_id).emit("success", { action: "create", data: { value: true, session_id: sessionId } });
      return res.status(200).json({
        "isSuccess": true
      })
    } 

    else {
      io.getIO().to(existingUser[0]?.device_id).emit("success", { action: "create", data: { value: false, session_id: sessionId } });
      // return res.redirect('/cancel'); // Redirect to the cancel page if the payment failed or is incomplete
      return res.status(200).json({
        "isSuccess": false
      })
    }
  }
  
  catch (error) {
    console.log("check subscription status error: ", error);

    next(error);
  }
};