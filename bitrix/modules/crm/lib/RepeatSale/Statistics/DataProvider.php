<?php

namespace Bitrix\Crm\RepeatSale\Statistics;

use Bitrix\Crm\Item;
use Bitrix\Crm\ItemIdentifier;
use Bitrix\Crm\ItemIdentifierCollection;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\RepeatSale\Log\Controller\RepeatSaleLogController;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\ORM\Objectify\Collection;
use Bitrix\Main\Type\DateTime;

final class DataProvider
{
	public function __construct(private readonly RepeatSaleLogController $repeatSaleLogController)
	{

	}

	public function getData(PeriodType $periodType): array
	{
 		$startDate = $this->getStartDate($periodType);
		$logItems = $this->getLogItems(['>=CREATED_AT' => $startDate]);

		if ($logItems->isEmpty())
		{
			$otherWinSum = $this->getItemsSum(new ItemIdentifierCollection(), false, $startDate);

			return [
				'repeatSaleWinSum' => $this->format(0),
				'repeatSaleWinCount' => 0,
				'repeatSaleProcessSum' => $this->format(0),
				'otherWinSum' => $this->format($otherWinSum),
				'totalSum' => $this->format($otherWinSum),
				'percent' => 0,
			];
		}

		$allItems = new ItemIdentifierCollection();
		$finalItems = new ItemIdentifierCollection();
		$processItems = new ItemIdentifierCollection();
		foreach ($logItems as $logItem)
		{
			// temporary support only deals
			if ($logItem->getEntityTypeId() !== \CCrmOwnerType::Deal)
			{
				continue;
			}

			$itemIdentifier = new ItemIdentifier(
				$logItem->getEntityTypeId(),
				$logItem->getEntityId(),
			);

			if ($logItem->getStageSemanticId() === PhaseSemantics::PROCESS)
			{
				$processItems->append($itemIdentifier);
				$allItems->append($itemIdentifier);
			}
			elseif ($logItem->getStageSemanticId() === PhaseSemantics::SUCCESS)
			{
				$finalItems->append($itemIdentifier);
				$allItems->append($itemIdentifier);
			}
		}

		$repeatSaleWinSum = $this->getItemsSum($finalItems);
		$repeatSaleProcessSum = $this->getItemsSum($processItems);
		$repeatSaleTotalSum = $repeatSaleWinSum + $repeatSaleProcessSum;
		$otherWinSum = $this->getItemsSum($allItems, false, $startDate);
		$total = $repeatSaleTotalSum + $otherWinSum;

		return [
			'repeatSaleWinSum' => $this->format($repeatSaleWinSum),
			'repeatSaleWinCount' => $finalItems->count(),
			'repeatSaleProcessSum' => $this->format($repeatSaleProcessSum),
			'otherWinSum' => $this->format($otherWinSum),
			'totalSum' => $this->format($total),
			'percent' => $total > 0 ? round($repeatSaleTotalSum / $total * 100) : 0,
		];
	}

	private function getLogItems(array $filter): Collection
	{
		return $this->repeatSaleLogController->getList([
			'filter' => $filter,
			'limit' => 0,
		]);
	}

	private function getItemsSum(
		ItemIdentifierCollection $itemIdentifierCollection,
		bool $filterByRepeatSalesItems = true,
		?DateTime $startDate = null,
	): float
	{
		$entityGroups = $itemIdentifierCollection->toGroupedByEntityTypeIdArray();
		$sum = 0;

		/*
 		* @todo temporary only deal support. if no deals created through repeat sales.
		* In the next release, rework it to support different types of entities
		*/
		if (empty($entityGroups) && !$filterByRepeatSalesItems)
		{
			return $this->getDealItemsAmount($startDate);
		}

		foreach ($entityGroups as $entityTypeId => $items)
		{
			$factory = Container::getInstance()->getFactory($entityTypeId);
			if (!$factory)
			{
				continue;
			}

			$ids = array_column($items, 'ENTITY_ID');
			if ($filterByRepeatSalesItems)
			{
				$filter['@ID'] = $ids;
			}
			else
			{
				$filter['!@ID'] = $ids;
				$filter[Item::FIELD_NAME_STAGE_SEMANTIC_ID] = PhaseSemantics::SUCCESS;
			}

			if ($startDate)
			{
				$fieldName = $factory->getFieldsMap()[Item::FIELD_NAME_CREATED_TIME];
				$filter['>=' . $fieldName] = $startDate;
			}

			$sum += $factory->getItemsOpportunityAccountAmount($filter, 3600);
		}

		return $sum;
	}

	/*
	 * @todo temporary, will be removed in the next release
	 */
	private function getDealItemsAmount(?DateTime $startDate): float
	{
		$factory = Container::getInstance()->getFactory(\CCrmOwnerType::Deal);
		$fieldName = $factory->getFieldsMap()[Item::FIELD_NAME_CREATED_TIME];

		$filter = [];
		if ($startDate)
		{
			$filter = [
				'>=' . $fieldName => $startDate,
				Item::FIELD_NAME_STAGE_SEMANTIC_ID => PhaseSemantics::SUCCESS,
			];
		}

		return $factory->getItemsOpportunityAccountAmount($filter, 3600);
	}

	private function format(float $sum): string
	{
		return \CCrmCurrency::MoneyToString(round($sum), $this->getCurrency());
	}

	private function getStartDate(PeriodType $periodType): ?DateTime
	{
		$dateTime = new DateTime();

		if ($periodType === PeriodType::Day30)
		{
			$dateTime->add('-30 days');
		}
		elseif ($periodType === PeriodType::Quarter)
		{
			$dateTime->add('-3 months');
		}
		elseif ($periodType === PeriodType::HalfYear)
		{
			$dateTime->add('-6 months');
		}
		elseif ($periodType === PeriodType::Year)
		{
			$dateTime->add('-12 months');
		}

		return $dateTime->setTime(0, 0);
	}

	private function getCurrency(): ?string
	{
		return \CCrmCurrency::GetAccountCurrencyID();
	}
}
