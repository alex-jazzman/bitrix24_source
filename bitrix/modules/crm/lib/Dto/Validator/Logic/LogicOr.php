<?php

namespace Bitrix\Crm\Dto\Validator\Logic;

use Bitrix\Crm\Badge\ValueItem;
use Bitrix\Crm\Dto\Contract\Validator;
use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Result;
use Bitrix\Main\ErrorCollection;

class LogicOr implements Validator
{
	/** @var Validator[] $validators */
	private array $validators = [];

	public function __construct(array $validators)
	{
		foreach ($validators as $validator)
		{
			if ($validator instanceof Validator)
			{
				$this->validators[] = $validator;
			}
		}
	}

	public function validate(array $fields): \Bitrix\Main\Result
	{
		$lastErrors = null;
		foreach ($this->validators as $validator)
		{
			$result = $validator->validate($fields);
			if ($result->isSuccess())
			{
				return Result::success();
			}

			$lastErrors = $result->getErrorCollection();
		}

		if ($lastErrors === null)
		{
			return Result::success();
		}

		return Result::fail($lastErrors);
	}
}
