<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;

interface StageRepositoryInterface
{
	public function getByGroupId(int $groupId): ?Entity\StageCollection;

	public function getById(int $id): ?Entity\Stage;
}