<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source\Wiki;

/**
 * Canonical id-scheme for the wiki import source (DTO-02).
 *
 * Every identifier the source produces must go through this class so that the
 * three places that have to agree stay in sync:
 *   - WikiTreeBuilder       — builds the map key (ImportMap.EXTERNAL_ID);
 *   - WikiMarkupConverter   — embeds the same key into wiki-mention:// markers;
 *   - WikiMentionTransformer — resolves the marker back against ImportMap.
 *
 * Collection id forms:
 *   - company:{iblockId}            — standalone/company wiki (whole iblock)
 *   - group:{groupId}:{iblockId}    — group wiki (one root section inside the
 *                                     shared socnet iblock)
 *
 * Page external id:    {collectionId}#{NAME}      (see length handling below, Q-1)
 * Category node id:    {collectionId}~cat:{sectionId}
 */
final class WikiId
{
	/**
	 * Max length of a page external id. Kept below the narrowest storage column
	 * (b_note_unresolved_mention.EXTERNAL_ID is VARCHAR(128)); a margin is left
	 * for safety. Longer keys fall back to a hashed tail (Q-1 default).
	 */
	private const MAX_EXTERNAL_ID_LEN = 120;

	public static function companyCollectionId(int $iblockId): string
	{
		return 'company:' . $iblockId;
	}

	public static function groupCollectionId(int $groupId, int $iblockId): string
	{
		return 'group:' . $groupId . ':' . $iblockId;
	}

	/**
	 * Parses a collection id back into its parts.
	 *
	 * @return array{kind: string, iblockId: int, groupId: int|null}|null
	 */
	public static function parseCollectionId(string $collectionId): ?array
	{
		$parts = explode(':', $collectionId);

		if ($parts[0] === 'company' && isset($parts[1]) && self::isDigits($parts[1]))
		{
			return ['kind' => 'company', 'iblockId' => (int)$parts[1], 'groupId' => null];
		}

		if (
			$parts[0] === 'group'
			&& isset($parts[1], $parts[2])
			&& self::isDigits($parts[1])
			&& self::isDigits($parts[2])
		)
		{
			return ['kind' => 'group', 'iblockId' => (int)$parts[2], 'groupId' => (int)$parts[1]];
		}

		return null;
	}

	/**
	 * Builds the stable external id of a page (Q-1). The NAME part is hashed
	 * when the raw key would not fit the storage column. The hash is over NAME
	 * only, so the same page always yields the same id regardless of context.
	 */
	public static function pageExternalId(string $collectionId, string $name): string
	{
		$key = $collectionId . '#' . $name;

		if (mb_strlen($key) > self::MAX_EXTERNAL_ID_LEN)
		{
			return $collectionId . '#h:' . sha1($name);
		}

		return $key;
	}

	public static function categoryNodeId(string $collectionId, int $sectionId): string
	{
		return $collectionId . '~cat:' . $sectionId;
	}

	/**
	 * Builds the inline wiki-mention marker embedded into raw markdown by the
	 * converter. The external id is percent-encoded so the marker never carries
	 * spaces, parens or other characters that would break the link syntax or the
	 * transformer regex; WikiMentionTransformer decodes it back before lookup.
	 */
	public static function mentionMarker(string $externalId): string
	{
		return 'wiki-mention://' . rawurlencode($externalId);
	}

	public static function assetMarker(int $fileId): string
	{
		return 'wiki-asset://' . $fileId;
	}

	/**
	 * True when the string is a non-empty sequence of decimal digits.
	 * String-input behavior matches the digit check of the optional ctype extension.
	 */
	private static function isDigits(string $value): bool
	{
		return preg_match('/^[0-9]+$/D', $value) === 1;
	}
}
