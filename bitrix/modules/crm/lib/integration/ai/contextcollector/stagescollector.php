<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector;

use Bitrix\Crm\Category\Entity\Category;
use Bitrix\Crm\Category\PermissionEntityTypeHelper;
use Bitrix\Crm\EO_Status_Collection;
use Bitrix\Crm\Integration\AI\ContextCollector\StagesQueryModificator\Executor;
use Bitrix\Crm\Integration\AI\ContextCollector\StagesQueryModificator\ExecutorResultValues;
use Bitrix\Crm\Integration\AI\ContextCollector\StagesQueryModificator\ItemsCountQueryModificator;
use Bitrix\Crm\Integration\AI\ContextCollector\StagesQueryModificator\ItemsSumQueryModificator;
use Bitrix\Crm\Integration\AI\Contract\ContextCollector;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Factory;
use Bitrix\Crm\Service\UserPermissions;
use CCrmOwnerType;

final class StagesCollector implements ContextCollector
{
	private bool $isCollectItemsCount = true;
	private bool $isCollectItemsSum = true;

	private readonly UserPermissions $permissions;
	private readonly ?Factory $factory;

	public function __construct(
		private readonly int $entityTypeId,
		private readonly Context $context,
	)
	{
		$this->permissions = Container::getInstance()->getUserPermissions($this->context->userId());
		$this->factory = Container::getInstance()->getFactory($this->entityTypeId);
	}

	public function setIsCollectItemsCount(bool $isCollect): self
	{
		$this->isCollectItemsCount = $isCollect;

		return $this;
	}

	public function setIsCollectItemsSum(bool $isCollect): self
	{
		$this->isCollectItemsSum = $isCollect;

		return $this;
	}

	public function collect(): array
	{
		if ($this->factory === null || !$this->factory->isStagesEnabled())
		{
			return [];
		}

		$categoryIds = $this->getCategoryIds();
		if (empty($categoryIds) && $this->factory->isCategoriesSupported())
		{
			return [];
		}

		$stages = $this->getStages($categoryIds);
		$additionalData = $this->getAdditionalData($categoryIds);

		$result = [];
		foreach ($stages as $stage)
		{
			$result[] = [
				'id' => $stage->getStatusId(),
				'name' => $stage->getName(),
				'semantics' => $stage->getSemantics() ?? PhaseSemantics::PROCESS,
				'sort' => $stage->getSort(),
				'category_id' => $this->factory->isCategoriesSupported() ? $stage->getCategoryId() : null,
				'items_count' => $additionalData->getItemsCount($stage->getStatusId()),
				'items_sum' => $additionalData->getItemsSum($stage->getStatusId())?->toArray(),
			];
		}

		return $result;
	}

	private function getCategoryIds(): ?array
	{
		if ($this->factory->isCategoriesSupported())
		{
			$categories = $this->factory->getCategories();
			$categories = $this->permissions->category()->filterAvailableForReadingCategories($categories);

			return array_map(static fn (Category $category): int => $category->getId(), $categories);
		}

		return null;
	}

	private function getStages(?array $categoryIds): EO_Status_Collection
	{
		if ($categoryIds === null)
		{
			return $this->factory->getStages();
		}

		return $this->factory
			->getStageBroker()
			->getByCategoryIds($categoryIds);
	}

	private function getAdditionalData(?array $categoryIds): ExecutorResultValues
	{
		$queryModificators = $this->getAdditionalDataQueryModificators();
		if (empty($queryModificators))
		{
			return new ExecutorResultValues();
		}

		$permissionEntityTypes = $this->getPermissionEntityTypes($categoryIds);

		$query = $this->permissions
			->itemsList()
			->applyAvailableItemsQueryParameters($this->factory->getDataClass()::query(), $permissionEntityTypes);

		return (new Executor($queryModificators))
			->execute($query);
	}

	private function getPermissionEntityTypes(?array $categoryIds): array
	{
		if ($categoryIds === null)
		{
			return [
				CCrmOwnerType::ResolveName($this->entityTypeId),
			];
		}

		$permissionHelper = (new PermissionEntityTypeHelper($this->entityTypeId));

		return array_map([$permissionHelper, 'getPermissionEntityTypeForCategory'], $categoryIds);
	}

	private function getAdditionalDataQueryModificators(): array
	{
		$result = [];
		if ($this->isCollectItemsCount)
		{
			$result[] = new ItemsCountQueryModificator($this->factory);
		}

		if ($this->isCollectItemsSum)
		{
			$result[] = new ItemsSumQueryModificator($this->factory);
		}

		return $result;
	}
}
