<?php

namespace Bitrix\Crm\Dto\Validator\EntityType;

use Bitrix\Crm\Dto\Contract\Invertible;
use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Dto\Validator;
use Bitrix\Crm\Result;
use Bitrix\Main\Error;
use CCrmOwnerType;

class IsPossibleDynamicType extends Validator
{
	public function __construct(
		Dto $dto,
		private readonly string $entityTypeIdField,
	)
	{
		parent::__construct($dto);
	}

	public function validate(array $fields): \Bitrix\Main\Result
	{
		if (!array_key_exists($this->entityTypeIdField, $fields))
		{
			return Result::success();
		}

		$entityTypeId = $fields[$this->entityTypeIdField];
		if (!is_numeric($entityTypeId) || !CCrmOwnerType::isPossibleDynamicTypeId((int)$entityTypeId))
		{
			$error = $this->getWrongFieldError($this->entityTypeIdField, $this->dto->getName());

			return Result::fail($error);
		}

		return Result::success();
	}
}
