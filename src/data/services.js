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

export const tokenPackages = [
  {
    id: "starter",
    tokens: 25,
    name: "Starter Pack",
    price: 19,
    popular: false,
    perToken: "$0.76",
    bonus: "",
    description: "Watch 25 full video masterclasses at 1 token per video."
  },
  {
    id: "pro",
    tokens: 75,
    name: "Transformation Pack",
    price: 49,
    popular: true,
    perToken: "$0.65",
    bonus: "+15 Bonus Tokens",
    description: "Most popular: 90 total tokens, perfect towards your Monthly All-Access Pass."
  },
  {
    id: "elite",
    tokens: 200,
    name: "Elite Athlete Pack",
    price: 119,
    popular: false,
    perToken: "$0.59",
    bonus: "+50 Bonus Tokens & Priority Booking",
    description: "250 total tokens: unlocks over 2.5 months of full Monthly All-Access streaming."
  }
];

export const membershipTiers = [
  {
    id: "monthly-all-access",
    name: "Monthly All-Access Pass",
    tokensPerMonth: 99,
    priceDisplay: "99 Tokens",
    period: "/ month",
    description: "Unlimited streaming of all 31+ instructional training videos. All videos are completely free for active subscribers.",
    features: [
      "All 31+ workout videos completely free to watch",
      "No per-video token deductions while subscribed",
      "Step-by-step coaching cues & muscle isolation guides",
      "Immediate access to all new workout video drops",
      "Priority consultation booking with Trainer David",
      "Cancel anytime with one click"
    ]
  }
];
