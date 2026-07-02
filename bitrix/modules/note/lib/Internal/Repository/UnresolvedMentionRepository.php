<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository;

use Bitrix\Note\Internal\Model\ImportMapTable;
use Bitrix\Note\Internal\Model\UnresolvedMentionTable;

class UnresolvedMentionRepository
{
	public function add(int $documentId, string $sourceType, string $externalId): void
	{
		UnresolvedMentionTable::add([
			'DOCUMENT_ID' => $documentId,
			'SOURCE_TYPE' => $sourceType,
			'EXTERNAL_ID' => $externalId,
		]);
	}

	/**
	 * @param array<int, array{DOCUMENT_ID: int, SOURCE_TYPE: string, EXTERNAL_ID: string}> $rows
	 */
	public function addMulti(array $rows): void
	{
		if (empty($rows))
		{
			return;
		}

		UnresolvedMentionTable::addMulti($rows, true);
	}

	/**
	 * Finds unresolved mentions that now have a mapping in import_map.
	 * Returns rows where either DOCUMENT_ID or COLLECTION_ID is now set.
	 *
	 * @return array<array{
	 *     ID: int,
	 *     DOCUMENT_ID: int,
	 *     EXTERNAL_ID: string,
	 *     TARGET_DOCUMENT_ID: ?int,
	 *     TARGET_COLLECTION_ID: ?int,
	 * }>
	 */
	/**
	 * @param callable(string):?string $urlIdExtractor — optional source-specific function that
	 *     extracts a bare urlId from a raw markdown identifier (e.g. `slug-AbCd1234Ef` → `AbCd1234Ef`).
	 *     Used to match unresolved rows against import_map.URL_ID for slug-urlId forms whose raw
	 *     value won't appear in either column verbatim.
	 */
	public function findResolvable(string $sourceType, int $limit = 50, ?callable $urlIdExtractor = null): array
	{
		$query = UnresolvedMentionTable::query()
			->setSelect([
				'ID',
				'DOCUMENT_ID',
				'EXTERNAL_ID',
			])
			->where('SOURCE_TYPE', $sourceType)
			->setLimit($limit)
		;

		$unresolvedRows = $query->fetchAll();
		if (empty($unresolvedRows))
		{
			return [];
		}

		$externalIds = array_values(array_unique(array_column($unresolvedRows, 'EXTERNAL_ID')));

		$rawToUrlId = [];
		$urlIds = [];
		if ($urlIdExtractor !== null)
		{
			foreach ($externalIds as $rawId)
			{
				$urlId = $urlIdExtractor($rawId);
				if ($urlId !== null && $urlId !== '')
				{
					$rawToUrlId[$rawId] = $urlId;
					$urlIds[] = $urlId;
				}
			}
		}

		$lookupValues = array_values(array_unique(array_merge($externalIds, $urlIds)));

		// An unresolved EXTERNAL_ID may match map.EXTERNAL_ID (UUID) directly, map.URL_ID (Outline urlId)
		// directly, or its extracted urlId tail may match map.URL_ID.
		$mapRows = ImportMapTable::getList([
			'select' => ['EXTERNAL_ID', 'URL_ID', 'DOCUMENT_ID', 'COLLECTION_ID'],
			'filter' => [
				'=SOURCE_TYPE' => $sourceType,
				[
					'LOGIC' => 'OR',
					['@EXTERNAL_ID' => $lookupValues],
					['@URL_ID' => $lookupValues],
				],
			],
		])->fetchAll();

		$externalIdSet = array_flip($externalIds);
		$urlIdSet = array_flip($urlIds);
		$mapIndex = [];
		foreach ($mapRows as $row)
		{
			$docId = $row['DOCUMENT_ID'] !== null ? (int)$row['DOCUMENT_ID'] : null;
			$colId = $row['COLLECTION_ID'] !== null ? (int)$row['COLLECTION_ID'] : null;

			if ($docId === null && $colId === null)
			{
				continue;
			}

			$entry = [
				'documentId' => $docId,
				'collectionId' => $colId,
			];

			if (isset($externalIdSet[$row['EXTERNAL_ID']]))
			{
				$mapIndex[$row['EXTERNAL_ID']] = $entry;
			}
			if ($row['URL_ID'] !== null)
			{
				if (isset($externalIdSet[$row['URL_ID']]))
				{
					$mapIndex[$row['URL_ID']] = $entry;
				}
				if (isset($urlIdSet[$row['URL_ID']]))
				{
					$mapIndex[$row['URL_ID']] = $entry;
				}
			}
		}

		$result = [];
		foreach ($unresolvedRows as $row)
		{
			$rawId = $row['EXTERNAL_ID'];
			$mapping = $mapIndex[$rawId] ?? null;
			if ($mapping === null && isset($rawToUrlId[$rawId]))
			{
				$mapping = $mapIndex[$rawToUrlId[$rawId]] ?? null;
			}
			if ($mapping === null)
			{
				continue;
			}

			$result[] = [
				'ID' => (int)$row['ID'],
				'DOCUMENT_ID' => (int)$row['DOCUMENT_ID'],
				'EXTERNAL_ID' => $rawId,
				'TARGET_DOCUMENT_ID' => $mapping['documentId'],
				'TARGET_COLLECTION_ID' => $mapping['collectionId'],
			];
		}

		return $result;
	}

	public function deleteByIds(array $ids): void
	{
		if (empty($ids))
		{
			return;
		}

		UnresolvedMentionTable::deleteByFilter(['@ID' => array_values(array_unique(array_map('intval', $ids)))]);
	}

	public function deleteByDocumentId(int $documentId): void
	{
		UnresolvedMentionTable::deleteByFilter(['=DOCUMENT_ID' => $documentId]);
	}

	public function deleteByDocumentIds(array $documentIds): void
	{
		if (empty($documentIds))
		{
			return;
		}

		UnresolvedMentionTable::deleteByFilter([
			'@DOCUMENT_ID' => array_values(array_unique(array_map('intval', $documentIds))),
		]);
	}
}
