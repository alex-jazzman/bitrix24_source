<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository;

use Bitrix\Main\Application;
use Bitrix\Main\Error;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\DocumentUpdateTable;

class DocumentUpdateRepository
{
	public const ERROR_DOCUMENT_NOT_EDITABLE = 'NOTE_DOCUMENT_NOT_EDITABLE';

	public function getByDocumentId(int $documentId): array
	{
		return DocumentUpdateTable::getList([
			'select' => ['ID', 'PATCH', 'USER_ID'],
			'filter' => ['=DOCUMENT_ID' => $documentId],
			'order' => ['ID' => 'ASC'],
		])->fetchAll();
	}

	/**
	 * Atomic guard: the row is inserted only if the document exists, is not archived and is not in trash.
	 * On affected_rows=0 the Result carries ERROR_DOCUMENT_NOT_EDITABLE; the caller distinguishes the
	 * concrete reason (RecycleBinFilter::isInRecycleBin → DocumentInRecycleBinException, otherwise DocumentArchivedException).
	 */
	public function add(int $documentId, int $userId, string $patch): Result
	{
		$result = new Result();

		$connection = Application::getConnection();
		$helper = $connection->getSqlHelper();

		$documentIdSafe = (int)$documentId;
		$userIdSafe = (int)$userId;
		$patchSafe = $helper->forSql($patch);

		// FROM DUAL is MySQL-only; a bare SELECT with WHERE works on both MySQL and PG.
		$sql = "INSERT INTO b_note_document_updates (DOCUMENT_ID, USER_ID, PATCH, CREATED_AT)"
			. " SELECT {$documentIdSafe}, {$userIdSafe}, '{$patchSafe}', NOW()"
			. " WHERE EXISTS (SELECT 1 FROM b_note_document WHERE ID = {$documentIdSafe} AND IS_ARCHIVED = 'N')"
			. "   AND NOT EXISTS (SELECT 1 FROM b_note_recycle_bin WHERE DOCUMENT_ID = {$documentIdSafe})";

		$connection->queryExecute($sql);
		$affected = $connection->getAffectedRowsCount();

		if ($affected === 0)
		{
			$result->addError(new Error('Document is not editable', self::ERROR_DOCUMENT_NOT_EDITABLE));

			return $result;
		}

		$lastId = (int)$connection->getInsertedId();
		$result->setData(['id' => $lastId]);

		return $result;
	}

	public function deleteUpToId(int $documentId, int $maxId): Result
	{
		$result = new Result();

		DocumentUpdateTable::deleteByFilter([
			'=DOCUMENT_ID' => $documentId,
			'<=ID' => $maxId,
		]);

		return $result;
	}

	public function hasAnyByDocumentId(int $documentId): bool
	{
		if ($documentId <= 0)
		{
			return false;
		}

		$row = DocumentUpdateTable::getList([
			'select' => ['ID'],
			'filter' => ['=DOCUMENT_ID' => $documentId],
			'limit' => 1,
		])->fetch();

		return $row !== false;
	}

	public function deleteByDocumentId(int $documentId): void
	{
		$this->deleteByDocumentIds([$documentId]);
	}

	/**
	 * @param int[] $documentIds
	 */
	public function deleteByDocumentIds(array $documentIds): void
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $documentIds),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalized))
		{
			return;
		}

		$connection = Application::getConnection();
		$placeholders = implode(',', $normalized);
		$connection->queryExecute("DELETE FROM b_note_document_updates WHERE DOCUMENT_ID IN ({$placeholders})");
	}

	public function getLastId(int $documentId): ?int
	{
		$row = DocumentUpdateTable::getList([
			'select' => ['MAX_ID'],
			'filter' => ['=DOCUMENT_ID' => $documentId],
			'runtime' => [
				new ExpressionField('MAX_ID', 'MAX(%s)', ['ID']),
			],
		])->fetch();

		if ($row === false || $row['MAX_ID'] === null)
		{
			return null;
		}

		return (int)$row['MAX_ID'];
	}
}
