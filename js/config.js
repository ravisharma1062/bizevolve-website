/* ==========================================================
   BizEvolve - all editable business info lives here.
   Edit this file, save, and refresh the page. No other code
   needs to change for: phone, email, prices, reviews, demo links.
   ========================================================== */
window.BIZ = {
  name: "BizEvolve",
  tagline: "Modernize your business. Go online in 7 days.",
  whatsappNumber: "918249641675",        // wa.me format, country code first
  phoneDisplay: "+91 82496 41675",
  phoneLink: "tel:+918249641675",
  email: "sakshirsharma@gmail.com",       // public contact email. Set to "" to hide all email buttons and links.
  city: "Bangalore",                      // city only, no street address
  region: "Karnataka",
  country: "IN",
  serviceAreas: "Bangalore and Bihar",
  year: 2026,
  siteUrl: "https://bizevolve.in",        // used for canonical and social tags. Domain is not live yet.

  // Optional: paste a Web3Forms / Formspree endpoint to ALSO send the form by email. Leave "" to turn off.
  FORM_ENDPOINT: "",

  // Default WhatsApp message (people can edit it before sending)
  defaultMessage: "Hi BizEvolve! I want a website for my business. Can you help me?",

  // Starting prices. "price" is shown on the cards.
  packages: [
    { id: "starter",  name: "Starter",  price: "From ₹3,000" },
    { id: "standard", name: "Standard", price: "From ₹6,000" },
    { id: "growth",   name: "Growth",   price: "From ₹10,000" }
  ],

  // Sample concepts (all made-up businesses).
  // When a real demo site exists, paste its address in liveUrl and an "Open live site" button appears in the popup.
  samples: [
    { id: "coaching", title: "Coaching centre concept", kind: "Coaching centre",
      blurb: "Calm blue design with class schedule and fees blocks.", liveUrl: "" },
    { id: "salon",    title: "Salon concept", kind: "Salon",
      blurb: "Pink and gold design with services and a booking button.", liveUrl: "" },
    { id: "tiffin",   title: "Tiffin service concept", kind: "Tiffin service",
      blurb: "Fresh green design with a menu and WhatsApp order button.", liveUrl: "" }
  ],

  // Keep EMPTY until real customer reviews exist.
  // Format: { name: "Customer name", business: "Business name", text: "What they said" }
  reviews: []
};
