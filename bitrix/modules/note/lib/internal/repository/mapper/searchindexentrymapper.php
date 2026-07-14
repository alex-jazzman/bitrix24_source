<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository\Mapper;

use Bitrix\Note\Internal\Entity\Search\SearchIndexEntry;

final class SearchIndexEntryMapper
{
	public static function convertFromOrm(array $row): SearchIndexEntry
	{
		return new SearchIndexEntry(
			(int)($row['DOCUMENT_ID'] ?? 0),
			(string)($row['BODY'] ?? ''),
		);
	}

	/**
	 * @return array{DOCUMENT_ID: int, BODY: string}
	 */
	public static function convertToOrm(SearchIndexEntry $entity): array
	{
		return [
			'DOCUMENT_ID' => $entity->getDocumentId(),
			'BODY' => $entity->getBody(),
		];
	}
}
