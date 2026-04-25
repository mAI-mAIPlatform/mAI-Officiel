import type { AppLanguage } from "./i18n";

const suggestionPoolByLanguage: Record<AppLanguage, string[]> = {
  de: [
    "Erstelle einen Projektplan für den Start einer neuen KI-Funktion.",
    "Erstelle eine priorisierte Wochenübersicht der Aufgaben.",
    "Hilf mir, eine Wissensdatenbank für mein Team zu strukturieren.",
    "Schlage 5 Content-Ideen vor, um mein Produkt zu präsentieren.",
  ],
  it: [
    "Redigi un piano di progetto per lanciare una nuova funzionalità IA.",
    "Crea un riepilogo settimanale delle azioni con priorità.",
    "Aiutami a strutturare una base di conoscenza per il mio team.",
    "Proponi 5 idee di contenuto per presentare il mio prodotto.",
  ],
  pt: [
    "Escreva um plano de projeto para lançar um novo recurso de IA.",
    "Crie um resumo semanal de ações com prioridades.",
    "Ajude-me a estruturar uma base de conhecimento para minha equipe.",
    "Sugira 5 ideias de conteúdo para apresentar meu produto.",
  ],
  zh: [
    "为新 AI 功能制定项目启动计划。",
    "整理本周任务并按优先级排序。",
    "帮助我搭建团队知识库结构。",
    "给我 5 个展示产品的内容创意。",
  ],
  fr: [
    "Rédige un plan projet pour lancer une nouvelle fonctionnalité IA.",
    "Crée un résumé des actions à faire cette semaine avec priorités.",
    "Aide-moi à structurer une base de connaissances pour mon équipe.",
    "Propose 5 idées de contenu pour présenter mon produit en français.",
    "Prépare un email client pour annoncer une évolution produit.",
    "Construis une checklist d'onboarding pour un nouveau collaborateur.",
    "Transforme ces notes en plan d'exécution sur 30 jours.",
    "Fais un audit rapide UX de ma landing page.",
    "Génère un script de réunion hebdo avec points d'action.",
    "Propose des KPI simples pour suivre mon projet.",
    "Résume ce texte en version executive puis version opérationnelle.",
    "Aide-moi à écrire une FAQ produit claire en français.",
    "Crée une to-do list priorisée à partir de mon objectif principal.",
    "Donne 10 idées de posts LinkedIn pour mon activité.",
    "Prépare un plan de tests pour valider une nouvelle feature.",
    "Rédige un brief créatif pour une campagne marketing.",
    "Crée un tableau de risques projet avec mitigation.",
    "Écris un template de compte-rendu de réunion actionnable.",
    "Propose un workflow no-code pour automatiser mes tâches répétitives.",
    "Aide-moi à clarifier la proposition de valeur de mon produit.",
    "Traduis ce message en allemand avec un ton professionnel et chaleureux.",
    "Prépare une routine quotidienne d'étude de 45 minutes pour progresser vite.",
    "Crée un plan anti-procrastination sur 7 jours avec objectifs mesurables.",
    "Donne 8 accroches publicitaires A/B testables pour mon offre.",
  ],
  en: [
    "Draft a project plan to launch a new AI feature.",
    "Create a weekly action summary with priorities.",
    "Help me structure a knowledge base for my team.",
    "Suggest 5 content ideas to present my product.",
    "Write a client email announcing a product update.",
    "Build an onboarding checklist for a new teammate.",
    "Turn these notes into a 30-day execution plan.",
    "Do a quick UX audit of my landing page.",
    "Generate a weekly meeting script with action items.",
    "Suggest simple KPIs to track my project.",
    "Summarize this text into executive and operational versions.",
    "Help me write a clear product FAQ.",
    "Create a prioritized to-do list from my main goal.",
    "Give me 10 LinkedIn post ideas for my business.",
    "Prepare a test plan to validate a new feature.",
    "Write a creative brief for a marketing campaign.",
    "Create a project risk table with mitigations.",
    "Write an actionable meeting notes template.",
    "Suggest a no-code workflow to automate repetitive tasks.",
    "Help me clarify my product's value proposition.",
    "Translate this message into German with a professional tone.",
    "Prepare a 45-minute daily study routine.",
    "Create a 7-day anti-procrastination plan with measurable goals.",
    "Give me 8 ad hooks for A/B testing.",
  ],
  es: [
    "Redacta un plan de proyecto para lanzar una nueva función de IA.",
    "Crea un resumen semanal de acciones con prioridades.",
    "Ayúdame a estructurar una base de conocimiento para mi equipo.",
    "Propón 5 ideas de contenido para presentar mi producto.",
    "Prepara un correo para anunciar una evolución del producto.",
    "Crea una checklist de onboarding para un nuevo colaborador.",
    "Convierte estas notas en un plan de ejecución de 30 días.",
    "Haz una auditoría UX rápida de mi landing page.",
    "Genera un guion de reunión semanal con acciones concretas.",
    "Propón KPI simples para seguir mi proyecto.",
    "Resume este texto en versión ejecutiva y operativa.",
    "Ayúdame a escribir una FAQ de producto clara.",
    "Crea una lista de tareas priorizada desde mi objetivo principal.",
    "Dame 10 ideas de posts de LinkedIn para mi actividad.",
    "Prepara un plan de pruebas para validar una nueva feature.",
    "Redacta un brief creativo para una campaña de marketing.",
    "Crea una tabla de riesgos del proyecto con mitigaciones.",
    "Escribe una plantilla accionable de acta de reunión.",
    "Propón un workflow no-code para automatizar tareas repetitivas.",
    "Ayúdame a clarificar la propuesta de valor de mi producto.",
    "Traduce este mensaje al alemán con tono profesional.",
    "Prepara una rutina diaria de estudio de 45 minutos.",
    "Crea un plan anti-procrastinación de 7 días con objetivos medibles.",
    "Dame 8 ganchos publicitarios para pruebas A/B.",
  ],
};

export function getDefaultSuggestions(
  count = 4,
  language: AppLanguage = "fr"
): string[] {
  const pool = suggestionPoolByLanguage[language] ?? suggestionPoolByLanguage.fr;
  return pool.slice(0, Math.min(count, pool.length));
}

export function pickRandomSuggestions(
  count = 4,
  language: AppLanguage = "fr"
): string[] {
  const copy = [...(suggestionPoolByLanguage[language] ?? suggestionPoolByLanguage.fr)];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as string, copy[i] as string];
  }

  return copy.slice(0, Math.min(count, copy.length));
}
