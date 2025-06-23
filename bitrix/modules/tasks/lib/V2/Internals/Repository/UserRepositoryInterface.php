<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Repository;
use Bitrix\Tasks\V2\Entity;

interface UserRepositoryInterface
{
	public function getByIds(array $userIds): Entity\UserCollection;
	public function getAdmins(): Entity\UserCollection;
}