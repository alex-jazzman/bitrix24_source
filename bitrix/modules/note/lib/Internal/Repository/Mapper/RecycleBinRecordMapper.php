<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository\Mapper;

use Bitrix\Main\Type\DateTime;
use Bitrix\Note\Internal\Entity\RecycleBin\RecycleBinRecord;

final class RecycleBinRecordMapper
{
	public static function convertFromOrm(array $row): RecycleBinRecord
	{
		$trashedAt = $row['TRASHED_AT'] ?? null;
		if (!($trashedAt instanceof DateTime))
		{
			$trashedAt = $trashedAt ? DateTime::createFromUserTime((string)$trashedAt) : new DateTime();
		}

		return new RecycleBinRecord(
			id: isset($row['ID']) ? (int)$row['ID'] : null,
			documentId: (int)($row['DOCUMENT_ID'] ?? 0),
			trashedAt: $trashedAt,
			trashedBy: (int)($row['TRASHED_BY'] ?? 0),
			origin: (string)($row['ORIGIN'] ?? ''),
		);
	}

	/**
	 * @return array{DOCUMENT_ID: int, TRASHED_AT: DateTime, TRASHED_BY: int, ORIGIN: string}
	 */
	public static function convertToOrm(RecycleBinRecord $record): array
	{
		return [
			'DOCUMENT_ID' => $record->getDocumentId(),
			'TRASHED_AT' => $record->getTrashedAt(),
			'TRASHED_BY' => $record->getTrashedBy(),
			'ORIGIN' => $record->getOrigin(),
		];
	}
}
