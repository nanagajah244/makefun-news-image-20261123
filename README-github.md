[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/nanagajah244/makefun-news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/nanagajah244/makefun-news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123)

# Monday 23 November 2026 — World News in One Image

A deterministic 1024×1024 front page summing up Monday 23 November 2026's
world news, written for make.fun's "Sum up 23 November's world news in one
image" bounty.

`main.ts` (Node 22, pure standard library: `fs`, `path`, `zlib`) draws the
front page with a hand-written 5×7 bitmap font and a hand-written PNG
encoder: masthead "MONDAY 23 NOVEMBER 2026", a lead story (COP31 ends with
no climate deal in Antalya), 18 verified story tiles, a 6-item UTC timeline,
and a "world in numbers" footer. Every story was verified against live
sources (AP, Reuters, Xinhua, Dow Jones, ESA, Al Jazeera, BBC) after the
day had ended everywhere.

The program reads no clock, environment or randomness and makes no network
calls, so two runs produce byte-identical images.
