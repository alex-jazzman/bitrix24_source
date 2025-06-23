<?php

namespace Bitrix\Crm\Integration\AI\ContextCollector\StagesQueryModificator;

use Bitrix\Main\ORM\Query\Query;

final class ItemsCountQueryModificator extends AbstractQueryModificator
{
	private const RESULT_FIELD = 'ITEMS_COUNT';

	public function modify(Query $query): Query
	{
		if (!$this->factory->isStagesSupported())
		{
			return $query;
		}

		return $query
			->addSelect($this->stageFieldName)
			->addSelect(Query::expr()->count('ID'), self::RESULT_FIELD)
			->addGroup($this->stageFieldName);
	}

	public function transferFormattedValues(array $fetchAllResult, ExecutorResultValues $values): void
	{
		foreach ($fetchAllResult as $item)
		{
			$stageId = $item[$this->stageFieldName] ?? null;
			if ($stageId === null)
			{
				continue;
			}

			$stageItemsCount = $item[self::RESULT_FIELD] ?? null;
			$values->addItemsCount($stageId, $stageItemsCount);
		}
	}
}
