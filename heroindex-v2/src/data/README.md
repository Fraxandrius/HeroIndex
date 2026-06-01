# HeroIndex v2 mock data

The files in this directory centralize temporary mock data used by the visual Home experience. News fixtures now act as the fallback for the Firebase `/news` feed; the remaining fixtures are local JavaScript data only.

## Temporary data

- `mockHeroes.js` provides temporary hero story rail entries, the Home feature hero, and trending hero rankings.
- `mockSocialPosts.js` provides temporary social feed posts for the Home timeline.
- `mockClips.js` provides temporary featured clip cards.
- `mockAds.js` provides temporary mock ad slot metadata and active creative content for `home-sponsor`, `sidebar-rail`, and `news-inline`.
- `mockNews.js` provides the fallback editorial/news feed used when Firebase `/news` is unavailable or empty.

## Firebase fields

Firebase documents should map to the current UI needs:

- Hero documents: `id`, `name`, `ring` or status label, `tone` or avatar styling token, `score`, `move`, feature copy, sigil/avatar data, and display stats.
- News documents at `/news/{newsId}`: `title`, `source`, publish timestamps, summary/body copy, tags, metrics, trending score/movement, and optional inline placement references.
- Ad documents: `slotId`, `placement`, `label`, `aspectRatioLabel`, `recommendedSize`, `imageUrl`, `headline`, `brand`, `body`, `active`, campaign metadata, targeting rules, and creative assets.
- Social post documents: `id`, author profile fields, handle, timestamp, title/body text, tag, engagement metric, and optional inline placement references.
- Clip documents: `id`, `title`, duration, view count, thumbnail/preview asset, source URL, and related hero IDs.

## Firebase routes

The expected collection routes are:

- `/heroes`
- `/news`
- `/ads`
- `/socialPosts`

News now reads from `/news` with `mockNews.js` as fallback. The other routes remain documented for future integration.
