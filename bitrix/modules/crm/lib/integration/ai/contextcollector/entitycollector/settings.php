<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector\EntityCollector;

final class Settings
{
	private bool $isCollectFields = true;
	private bool $isCollectCategories = true;
	private bool $isCollectStages = true;
	private bool $isCollectStagesItemsCount = true;
	private bool $isCollectStagesItemsSum = true;

	public function isCollectFields(): bool
	{
		return $this->isCollectFields;
	}

	public function setIsCollectFields(bool $isCollectFields): self
	{
		$this->isCollectFields = $isCollectFields;

		return $this;
	}

	public function isCollectCategories(): bool
	{
		return $this->isCollectCategories;
	}

	public function setIsCollectCategories(bool $isCollectCategories): self
	{
		$this->isCollectCategories = $isCollectCategories;
		return $this;
	}

	public function isCollectStages(): bool
	{
		return $this->isCollectStages;
	}

	public function setIsCollectStages(bool $isCollectStages): self
	{
		$this->isCollectStages = $isCollectStages;

		return $this;
	}

	public function isCollectStagesItemsCount(): bool
	{
		return $this->isCollectStagesItemsCount;
	}

	public function setIsCollectStagesItemsCount(bool $isCollectStagesItemsCount): self
	{
		$this->isCollectStagesItemsCount = $isCollectStagesItemsCount;

		return $this;
	}

	public function isCollectStagesItemsSum(): bool
	{
		return $this->isCollectStagesItemsSum;
	}

	public function setIsCollectStagesItemsSum(bool $isCollectStagesItemsSum): self
	{
		$this->isCollectStagesItemsSum = $isCollectStagesItemsSum;

		return $this;
	}
}
