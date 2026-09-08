import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      if (req.method === "OPTIONS") {
        return new Response("ok", {
          headers: corsHeaders,
        });
      }

      try {
        const body = await req.json();

        const image = body?.image;

        if (!image || typeof image !== "string") {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Δεν στάλθηκε εικόνα απόδειξης.",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }

        const openaiKey = Deno.env.get("OPENAI_API_KEY");

        if (!openaiKey) {
          throw new Error(
            "Δεν έχει ρυθμιστεί το OPENAI_API_KEY.",
          );
        }

        const response = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },

            body: JSON.stringify({
              model: "gpt-5.6-luna",

              input: [
                {
                  role: "user",

                  content: [
                    {
                      type: "input_text",

                      text: `
Ανάλυσε την εικόνα της ελληνικής απόδειξης.

Εξήγαγε μόνο στοιχεία που εμφανίζονται πραγματικά
στην εικόνα.

Χρειαζόμαστε:

- merchant: όνομα καταστήματος
- date: ημερομηνία αγοράς σε YYYY-MM-DD
- amount: τελικό πληρωτέο ποσό ως αριθμός
- category: κατηγορία εξόδου

Επιτρεπόμενες κατηγορίες:

Supermarket
Εστιατόριο
Καφέ
Καύσιμα
Υγεία
Φαρμακείο
Ένδυση
Σπίτι
Μεταφορές
Διασκέδαση
Λογαριασμοί
Άλλο

ΠΡΟΣΟΧΗ:

Μην μαντέψεις στοιχεία.

Αν δεν μπορείς να διαβάσεις με βεβαιότητα
ένα στοιχείο, επέστρεψε null.

Για το amount χρησιμοποίησε το τελικό ποσό
που πληρώθηκε και όχι υποσύνολο ή ποσό ΦΠΑ.

Επέστρεψε μόνο το ζητούμενο JSON.
`,
                    },

                    {
                      type: "input_image",
                      image_url: image,
                      detail: "high",
                    },
                  ],
                },
              ],

              text: {
                format: {
                  type: "json_schema",

                  name: "receipt_data",

                  strict: true,

                  schema: {
                    type: "object",

                    properties: {
                      merchant: {
                        type: ["string", "null"],
                      },

                      date: {
                        type: ["string", "null"],
                      },

                      amount: {
                        type: ["number", "null"],
                      },

                      category: {
                        type: ["string", "null"],
                      },
                    },

                    required: [
                      "merchant",
                      "date",
                      "amount",
                      "category",
                    ],

                    additionalProperties: false,
                  },
                },
              },
            }),
          },
        );

        const responseText = await response.text();

        if (!response.ok) {
          console.error(
            "OpenAI API error:",
            responseText,
          );

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Η υπηρεσία OCR δεν μπόρεσε να αναλύσει την απόδειξη.",
            }),
            {
              status: response.status,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }

        const result = JSON.parse(responseText);

        const outputText = result?.output_text;

        if (!outputText) {
          throw new Error(
            "Δεν επιστράφηκαν δεδομένα από το OCR.",
          );
        }

        const receipt = JSON.parse(outputText);

        return new Response(
          JSON.stringify({
            success: true,
            receipt,
          }),
          {
            status: 200,

            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (error) {
        console.error(
          "Analyze receipt error:",
          error,
        );

        return new Response(
          JSON.stringify({
            success: false,
            error:
              error?.message ||
              "Δεν ήταν δυνατή η ανάλυση της απόδειξης.",
          }),
          {
            status: 500,

            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }
    },
  ),
};