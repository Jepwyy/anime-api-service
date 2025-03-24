import { Module } from '@nestjs/common';
import { AnimeModule } from './anime/anime.module';
import { MangaModule } from './manga/manga.module';

@Module({
  imports: [AnimeModule, MangaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
