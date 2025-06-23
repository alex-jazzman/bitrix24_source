<?php

namespace Bitrix\Crm\Dto\Validator;

use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Dto\Validator;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Factory;
use Bitrix\Main\ArgumentException;
use Bitrix\Crm\Result;
use CCrmOwnerType;

final class DefinedCategory extends Validator
{
	private readonly Factory $factory;

	/**
	 * @throws ArgumentException
	 */
	public function __construct(
		Dto $dto,
		private readonly int $entityTypeId,
		private readonly string $categoryIdField,
	)
	{
		parent::__construct($dto);

		if (!CCrmOwnerType::isUseFactoryBasedApproach($this->entityTypeId))
		{
			throw new ArgumentException('Must be use factory based approach', 'entityTypeId');
		}

		$this->factory = Container::getInstance()->getFactory($this->entityTypeId);
	}

	public function validate(array $fields): Result
	{
		if (!array_key_exists($this->categoryIdField, $fields))
		{
			return Result::success();
		}

		$categoryId = $fields[$this->categoryIdField];
		if ($categoryId === null && !$this->factory->isCategoriesSupported())
		{
			return Result::success();
		}

		if (!is_numeric($categoryId) || !$this->factory->isCategoryAvailable((int)$categoryId))
		{
			$error = $this->getWrongFieldError($this->categoryIdField, $this->dto->getName());

			return Result::fail($error);
		}

		return Result::success();
	}
}
