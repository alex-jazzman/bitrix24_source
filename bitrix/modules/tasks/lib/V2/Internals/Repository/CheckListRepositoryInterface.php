<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;
use Bitrix\Tasks\V2\Entity;

interface CheckListRepositoryInterface
{
	public function getByEntity(int $entityId, int $userId, Entity\CheckList\Type $type): Entity\CheckList;
}