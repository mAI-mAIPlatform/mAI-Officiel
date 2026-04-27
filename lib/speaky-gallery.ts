export type SpeakyGalleryCategory =
  | "narration"
  | "education"
  | "entertainment"
  | "music"
  | "professional";

export type PublicSpeakyCreation = {
  id: string;
  title: string;
  description: string;
  category: SpeakyGalleryCategory;
  tag?: string;
  language: string;
  voice: string;
  creatorName: string;
  createdAt: string;
  durationSec: number;
  listens: number;
  favorites: number;
  audioUrl: string;
};

export const SPEAKY_PUBLIC_GALLERY_STORAGE_KEY = "mai.speaky.public-gallery.v1";
export const SPEAKY_FAVORITES_STORAGE_KEY = "mai.speaky.gallery-favorites.v1";
