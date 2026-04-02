export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatarInitial: string;
  avatarVariant: "terra" | "teal" | "default";
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "We raised more in two weeks selling coffee than we did in a whole semester of bake sales. Parents actually wanted to buy.",
    author: "Meredith K.",
    role: "PTA President",
    avatarInitial: "M",
    avatarVariant: "terra",
  },
  {
    quote:
      "The magic link system is genius. I get a notification, click one link, print the label, and ship. No dashboard to learn, no logins to remember.",
    author: "Danny R.",
    role: "Roaster / Owner",
    avatarInitial: "D",
    avatarVariant: "teal",
  },
  {
    quote:
      "I bought a bag to support my kid's soccer team and it was genuinely the best coffee I'd had in months. Already reordered.",
    author: "Priya S.",
    role: "Buyer / Parent",
    avatarInitial: "P",
    avatarVariant: "default",
  },
];
