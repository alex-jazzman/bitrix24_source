<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\CollectionRepository;

final class ReorderCollectionsCommand extends AbstractCommand
{
	private readonly array $ids;
	private readonly int $userId;
	private readonly CollectionRepository $repository;

	public function __construct(array $ids, int $userId, ?CollectionRepository $repository = null)
	{
		$this->ids = $ids;
		$this->userId = $userId;
		$this->repository = $repository ?? new CollectionRepository();
	}

	protected function execute(): Result
	{
		$this->repository->reorderByIds($this->ids, $this->userId);

		return $this->createResult();
	}

	private function createResult(array $data = []): Result
	{
		$result = new Result();
		if (!empty($data))
		{
			$result->setData($data);
		}

		return $result;
	}
}
