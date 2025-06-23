<?php

namespace Bitrix\Crm\Integration\AI\Function\Deal;

use Bitrix\Crm\Controller\ErrorCode;
use Bitrix\Crm\Integration\AI\Contract\AIFunction;
use Bitrix\Crm\Integration\AI\Function\Deal\Dto\MoveBetweenCategoryParameters;
use Bitrix\Crm\Item\Deal;
use Bitrix\Crm\Result;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Factory;
use Bitrix\Crm\Service\Operation\Update;
use Bitrix\Crm\Service\UserPermissions;
use Bitrix\Main\ErrorCollection;
use CCrmOwnerType;

final class MoveBetweenCategory implements AIFunction
{
	private readonly UserPermissions\EntityPermissions\Type $permissions;
	private readonly Factory $factory;

	private const LIMIT = 100;

	public function __construct(
		private readonly int $currentUserId,
	)
	{
		$this->permissions = Container::getInstance()->getUserPermissions($this->currentUserId)->entityType();
		$this->factory = Container::getInstance()->getFactory(CCrmOwnerType::Deal);
	}

	public function isAvailable(): bool
	{
		return true;
	}

	public function invoke(...$args): Result
	{
		$parameters = new MoveBetweenCategoryParameters($args);
		if ($parameters->hasValidationErrors())
		{
			return Result::fail($parameters->getValidationErrors());
		}

		if (!$this->permissions->canAddItemsInCategory(CCrmOwnerType::Deal, $parameters->to))
		{
			return Result::failAccessDenied();
		}

		$errors = new ErrorCollection();
		$deals = $this->getDeals($parameters->from);
		foreach ($deals as $deal)
		{
			$deal->setCategoryId($parameters->to);

			$result = $this->getOperation($deal)->launch();
			if (!$result->isSuccess())
			{
				$errors->add($result->getErrors());
			}
		}

		if (!$errors->isEmpty())
		{
			return Result::fail($errors);
		}

		return Result::success();
	}

	/**
	 * @return Deal[]
	 */
	private function getDeals(int $categoryId): array
	{
		$parameters = [
			'select' => [
				'*',
			],
			'filter' => [
				'=' . Deal::FIELD_NAME_CATEGORY_ID => $categoryId,
			],
			'limit' => self::LIMIT,
			'order' => [
				'ID' => 'DESC',
			],
		];

		return $this->factory->getItemsFilteredByPermissions(
			$parameters,
			$this->currentUserId,
			UserPermissions::OPERATION_UPDATE,
		);
	}

	private function getOperation(Deal $deal): Update
	{
		$operation = $this->factory->getUpdateOperation($deal);
		$operation
			->getContext()
			->setUserId($this->currentUserId);

		$operation
			->disableCheckAccess()
			->disableCheckFields()
			->disableCheckRequiredUserFields();

		return $operation;
	}
}
