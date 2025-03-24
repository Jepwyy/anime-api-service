import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import { AnimeDetailType, LatestAnimeType, EpisodeType } from 'types/types';

@Injectable()
export class AnimeService {
  private readonly logger = new Logger(AnimeService.name);
  private browser: Browser | null = null;

  constructor() {
    this.initializeBrowser().catch((error) => {
      this.logger.error('Failed to initialize browser in constructor:', error);
      process.exit(1);
    });
  }

  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({ headless: true });
      this.logger.log('Browser launched successfully.');
    } catch (error) {
      this.logger.error('Failed to launch browser:', error);
      throw new InternalServerErrorException('Failed to launch browser');
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.browser) {
      await this.initializeBrowser();
    }
    return this.browser!.newPage();
  }

  private async closePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch (error) {
      this.logger.error('Failed to close page:', error);
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.logger.log('Browser closed successfully.');
      } catch (error) {
        this.logger.error('Failed to close browser:', error);
      }
    }
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  async getLatestRelease(pageNumber: number): Promise<LatestAnimeType[]> {
    const page = await this.getPage();
    try {
      const targetPageUrl = `https://gogoanime.by/page/${pageNumber}/`;
      await page.goto(targetPageUrl, { waitUntil: 'networkidle2' });

      await page.waitForSelector('.listupd.normal', { timeout: 5000 });

      const animeList = await page.$$eval(
        '.listupd.normal article.bs',
        (animeItems) => {
          return animeItems.map((anime) => {
            const idElement = anime.querySelector('.tip')?.getAttribute('href');
            const titleElement = anime.querySelector('.tt')?.childNodes[0];
            const imageElement = anime.querySelector('.bsx img');
            const episodeElement = anime.querySelector('.epx');
            const timeElement = anime.querySelector('.timeago');
            const statusElement = anime.querySelector('.status');
            const typeElement = anime.querySelector('.typez');
            const subElement = anime.querySelector('.sb');

            return {
              episodeId:
                idElement
                  ?.replace('https://gogoanime.by/', '')
                  .replace(/\/$/, '') || '',
              title:
                titleElement?.textContent?.replace(/\s+/g, ' ').trim() || '',
              image: imageElement?.getAttribute('src') || '',
              episode: episodeElement?.textContent?.trim() || '',
              status: statusElement?.textContent?.trim() || 'Ongoing',
              type: typeElement?.textContent?.trim() || '',
              sub: subElement?.textContent?.trim() || '',
              releaseTime: timeElement?.textContent?.trim() || '',
            };
          });
        },
      );

      if (animeList.length === 0) {
        throw new NotFoundException(`No anime found on page ${pageNumber}`);
      }

      return animeList;
    } catch (error) {
      this.logger.error(
        `Failed to get latest releases for page ${pageNumber}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get latest releases for page ${pageNumber}`,
      );
    } finally {
      await this.closePage(page);
    }
  }

  async getAnimeDetails(id: string): Promise<AnimeDetailType> {
    const page = await this.getPage();
    try {
      const targetPageUrl = `https://gogoanime.by/series/${id}/`;
      await page.goto(targetPageUrl, { waitUntil: 'networkidle2' });

      await page.waitForSelector('.bigcontent.nobigcv', { timeout: 5000 });

      const animeDetails = await page.evaluate((animeId) => {
        const container = document.querySelector('.bigcontent.nobigcv');
        if (!container) {
          return null;
        }

        const title =
          container?.querySelector('.entry-title')?.textContent?.trim() || '';
        const description =
          container?.querySelector('.ninfo p')?.innerHTML.trim() || '';
        const image = '';
        const status =
          container
            ?.querySelector('.info-content span:nth-of-type(1)')
            ?.textContent?.replace('Status: ', '')
            .trim() || '';
        const studio =
          container
            ?.querySelector('.info-content span:nth-of-type(2) a')
            ?.textContent?.trim() || '';
        const released =
          container
            ?.querySelector('.info-content span:nth-of-type(3) ')
            ?.textContent?.replace('Released: ', '')
            .trim() || '';
        const duration =
          container
            ?.querySelector('.info-content span:nth-of-type(4)')
            ?.textContent?.replace('Duration: ', '')
            .trim() || '';
        const season =
          container
            ?.querySelector('.info-content span:nth-of-type(5)')
            ?.textContent?.replace('Season: ', '')
            .trim() || '';
        const type =
          container
            ?.querySelector('.info-content span:nth-of-type(6)')
            ?.textContent?.replace('Type: ', '')
            .trim() || '';
        const episodes =
          container
            ?.querySelector('.info-content span:nth-of-type(7)')
            ?.textContent?.replace('Episodes: ', '')
            .trim() || '';
        const genreElements = container?.querySelectorAll('.genxed a') || [];
        const genre =
          Array.from(genreElements)
            .map((el) => el.textContent?.trim())
            .join(', ') || '';

        return {
          id: animeId,
          title,
          description,
          image,
          status,
          studio,
          released,
          duration,
          season,
          type,
          episodes,
          genre,
        };
      }, id);

      if (!animeDetails) {
        throw new NotFoundException(`Anime with ID ${id} not found`);
      }

      return animeDetails;
    } catch (error) {
      this.logger.error(`Failed to get anime details for ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get anime details for ID ${id}`,
      );
    } finally {
      await this.closePage(page);
    }
  }

  async getAnimeEpisodes(id: string): Promise<EpisodeType[]> {
    const page = await this.getPage();
    try {
      const targetPageUrl = `https://gogoanime.by/series/${id}/`;
      await page.goto(targetPageUrl, { waitUntil: 'networkidle2' });

      await page.waitForSelector('.episodes-container', { timeout: 5000 });

      const episodes = await page.evaluate(() => {
        const episodeNodes = document.querySelectorAll('.episode-item a');
        return Array.from(episodeNodes).map((episode) => ({
          number: episode.textContent?.trim().replace('Episode ', '') || '',
          episodeId: (episode as HTMLAnchorElement).href
            ?.replace('https://gogoanime.by/', '')
            .replace(/\/$/, ''),
        }));
      });

      if (episodes.length === 0) {
        throw new NotFoundException(`No episodes found for anime ID ${id}`);
      }

      return episodes;
    } catch (error) {
      this.logger.error(`Failed to get anime episodes for ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get anime episodes for ID ${id}`,
      );
    } finally {
      await this.closePage(page);
    }
  }

  async getStreamEpisode(id: string): Promise<{ url: string | null }> {
    const page = await this.getPage();
    try {
      const targetPageUrl = `https://gogoanime.by/${id}/`;
      await page.goto(targetPageUrl, { waitUntil: 'networkidle2' });

      let videoURL: string | null = null;

      try {
        const response = await page.waitForResponse(
          (response) => {
            const url = response.url();
            return url.includes('googlevideo.com/videoplayback');
          },
          { timeout: 30000 },
        );

        videoURL = response.url();
      } catch (error) {
        this.logger.error(
          `Video URL not found within the timeout period for ID ${id}:`,
          error,
        );
      }

      if (!videoURL) {
        throw new NotFoundException(`Video URL not found for episode ID ${id}`);
      }

      return { url: videoURL };
    } catch (error) {
      this.logger.error(`Failed to get stream episode for ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get stream episode for ID ${id}`,
      );
    } finally {
      await this.closePage(page);
    }
  }

  async getSearchAnime(value: string): Promise<LatestAnimeType[]> {
    const page = await this.getPage();
    try {
      const targetPageUrl = `https://gogoanime.by/?s=${value}`;
      await page.goto(targetPageUrl, { waitUntil: 'networkidle2' });

      await page.waitForSelector('.listupd', { timeout: 5000 });

      const animeList = await page.$$eval(
        '.listupd article.bs',
        (animeItems) => {
          return animeItems.map((anime) => {
            const idElement = anime.querySelector('.tip')?.getAttribute('href');
            const titleElement = anime.querySelector('.tt')?.childNodes[0];
            const imageElement = anime.querySelector('.bsx img');
            const statusElement = anime.querySelector('.status');
            const typeElement = anime.querySelector('.typez');
            const subElement = anime.querySelector('.sb');

            return {
              episodeId:
                idElement
                  ?.replace('https://gogoanime.by/series/', '')
                  .replace(/\/$/, '') || '',
              title:
                titleElement?.textContent?.replace(/\s+/g, ' ').trim() || '',
              image: imageElement?.getAttribute('src') || '',
              status: statusElement?.textContent?.trim() || 'Ongoing',
              type: typeElement?.textContent?.trim() || '',
              sub: subElement?.textContent?.trim() || '',
            };
          });
        },
      );

      if (animeList.length === 0) {
        throw new NotFoundException(
          `No anime found for search term "${value}"`,
        );
      }

      return animeList;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to search for anime`);
    } finally {
      await this.closePage(page);
    }
  }
}
