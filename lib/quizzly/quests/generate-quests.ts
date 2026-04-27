import * as fs from "fs";
import * as path from "path";

const subjects = [
  "Mathématiques",
  "Français",
  "Histoire",
  "Géographie",
  "Sciences",
  "Anglais",
  "Culture Générale",
  "Technologie"
];

function generateQuests(count: number, type: "daily" | "weekly") {
  const quests = [];
  for (let i = 1; i <= count; i++) {
    const isWin = Math.random() > 0.5;
    const target = type === "daily" ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 40) + 10;
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const rewardDiamonds = type === "daily" ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 50) + 50;

    let title, description;

    const questTypes = ["play", "correct", "perfect"];
    const qType = questTypes[Math.floor(Math.random() * questTypes.length)];

    if (qType === "play") {
      title = `Jouer des quiz de ${subject}`;
      description = `Termine ${target} quiz dans la matière : ${subject}.`;
    } else if (qType === "correct") {
      title = `Bonnes réponses en ${subject}`;
      description = `Obtiens ${target} bonnes réponses dans la matière : ${subject}.`;
    } else {
      title = `Quiz parfaits`;
      description = `Termine ${type === "daily" ? 1 : 5} quiz sans faire d'erreur.`;
    }

    quests.push({
      id: `${type}-${i}`,
      title,
      description,
      target,
      rewardDiamonds,
      type: qType,
      subject: qType === "perfect" ? "any" : subject,
    });
  }
  return quests;
}

const dailyQuests = generateQuests(200, "daily");
const weeklyQuests = generateQuests(200, "weekly");

fs.writeFileSync(path.join(__dirname, "daily-quests.json"), JSON.stringify(dailyQuests, null, 2));
fs.writeFileSync(path.join(__dirname, "weekly-quests.json"), JSON.stringify(weeklyQuests, null, 2));

console.log("Generated 200 daily and 200 weekly quests!");
