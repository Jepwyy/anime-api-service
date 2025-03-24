import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnimeService } from './anime.service';

@Controller('anime')
export class AnimeController {
  constructor(private readonly animeService: AnimeService) {}

  @Get('latest')
  async getLatestAnime(@Query('page') page: number = 1) {
    return await this.animeService.getLatestRelease(Number(page));
  }

  @Get('details/:id')
  async getAnimeDetails(@Param('id') id: string) {
    return await this.animeService.getAnimeDetails(id);
  }

  @Get('episodes/:id')
  async getAnimeEpisodes(@Param('id') id: string) {
    return await this.animeService.getAnimeEpisodes(id);
  }

  @Get('stream/:episodeId')
  async getStreamEpisode(@Param('episodeId') id: string) {
    return await this.animeService.getStreamEpisode(id);
  }

  @Get('search')
  async getSearchAnime(@Query('value') value: string) {
    return await this.animeService.getSearchAnime(value);
  }
}
