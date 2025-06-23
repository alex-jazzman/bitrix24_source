<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector;

use Bitrix\Crm\Integration\AI\ContextCollector\EntityCollector\Settings;
use Bitrix\Crm\Integration\AI\Contract\ContextCollector;
use CCrmOwnerType;

final class EntityCollector implements ContextCollector
{
	private readonly Settings $settings;

	public function __construct(
		private readonly int $entityTypeId,
		private readonly Context $context,
	)
	{
		$this->settings = new Settings();
	}

	public function settings(): Settings
	{
		return $this->settings;
	}

	/**
	 * @param callable(Settings $settings): void $configurator
	 * @return $this
	 */
	public function configure(callable $configurator): self
	{
		$configurator($this->settings);

		return $this;
	}

	public function collect(): array
	{
		$collectorsResult = (new CollectionCollector($this->buildCollectors()))->collect();

		return [
			'name' => CCrmOwnerType::GetCategoryCaption($this->entityTypeId),
			'entity_type_id' => $this->entityTypeId,
			...$collectorsResult,
		];
	}

	/**
	 * @return array<string, ContextCollector>
	 */
	private function buildCollectors(): array
	{
		$collectors = [];

		if ($this->settings()->isCollectFields())
		{
			$collectors['user_fields'] = new UserFieldsCollector($this->entityTypeId, $this->context);
		}

		if ($this->settings()->isCollectCategories())
		{
			$collectors['categories'] = new CategoriesCollector($this->entityTypeId, $this->context);
		}

		if ($this->settings()->isCollectStages())
		{
			$collectors['stages'] = (new StagesCollector($this->entityTypeId, $this->context))
				->setIsCollectItemsCount($this->settings()->isCollectStagesItemsCount())
				->setIsCollectItemsSum($this->settings()->isCollectStagesItemsSum());
		}

		return $collectors;
	}
}
