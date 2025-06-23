<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Provider;

use Bitrix\Tasks\V2\Entity\Result;
use Bitrix\Tasks\V2\Entity\ResultCollection;
use Bitrix\Tasks\V2\Internals\Repository\TaskResultRepositoryInterface;

class TaskResultProvider
{
	private TaskResultRepositoryInterface $repository;

	public function __construct(TaskResultRepositoryInterface $repository)
	{
		$this->repository = $repository;
	}

	public function getResultById(int $resultId): ?Result
	{
		return $this->repository->getById($resultId);
	}

	public function getTaskResults(int $taskId): ResultCollection
	{
		return $this->repository->getByTask($taskId);
	}
}
