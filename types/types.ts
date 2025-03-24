export interface LatestAnimeType {
  episodeId: string;
  title: string;
  image: string;
  episode?: string;
  status: string;
  type: string;
  sub: string;
  releaseTime?: string;
}
export interface AnimeDetailType {
  id: string;
  title: string;
  description: string;
  image: string;
  status: string;
  studio: string;
  released: string;
  duration: string;
  season: string;
  type: string;
  episodes: string;
  genre: string;
}
export type EpisodeType = {
  number: string;
  episodeId: string;
};
