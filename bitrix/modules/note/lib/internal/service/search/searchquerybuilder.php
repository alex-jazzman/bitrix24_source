<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Search;

use Bitrix\Main\ORM\Query\Filter\Helper;
use Bitrix\Note\Public\Provider\Param\Search\SearchLimits;

final class SearchQueryBuilder
{
	public const MAX_QUERY_LENGTH = SearchLimits::MAX_QUERY_LENGTH;
	public const MIN_TOKEN_LENGTH = SearchLimits::MIN_TOKEN_LENGTH;

	/**
	 * Prepares raw user input for MATCH(...) AGAINST (... IN BOOLEAN MODE).
	 * Returns empty string when no tokens pass ft_min_token_size (default 3).
	 */
	public function prepareBooleanQuery(string $raw): string
	{
		$trimmed = trim($raw);
		if ($trimmed === '')
		{
			return '';
		}

		$truncated = mb_substr($trimmed, 0, self::MAX_QUERY_LENGTH);

		return Helper::matchAgainstWildcard($truncated, '*');
	}

	/**
	 * Extracts lowercase tokens from the raw query — the same set that ends up inside
	 * `+token*` expressions of the boolean query. Used by the snippet extractor to
	 * highlight matches in the BODY.
	 *
	 * @return string[]
	 */
	public function extractTokens(string $raw): array
	{
		$trimmed = trim($raw);
		if ($trimmed === '')
		{
			return [];
		}

		$truncated = mb_substr($trimmed, 0, self::MAX_QUERY_LENGTH);
		$parts = Helper::splitWords($truncated);

		$tokens = [];
		foreach ($parts as $part)
		{
			if (mb_strlen($part) < self::MIN_TOKEN_LENGTH)
			{
				continue;
			}
			$tokens[] = mb_strtolower($part);
		}

		return array_values(array_unique($tokens));
	}
}
