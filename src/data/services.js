// Comprehensive Services & Coaching Offerings for Trainer David
export const servicesData = [
  {
    id: "personal-training",
    title: "1-on-1 Online Personal Training",
    badge: "Most Popular",
    category: "Coaching",
    icon: "Dumbbell",
    tagline: "Customized exercise programming with real-time biofeedback",
    description: "Work directly with David to build strength, correct muscle imbalances, and achieve sustainable physique transformations with periodized plans designed for your schedule.",
    features: [
      "Custom workout splits for your gym or home setup",
      "Weekly form check-in & video technique audits",
      "Progressive overload tracking & rep-max calculations",
      "Direct WhatsApp / in-app coaching messenger access"
    ]
  },
  {
    id: "custom-nutrition",
    title: "Nutrition & Macro Blueprint",
    badge: "Results Driven",
    category: "Nutrition",
    icon: "Utensils",
    tagline: "Evidence-based meal strategy without restrictive fad diets",
    description: "Calculated macronutrient and caloric targets tailored to your metabolic rate, body composition goals (cutting, lean bulking, or body recomposition), and dietary preferences.",
    features: [
      "Personalized daily calorie & macro breakdown (P/C/F)",
      "Sample grocery shopping lists & high-protein meal ideas",
      "Dining out & travel flexibility guide",
      "Digestive health & supplement optimization protocols"
    ]
  },
  {
    id: "sports-coaching",
    title: "Sports Performance Coaching",
    badge: "Athletic Edge",
    category: "Sports Coaching",
    icon: "Zap",
    tagline: "Speed, agility, rotational power & sport-specific conditioning",
    description: "Designed for competitive athletes, combat sports, runners, and team athletes seeking explosive acceleration, endurance conditioning, and injury resilience.",
    features: [
      "Sport-specific movement pattern conditioning",
      "Power generation, plyometrics & rate of force development",
      "Energy system conditioning (aerobic & anaerobic thresholds)",
      "In-season vs. off-season periodization cycles"
    ]
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy & Rehab Assessment",
    badge: "Injury Prevention",
    category: "Physiotherapy",
    icon: "Activity",
    tagline: "Overcome nagging joint pain, mobility blocks & posture faults",
    description: "Comprehensive biomechanical audit of your joints, kinetic chains, and movement restrictions to rehabilitate old injuries and build a pain-free, resilient body.",
    features: [
      "Full kinetic chain & posture imbalance diagnosis",
      "Joint decompression & active mobility routines",
      "Corrective exercise prescribing for shoulders, knees, & spine",
      "Safe return-to-heavy-lifting ramp protocols"
    ]
  }
];

// FitToken Recharge Bundles: 1 Token = USD $1 (Integrated with Stripe Checkout)
export const tokenPackages = [
  {
    id: "recharge-100",
    tokens: 100,
    name: "100 Tokens",
    priceUsd: 100,
    popular: false,
    stripePriceId: "price_1USPjZI8bClhBF4PaGSO8uth",
    stripePaymentUrl: "https://buy.stripe.com/test_cNidR9cIIfZzgo01Jf1wY00",
    description: "Recharge 100 FitTokens at USD $1 per token. Stream 100 video masterclasses (1 token each)."
  },
  {
    id: "recharge-300",
    tokens: 300,
    name: "300 Tokens",
    priceUsd: 300,
    popular: true,
    stripePriceId: "price_1USPjfI8bClhBF4P55ZvxrR1",
    stripePaymentUrl: "https://buy.stripe.com/test_dRmcN54cc5kV0p2bjP1wY01",
    description: "Recharge 300 FitTokens at USD $1 per token. Stream 300 video masterclasses (1 token each)."
  },
  {
    id: "recharge-600",
    tokens: 600,
    name: "600 Tokens",
    priceUsd: 600,
    popular: false,
    stripePriceId: "price_1USPjoI8bClhBF4PzNhI9iUi",
    stripePaymentUrl: "https://buy.stripe.com/test_eVq4gz2443cN0p25Zv1wY02",
    description: "Recharge 600 FitTokens at USD $1 per token. Stream 600 video masterclasses (1 token each)."
  }
];

// Monthly Membership Tiers
export const membershipTiers = [
  {
    id: "monthly-pass",
    name: "Monthly All-Access Pass",
    tokensCost: 99,
    priceUsd: 99,
    interval: "month",
    stripePriceId: "price_1USPk9I8bClhBF4PX306QWo2",
    stripePaymentUrl: "https://buy.stripe.com/test_4gM8wP244eVv3Be5Zv1wY03",
    description: "Unlimited streaming of all 31+ workout masterclasses with zero token deductions.",
    features: [
      "Stream all 31+ video tutorials with 0 token deductions",
      "Priority consultation scheduling with Trainer David",
      "Exclusive biomechanical exercise breakdowns & updates",
      "Cancel anytime with 1-click in your Stripe portal"
    ]
  }
];

