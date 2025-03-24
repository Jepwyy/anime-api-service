# Anime Service API

This API provides information about anime, manga and manwha.

## Anime Endpoints

- `/anime/latest`: Get the latest anime releases (supports pagination with `page` query parameter).
- `/anime/details/:id`: Get details for a specific anime (replace `:id` with the anime ID).
- `/anime/episodes/:id`: Get episodes for a specific anime (replace `:id` with the anime ID).
- `/anime/stream/:episodeId`: Get the stream URL for a specific episode (replace `:episodeId` with the episode ID).
- `/anime/search`: Search for anime (use the `value` query parameter for the search term).

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
