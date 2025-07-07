<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector;

use Bitrix\Crm\Integration\AI\ContextCollector\EntityCollector\StageSettings;
use Bitrix\Crm\Integration\AI\Contract\ContextCollector;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\UserPermissions;

final class CategoriesCollector implements ContextCollector
{
	private readonly UserPermissions\EntityPermissions\Category $permissions;
	private StageSettings $stageSettings;

	public function __construct(
		private readonly int $entityTypeId,
		private readonly Context $context,
	)
	{
		$this->stageSettings = new StageSettings();
		$this->permissions = Container::getInstance()
			->getUserPermissions($this->context->userId())
			->category();
	}

	public function setStageSettings(StageSettings $settings): self
	{
		$this->stageSettings = $settings;

		return $this;
	}

	public function collect(): array
	{
		$factory = Container::getInstance()->getFactory($this->entityTypeId);
		if ($factory === null || !$factory->isCategoriesEnabled())
		{
			return [];
		}

		$result = [];
		foreach ($factory->getCategories() as $category)
		{
			if (!$this->permissions->canReadItems($category))
			{
				continue;
			}

			$info = [
				'id' => $category->getId(),
				'name' => $category->getName(),
			];

			if ($factory->isStagesSupported() && $this->stageSettings->isCollect())
			{
				$info['stages'] = (new StagesCollector($this->entityTypeId, $category->getId(), $this->context))
					->setSettings($this->stageSettings)
					->collect();
			}

			$result[] = $info;
		}

		return $result;
	}
}
