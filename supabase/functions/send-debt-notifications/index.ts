import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!
);

const serviceRoleKey = secretKeys["default"];
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:notifications@mydebt.app",
  vapidPublicKey,
  vapidPrivateKey
);

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting debt notification check...");

    /* ---------------------------------------------------
       TODAY
    --------------------------------------------------- */

    const today = new Date();

    const todayString =
      today.toISOString().slice(0, 10);

    console.log("Today:", todayString);


    /* ---------------------------------------------------
       LOAD USERS WITH NOTIFICATIONS ENABLED
    --------------------------------------------------- */

    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("notification_settings")
      .select(
        "user_id, enabled, days_before"
      )
      .eq("enabled", true);

    if (settingsError) {
      throw settingsError;
    }

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message:
            "No users have notifications enabled.",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }


    let notificationsSent = 0;
    let notificationsFailed = 0;


    /* ---------------------------------------------------
       PROCESS EACH USER
    --------------------------------------------------- */

    for (const setting of settings) {
      const userId = setting.user_id;

      const daysBefore =
        Number(setting.days_before ?? 3);

      console.log(
        `Processing user ${userId}, ${daysBefore} days before`
      );


      /* -------------------------------------------------
         TARGET DATE
      ------------------------------------------------- */

      const targetDate = new Date(
        `${todayString}T00:00:00`
      );

      targetDate.setDate(
        targetDate.getDate() + daysBefore
      );

      const targetDateString =
        targetDate
          .toISOString()
          .slice(0, 10);


      /* -------------------------------------------------
         LOAD DEBTS
      ------------------------------------------------- */

      const {
        data: debts,
        error: debtsError,
      } = await supabase
        .from("debts")
        .select(
          "id, provider, description, amount, due_date, paid"
        )
        .eq("user_id", userId)
        .eq("paid", false)
        .eq("due_date", targetDateString);

      if (debtsError) {
        console.error(
          "Debt query error:",
          debtsError
        );

        continue;
      }

      if (!debts || debts.length === 0) {
        continue;
      }


      /* -------------------------------------------------
         LOAD DEVICE SUBSCRIPTIONS
      ------------------------------------------------- */

      const {
        data: subscriptions,
        error: subscriptionsError,
      } = await supabase
        .from("notification_subscriptions")
        .select(
          "id, endpoint, p256dh, auth"
        )
        .eq("user_id", userId);

      if (subscriptionsError) {
        console.error(
          "Subscription query error:",
          subscriptionsError
        );

        continue;
      }

      if (
        !subscriptions ||
        subscriptions.length === 0
      ) {
        continue;
      }


      /* -------------------------------------------------
         SEND ONE NOTIFICATION PER DEBT
      ------------------------------------------------- */

      for (const debt of debts) {

        const amount = Number(
          debt.amount ?? 0
        ).toFixed(2);

        const description =
          debt.description ||
          debt.provider ||
          "Οφειλή";

        const notificationPayload = {
          title: "MY DEBTS",
          body:
            `${description} ${amount} € ` +
            `λήγει σε ${daysBefore} ` +
            `${daysBefore === 1 ? "ημέρα" : "ημέρες"}.`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          url: "/",
          tag: `debt-${debt.id}`,
        };


        /* ---------------------------------------------
           SEND TO EVERY USER DEVICE
        --------------------------------------------- */

        for (const subscription of subscriptions) {

          const pushSubscription = {
            endpoint:
              subscription.endpoint,

            keys: {
              p256dh:
                subscription.p256dh,

              auth:
                subscription.auth,
            },
          };


          try {

            await webpush.sendNotification(
              pushSubscription,
              JSON.stringify(
                notificationPayload
              )
            );

            notificationsSent++;

            console.log(
              `Notification sent for debt ${debt.id}`
            );

          } catch (error) {

            notificationsFailed++;

            console.error(
              "Push notification failed:",
              error
            );


            /* -----------------------------------------
               REMOVE INVALID SUBSCRIPTION
            ----------------------------------------- */

            const statusCode =
              error?.statusCode;

            if (
              statusCode === 404 ||
              statusCode === 410
            ) {
              await supabase
                .from(
                  "notification_subscriptions"
                )
                .delete()
                .eq(
                  "id",
                  subscription.id
                );
            }
          }
        }
      }
    }


    /* ---------------------------------------------------
       RESULT
    --------------------------------------------------- */

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        notificationsFailed,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );

  } catch (error) {

    console.error(
      "Notification function error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error?.message ||
          "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});