<?php

namespace Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView;

use Bitrix\Crm\Entity\EntityEditorConfig;
use Bitrix\Crm\Entity\EntityEditorOptionBuilder;
use Bitrix\Crm\Integration\AI\Contract\AIFunction;
use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\CreateParameters;
use Bitrix\Crm\Result;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\UserPermissions;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;
use Bitrix\Ui\EntityForm\Scope;

final class Create implements AIFunction
{
	private readonly UserPermissions $permissions;

	public function __construct(private readonly int $currentUserId)
	{
		$this->permissions = Container::getInstance()->getUserPermissions($this->currentUserId);
	}

	public function isAvailable(): bool
	{
		return true;
	}

	public function invoke(...$args): Result
	{
		$parameters = new CreateParameters($args);
		if ($parameters->hasValidationErrors())
		{
			return Result::fail($parameters->getValidationErrors());
		}

		if (!Loader::includeModule('ui'))
		{
			return Result::failModuleNotInstalled('ui');
		}

		if (!$this->permissions->isAdminForEntity($parameters->entityTypeId))
		{
			return Result::failAccessDenied();
		}

		$guid = $this->getGuid($parameters);
		if (empty($guid))
		{
			return Result::failEntityTypeNotSupported($parameters->entityTypeId);
		}

		$category = 'crm';
		$title = $parameters->title;
		$accessCodes = $this->getUserAccessCodes($parameters);
		$config = $this->getConfig($parameters);
		$options = $this->getOptions($parameters);

		$result = Scope::getInstance()
			->setScopeConfig(
				$category,
				$guid,
				$title,
				$accessCodes,
				$config,
				$options,
			);

		if (is_array($result))
		{
			return Result::fail(new ErrorCollection($result));
		}

		return Result::success(userScopeId: $result);
	}

	private function getUserAccessCodes(CreateParameters $parameters): array
	{
		$userIds = [
			$this->currentUserId,
			...$parameters->userIds,
		];

		$result = [];
		foreach ($userIds as $userId)
		{
			$result[] = [
				'id' => $userId,
				'entityId' => 'user', /* @see Scope::TYPE_USER */
			];
		}

		return $result;
	}

	private function getConfig(CreateParameters $parameters): array
	{
		return [
			[
				'name' => 'default_column',
				'type' => 'column',
				'elements' => $parameters->toArraySections(),
			]
		];
	}

	private function getOptions(CreateParameters $parameters): array
	{
		return [
			'forceSetToUsers' => $parameters->forceSetToUsers,
			'common' => $parameters->common,
			'categoryName' => EntityEditorConfig::CATEGORY_NAME,
		];
	}

	private function getGuid(CreateParameters $parameters): string
	{
		return (new EntityEditorOptionBuilder($parameters->entityTypeId))
			->setCategoryId($parameters->categoryId)
			->build();
	}
}
