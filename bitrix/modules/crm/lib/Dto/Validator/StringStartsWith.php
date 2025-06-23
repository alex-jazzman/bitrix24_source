<?php

namespace Bitrix\Crm\Dto\Validator;

use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Dto\Validator;
use Bitrix\Crm\Result;

class StringStartsWith extends Validator
{
	public function __construct(
		Dto $dto,
		private readonly string $field,
		private readonly string $needle,
	)
	{
		parent::__construct($dto);
	}

	public function validate(array $fields): \Bitrix\Main\Result
	{
		if (array_key_exists($this->field, $fields))
		{
			return Result::success();
		}

		$value = $fields[$this->field];
		if (is_string($value) && str_starts_with((string)$value, $this->needle))
		{
			$error = $this->getWrongFieldError($this->field, $this->dto->getName());

			return Result::fail($error);
		}

		return Result::success();
	}
}
