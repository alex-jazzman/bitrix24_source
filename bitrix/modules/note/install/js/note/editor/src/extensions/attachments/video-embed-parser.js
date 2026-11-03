// @flow

// Pure helpers for the bare-video-URL block tokenizer. Kept free of `ui.video-service` so they can
// be unit-tested in isolation; the URL->embed-src resolution lives in video-embed.js, which owns the
// ui.video-service dependency - but the final say on which host may be framed is isAllowedEmbedSrc.

// Hosts of every embed URL ui.video-service can build: its per-service `*_EMBEDDED` replacement
// constants plus the host Facebook.getEmbeddedUrl() concatenates.
//
// The resolved src has to be re-checked against them because several of those matchers (Instagram,
// RuTube, VK) are not anchored to the start of the URL: `String.replace` then rewrites only the
// matched tail and keeps the caller's prefix, so `https://evil.example/x/https://vk.com/video1_2`
// resolves to an embed path under `evil.example`. The player is framed without `sandbox` and with
// `allow`, so that host must never reach the iframe.
const ALLOWED_EMBED_HOSTS: string[] = [
	'www.youtube-nocookie.com',
	'player.vimeo.com',
	'www.facebook.com',
	'instagram.com',
	'vk.com',
	'rutube.ru',
];

// A whole line that is nothing but an http(s)/scheme-relative URL (up to 3 leading spaces, like the
// other block tokenizers). `\S+` stops at the first whitespace, so trailing spaces before the line
// end are tolerated. The URL itself never contains spaces.
const BARE_URL_LINE: RegExp = /^[ \t]{0,3}((?:https?:)?\/\/\S+)[ \t]*(?:\n|$)/;

// Same shape, anchored to a line boundary, for the tokenizer's `start()` scan.
const BARE_URL_LINE_SCAN: RegExp = /(?:^|\n)[ \t]{0,3}((?:https?:)?\/\/\S+)[ \t]*(?=\n|$)/;

/**
 * Normalises a video URL before it is handed to ui.video-service.
 *
 * ui.video-service's VK matcher only covers `vk.com` / `vk.ru`, but VK's newer video domain
 * `vkvideo.ru` plays through the very same `vk.com/video_ext.php` embed, so rewrite the host.
 */
export function normalizeVideoUrl(url: string): string
{
	const trimmed = String(url).trim();

	return trimmed.replace(/^((?:https?:)?\/\/)(?:www\.)?vkvideo\.ru\//i, '$1vk.com/');
}

/**
 * Whether an embed src resolved by ui.video-service may be loaded into the player iframe.
 *
 * Only https URLs whose host is one a ui.video-service embed constant produces pass; anything else
 * (an attacker-controlled prefix that survived an unanchored matcher, a lookalike host, credentials
 * pointing the authority elsewhere, a non-https scheme) is rejected and stays an ordinary link.
 */
export function isAllowedEmbedSrc(src: mixed): boolean
{
	if (typeof src !== 'string' || src === '')
	{
		return false;
	}

	try
	{
		const parsed = new URL(src);

		return parsed.protocol === 'https:' && ALLOWED_EMBED_HOSTS.includes(parsed.hostname);
	}
	catch
	{
		return false;
	}
}

/**
 * Index of the first line in `src` that is a bare URL, or -1. Used as the marked block tokenizer's
 * `start()` hint; it is deliberately generic (any bare URL) - video-host filtering happens in the
 * tokenizer via ui.video-service, so a non-video URL surfaced here is simply rejected there.
 */
export function findBareUrlLineStart(src: string): number
{
	const match = BARE_URL_LINE_SCAN.exec(src);
	if (!match)
	{
		return -1;
	}

	// match.index points at the leading `\n` (or 0 at BOF); the URL starts after the newline and any
	// leading spaces. Locate the URL within the matched slice to return its exact offset.
	return match.index + match[0].indexOf(match[1]);
}

/**
 * Matches a bare URL occupying the whole first line of `src` (anchored at position 0).
 *
 * @return {{ url: string, raw: string } | null} raw includes the trailing newline it consumed.
 */
export function matchBareUrlLine(src: string): { url: string, raw: string } | null
{
	const match = BARE_URL_LINE.exec(src);
	if (!match)
	{
		return null;
	}

	return { url: match[1], raw: match[0] };
}
