<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access;

use Bitrix\Main\Error;

interface AccessUserErrorInterface
{
	public function getUserError(): ?Error;
}