<?php

namespace Bitrix\Crm\RepeatSale\Segment\Collector;

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Traits\Singleton;

abstract class BaseCollector
{
	use Singleton;

	protected int $limit = 50;

	public function setLimit(int $limit): BaseCollector
	{
		$this->limit = $limit;

		return $this;
	}

	public function getSegmentData(int $entityTypeId, ?int $lastItemId = null): SegmentData
	{
		$filter = [];
		if ($lastItemId > 0)
		{
			$filter['>ID'] = $lastItemId;
		}

		return $this->createSegmentData($entityTypeId, $filter);
	}

	protected function createSegmentData(int $entityTypeId, array $filter): SegmentData
	{
		if ($entityTypeId !== \CCrmOwnerType::Contact && $entityTypeId !== \CCrmOwnerType::Company)
		{
			return new SegmentData([], $entityTypeId);
		}

		if ($entityTypeId === \CCrmOwnerType::Contact)
		{
			$ids = $this->getContactIds($filter);
		}
		else
		{
			$ids = $this->getCompanyIds($filter);
		}

		return new SegmentData(
			$this->getItemsByIds($ids, $entityTypeId),
			$entityTypeId,
			array_pop($ids)
		);
	}

	abstract protected function getContactIds(array $filter): array;

	abstract protected function getCompanyIds(array $filter): array;

	private function getItemsByIds(array $ids, int $entityTypeId): array
	{
		if (empty($ids))
		{
			return [];
		}

		$factory = Container::getInstance()->getFactory($entityTypeId);

		return $factory?->getItems([
			'select' => ['ID'],
			'filter' => [
				'@ID' => $ids,
			],
		]) ?? [];
	}
}
