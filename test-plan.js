const plan = "max";
const availableLogos = [
  "logo.png",
  "logo-noir.png",
  "logo-noir-blanc.png",
  "logo-vert-blanc.png",
  "logo-vert-noir.png",
  "logo-violet-blanc.png",
  "logo-violet-noir.png",
  "logo-red-blanc.png",
  "logo-red-noir.png",
  "logo-reddégradé-blanc.png",
  "logo-reddégradé-noir.png",
  "ai-star-black.png"
];
if (plan === "max") {
  availableLogos.push(
    "logo-bleu-blanc.png",
    "logo-bleu-noir.png",
    "logo-bleudégradé-blanc.png",
    "logo-bleudégradé-noir.png"
  );
}
console.log(availableLogos);
