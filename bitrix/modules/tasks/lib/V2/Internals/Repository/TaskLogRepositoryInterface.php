<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;

interface TaskLogRepositoryInterface
{
	public function add(Entity\HistoryLog $historyLog): int;

	public function tail(int $taskId, int $offset = 0): Entity\HistoryLogCollection;
}
