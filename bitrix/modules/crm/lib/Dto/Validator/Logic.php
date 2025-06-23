<?php

namespace Bitrix\Crm\Dto\Validator;

use Bitrix\Crm\Dto\Contract\Validator;
use Bitrix\Crm\Dto\Validator\Logic\LogicOr;

final class Logic
{
	private function __construct()
	{
	}

	public static function or(array $validators): LogicOr
	{
		return new LogicOr($validators);
	}
}
