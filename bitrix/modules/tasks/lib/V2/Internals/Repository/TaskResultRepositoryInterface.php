<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;

interface TaskResultRepositoryInterface
{
	public function isResultRequired(int $taskId): bool;

	public function getById(int $resultId): Entity\Result|null;

	public function getByTask(int $taskId): Entity\ResultCollection;

	public function save(Entity\Result $entity, int $userId): int;

	public function delete(int $id, int $userId): void;
}
