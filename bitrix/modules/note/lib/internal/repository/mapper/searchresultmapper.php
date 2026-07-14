<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository\Mapper;

use Bitrix\Note\Internal\Entity\Search\SearchResult;

final class SearchResultMapper
{
	public static function convertFromOrm(array $row, string $snippet = '', bool $sharedAccess = false): SearchResult
	{
		return new SearchResult(
			(int)($row['DOCUMENT_ID'] ?? 0),
			(int)($row['DOC_COLLECTION_ID'] ?? 0),
			(string)($row['DOC_TITLE'] ?? ''),
			(float)($row['SCORE'] ?? 0.0),
			$snippet,
			$sharedAccess,
		);
	}
}
