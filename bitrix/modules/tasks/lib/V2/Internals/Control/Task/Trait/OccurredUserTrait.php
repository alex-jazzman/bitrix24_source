<?php

namespace Bitrix\Tasks\V2\Internals\Control\Task\Trait;

use Bitrix\Tasks\Util\User;

trait OccurredUserTrait
{
	public function getOccurredUserId(int $executorId): int
	{
		$userId = (int)User::getOccurAsId();
		if ($userId > 0)
		{
			return $userId;
		}

		return $executorId;
	}
}