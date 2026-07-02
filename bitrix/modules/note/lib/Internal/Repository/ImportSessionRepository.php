<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository;

use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\ImportSessionTable;

class ImportSessionRepository
{
	public function save(int $userId, string $status = 'connecting'): Result
	{
		$result = new Result();

		$ormResult = ImportSessionTable::add([
			'CREATED_BY' => $userId,
			'STATUS' => $status,
		]);

		if (!$ormResult->isSuccess())
		{
			$result->addErrors($ormResult->getErrors());

			return $result;
		}

		$result->setData(['id' => (int)$ormResult->getId()]);

		return $result;
	}

	public function getById(int $id): ?array
	{
		return ImportSessionTable::getByPrimary($id)->fetch() ?: null;
	}

	public function getByUser(int $userId): ?array
	{
		return ImportSessionTable::getList([
			'filter' => ['=CREATED_BY' => $userId],
			'order' => ['ID' => 'DESC'],
			'limit' => 1,
		])->fetch() ?: null;
	}

	/**
	 * @return int[]
	 */
	public function listIdsByStatus(string $status): array
	{
		$rows = ImportSessionTable::getList([
			'select' => ['ID'],
			'filter' => ['=STATUS' => $status],
			'order' => ['ID' => 'ASC'],
		])->fetchAll();

		return array_map(static fn(array $row): int => (int)$row['ID'], $rows);
	}

	public function updateStatus(int $id, string $status): void
	{
		ImportSessionTable::update($id, ['STATUS' => $status]);
	}

	public function delete(int $id): void
	{
		ImportSessionTable::delete($id);
	}
}
