<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Config\AddConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Config\DeleteConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;

interface TaskRepositoryInterface
{
	public function getById(int $id): ?Entity\Task;

	public function save(Entity\Task $entity): int;

	public function delete(int $id, bool $safe = true): void;

	public function isExists(int $id): bool;

	public function invalidate(int $taskId);
}
