<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;

use Bitrix\Tasks\V2\Entity;

interface GroupRepositoryInterface
{
	public function getById(int $id): ?Entity\Group;
	public function getMembers(int $id): Entity\UserCollection;
	public function getType(int $id): ?string;
}