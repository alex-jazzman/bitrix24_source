<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector\StagesQueryModificator;

class ExecutorResultValues
{
	/** @var array<string, ?int>  */
	private array $itemsCount = [];

	/** @var array<string, ?ItemsSum>  */
	private array $itemsSum = [];

	public function getItemsSum(string $stageId): ?ItemsSum
	{
		return $this->itemsSum[$stageId] ?? null;
	}

	public function addItemsSum(string $stageId, ?ItemsSum $sum): self
	{
		$this->itemsSum[$stageId] = $sum;

		return $this;
	}

	public function getItemsCount(string $stageId): ?int
	{
		return $this->itemsCount[$stageId] ?? null;
	}

	public function addItemsCount(string $stageId, ?int $count): self
	{
		$this->itemsCount[$stageId] = $count;

		return $this;
	}
}
