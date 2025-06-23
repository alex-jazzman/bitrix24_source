<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service;

use Bitrix\Tasks\Util\User;

class NameService
{
	public function format(array $user): string
	{
		return User::formatName($user);
	}
}