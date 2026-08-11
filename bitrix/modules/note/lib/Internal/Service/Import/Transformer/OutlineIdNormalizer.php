<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

/**
 * Outline exposes two stable identifiers for documents and collections:
 *   - id    — full UUID, used in mention:// payloads and API calls
 *   - urlId — 10-character nanoid `[A-Za-z0-9_-]{10}`, used in web URLs `/doc/{slug}-{urlId}`
 *
 * Plain markdown links exported by Outline carry the URL form, so the raw identifier
 * captured from markdown can be a UUID, a bare urlId, or `slug-urlId`. This helper
 * extracts the 10-character urlId portion when present so it can be matched against
 * b_note_import_map.URL_ID.
 */
final class OutlineIdNormalizer
{
	private const URL_ID_LENGTH = 10;
	private const URL_ID_REGEX = '/^[A-Za-z0-9_\-]{10}$/';
	private const UUID_REGEX = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

	public static function isUuid(string $raw): bool
	{
		return preg_match(self::UUID_REGEX, $raw) === 1;
	}

	/**
	 * Returns the 10-character urlId tail when the raw identifier looks like a bare urlId
	 * or `slug-urlId`. Returns null for UUIDs and for strings without a valid 10-char tail.
	 */
	public static function extractUrlId(string $raw): ?string
	{
		if (self::isUuid($raw))
		{
			return null;
		}

		$length = strlen($raw);
		if ($length < self::URL_ID_LENGTH)
		{
			return null;
		}

		if ($length === self::URL_ID_LENGTH)
		{
			return preg_match(self::URL_ID_REGEX, $raw) === 1 ? $raw : null;
		}

		// length > 10 — slug-urlId form: urlId is the trailing 10 chars after the last dash.
		if ($raw[$length - self::URL_ID_LENGTH - 1] !== '-')
		{
			return null;
		}

		$tail = substr($raw, -self::URL_ID_LENGTH);

		return preg_match(self::URL_ID_REGEX, $tail) === 1 ? $tail : null;
	}
}
