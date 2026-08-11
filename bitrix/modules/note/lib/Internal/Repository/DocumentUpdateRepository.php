<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository;

use Bitrix\Main\Application;
use Bitrix\Main\Error;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Model\DocumentUpdateTable;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class DocumentUpdateRepository
{
	public const ERROR_DOCUMENT_NOT_EDITABLE = 'NOTE_DOCUMENT_NOT_EDITABLE';

	private ?RecycleBinFilter $recycleBinFilter = null;

	private function recycleBinFilter(): RecycleBinFilter
	{
		return $this->recycleBinFilter ??= new RecycleBinFilter();
	}

	public function getByDocumentId(int $documentId): array
	{
		return DocumentUpdateTable::getList([
			'select' => ['ID', 'PATCH', 'USER_ID'],
			'filter' => ['=DOCUMENT_ID' => $documentId],
			'order' => ['ID' => 'ASC'],
		])->fetchAll();
	}

	/**
	 * Guard: the row is inserted only if the document exists, is not archived and is not in trash.
	 * Check-then-insert is not atomic; the tiny race window can only leave an orphan patch row,
	 * which compact/hard-delete cleanup removes anyway.
	 */
	public function add(int $documentId, int $userId, string $patch): Result
	{
		$result = new Result();

		$query = DocumentTable::query()
			->setSelect(['ID'])
			->where('ID', $documentId)
			->where('IS_ARCHIVED', 'N');
		$this->recycleBinFilter()->applyExclusion($query);

		if ($query->fetch() === false)
		{
			$result->addError(new Error('Document is not editable', self::ERROR_DOCUMENT_NOT_EDITABLE));

			return $result;
		}

		$addResult = DocumentUpdateTable::add([
			'DOCUMENT_ID' => $documentId,
			'USER_ID' => $userId,
			'PATCH' => $patch,
		]);

		if (!$addResult->isSuccess())
		{
			$result->addErrors($addResult->getErrors());

			return $result;
		}

		$result->setData(['id' => (int)$addResult->getId()]);

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
