<?php

namespace Bitrix\Crm\Integration\AI\Function\Deal;

use Bitrix\Crm\Controller\ErrorCode;
use Bitrix\Crm\Integration\AI\Contract\AIFunction;
use Bitrix\Crm\Integration\AI\Function\Deal\Dto\MoveBetweenStageParameters;
use Bitrix\Crm\Item\Deal;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Factory;
use Bitrix\Crm\Service\Operation\Update;
use Bitrix\Crm\Service\UserPermissions;
use Bitrix\Crm\Result;
use Bitrix\Main\ErrorCollection;
use CCrmOwnerType;

final class MoveBetweenStage implements AIFunction
{
	private readonly UserPermissions\EntityPermissions\Stage $permissions;
	private readonly Factory $factory;

	private const LIMIT = 100;

	public function __construct(
		private readonly int $currentUserId,
	)
	{
		$this->permissions = Container::getInstance()->getUserPermissions($this->currentUserId)->stage();
		$this->factory = Container::getInstance()->getFactory(CCrmOwnerType::Deal);
	}

	public function isAvailable(): bool
	{
		return true;
	}

	public function invoke(...$args): Result
	{
		$parameters = new MoveBetweenStageParameters($args);
		if ($parameters->hasValidationErrors())
		{
			return Result::fail($parameters->getValidationErrors());
		}

		$fromStage = $this->factory->getStageFromCategory($parameters->categoryId, $parameters->from);
		if ($fromStage === null)
		{
			return Result::fail('Stage from which deals must be moved does not found');
		}

		$toStage = $this->factory->getStageFromCategory($parameters->categoryId, $parameters->to);
		if ($toStage === null)
		{
			return Result::fail('Stage to which deals need to be moved does not found');
		}

		if (!$this->canAddInStage($parameters))
		{
			return Result::failAccessDenied();
		}

		$errors = new ErrorCollection();
		foreach ($this->getDeals($fromStage->getStatusId()) as $deal)
		{
			$deal
				->setStageId($toStage->getStatusId())
				->setStageSemanticId($toStage->getSemantics() ?? PhaseSemantics::PROCESS);

			$result = $this->getUpdateOperation($deal)->launch();
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
	private function getDeals(string $stageId): array
	{
		$params = [
			'select' => [
				'*',
			],
			'filter' => [
				'=' . Deal::FIELD_NAME_STAGE_ID => $stageId,
			],
			'limit' => self::LIMIT,
			'order' => [
				'ID' => 'DESC',
			],
		];

		return $this->factory->getItemsFilteredByPermissions(
			$params,
			$this->currentUserId,
			UserPermissions::OPERATION_UPDATE,
		);
	}

	private function getUpdateOperation(Deal $deal): Update
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

	private function canAddInStage(MoveBetweenStageParameters $parameters): bool
	{
		return $this->permissions->canAddInStage(CCrmOwnerType::Deal, $parameters->categoryId, $parameters->to);
	}
}
