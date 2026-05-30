# HeroIndex v2 mock data

The files in this directory centralize temporary mock data used by the visual Home experience. They are intentionally local JavaScript fixtures only: they do not connect to Firebase, load remote feeds, or represent production content.

## Temporary data

- `mockHeroes.js` provides temporary hero story rail entries, the Home feature hero, and trending hero rankings.
- `mockSocialPosts.js` provides temporary social feed posts for the Home timeline.
- `mockClips.js` provides temporary featured clip cards.
- `mockAds.js` provides temporary mock ad slot metadata and active creative content for `home-sponsor`, `sidebar-rail`, and `news-inline`.
- `mockNews.js` provides temporary editorial/news metadata that helps document where inline news-related placements will live later.

## Future Firebase fields

When Firebase is connected, these fixtures should be replaced with documents whose fields map to the current UI needs:

- Hero documents: `id`, `name`, `ring` or status label, `tone` or avatar styling token, `score`, `move`, feature copy, sigil/avatar data, and display stats.
- News documents: `id`, `title`, `source`, publish timestamps, summary/body copy, tags, and any related ad slot references.
- Ad documents: `slotId`, `placement`, `label`, `aspectRatioLabel`, `recommendedSize`, `imageUrl`, `headline`, `brand`, `body`, `active`, campaign metadata, targeting rules, and creative assets.
- Social post documents: `id`, author profile fields, handle, timestamp, title/body text, tag, engagement metric, and optional inline placement references.
- Clip documents: `id`, `title`, duration, view count, thumbnail/preview asset, source URL, and related hero IDs.

## Future Firebase routes

The expected collection routes are:

- `/heroes`
- `/news`
- `/ads`
- `/socialPosts`

These routes are only documented for future integration. The current Home screen must continue using local mock data until the Firebase phase begins.
