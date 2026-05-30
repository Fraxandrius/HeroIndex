# HeroIndex v2 mock data

The files in this directory centralize temporary mock data used by the visual Home experience. They are intentionally local JavaScript fixtures only, except for Ads: `mockAds.js` now also acts as the fallback data source when Firebase Realtime Database is not configured, `/ads` is empty, or an Ads read fails.

## Temporary data

- `mockHeroes.js` provides temporary hero story rail entries, the Home feature hero, and trending hero rankings.
- `mockSocialPosts.js` provides temporary social feed posts for the Home timeline.
- `mockClips.js` provides temporary featured clip cards.
- `mockAds.js` provides fallback ad slot metadata and active creative content for `home-sponsor`, `sidebar-rail`, and `news-inline` while Ads reads from Firebase are optional.
- `mockNews.js` provides temporary editorial/news metadata that helps document where inline news-related placements will live later.

## Future Firebase fields

When Firebase is connected for each area, these fixtures should be replaced with documents whose fields map to the current UI needs:

- Hero documents: `id`, `name`, `ring` or status label, `tone` or avatar styling token, `score`, `move`, feature copy, sigil/avatar data, and display stats.
- Corporation documents at `/corporations/{corporationId}`: `name`, `tagline`, `description`, `sector`, `country`, `logoUrl`, `bannerUrl`, `approval`, `trustScore`, active state, and timestamps.
- News documents at `/news/{newsId}`: `title`, `source`, publish timestamps, summary/body copy, tags, metrics, trending score/movement, and optional inline placement references.
- Ad documents: `slotId`, `placement`, `label`, `aspectRatioLabel`, `recommendedSize`, `imageUrl`, `headline`, `brand`, `body`, `active`, campaign metadata, targeting rules, and creative assets.
- Social post documents: `id`, author profile fields, handle, timestamp, title/body text, tag, engagement metric, and optional inline placement references.
- Clip documents: `id`, `title`, duration, view count, thumbnail/preview asset, source URL, and related hero IDs.

## Firebase routes

The expected collection routes are:

- `/heroes`
- `/news`
- `/corporations`
- `/ads`
- `/socialPosts`

News now reads from `/news` with `mockNews.js` as fallback. Corporations now read from `/corporations` with `mockCorporations.js` as fallback. The other routes remain documented for future integration.
