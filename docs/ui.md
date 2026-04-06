# Interface Utilisateur (UI)

L'application offre une interface moderne et réactive.

## Technologies

- **Tailwind CSS** : Utilisé pour le styling utilitaire.
- **shadcn/ui & Radix UI** : Les composants d'interface de base (`Button`, `Dialog`, `DropdownMenu`) se trouvent dans `components/ui/` et sont basés sur Radix UI pour l'accessibilité.
- **Lucide React** : Fournit le système d'icônes.

## Layout Principal

L'architecture UI repose sur un modèle à **double barre latérale (Dual-Sidebar)**, géré dans `app/(chat)/layout.tsx` :
1. Une barre de navigation principale à gauche (`AppSidebar`).
2. Une barre de paramètres à droite (`SettingsSidebarProvider`), permettant un accès rapide aux configurations de l'agent ou du chat.

L'application supporte un thème clair/sombre via `next-themes`.
