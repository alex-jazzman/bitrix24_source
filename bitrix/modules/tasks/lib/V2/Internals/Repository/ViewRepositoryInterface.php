<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity\Task\View;

interface ViewRepositoryInterface
{
	public function get(int $taskId, int $userId): ?View;

	public function upsert(View $view): void;
}