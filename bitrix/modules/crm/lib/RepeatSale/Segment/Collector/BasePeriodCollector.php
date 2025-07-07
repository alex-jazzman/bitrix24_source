<?php

namespace Bitrix\Crm\RepeatSale\Segment\Collector;

use Bitrix\Crm\Binding\DealContactTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\Service\Communication\Utils\Common;
use Bitrix\Main\Application;
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\Type\Date;

abstract class BasePeriodCollector extends BaseCollector
{
	abstract protected function getIntervals(): array;

	protected function getCompanyIds(array $filter): array
	{
		$companiesQuery = $this->getEveryPeriodCompaniesQuery($filter);
		$companyIds = $this->getCompanyIdsFromQuery($companiesQuery);

		if (empty($companyIds))
		{
			return [];
		}

		if (!$this->isOnlyCalc)
		{
			$nextDayCompaniesQuery = $this->getEveryPeriodCompaniesQuery($filter, true);
			$nextDayCompanyIds = $this->getCompanyIdsFromQuery($nextDayCompaniesQuery);
			$companyIds = array_diff($companyIds, $nextDayCompanyIds);

			if (empty($companyIds))
			{
				return [];
			}
		}

		$companiesWithActiveDealsQuery = $this->getCompaniesWithActiveDealsQuery($companyIds);
		$companiesWithActiveDealIds = $this->getCompanyIdsFromQuery($companiesWithActiveDealsQuery);

		return array_diff($companyIds, $companiesWithActiveDealIds);
	}

	private function getEveryPeriodCompaniesQuery(array $filter, bool $isNextDayIntervals = false): Query
	{
		$query = DealTable::query();

		$query->setSelect(['COMPANY_ID'])
			->where('COMPANY_ID', '>', $filter['>ID'] ?? 0)
			->setLimit($this->limit)
			->setOrder(['COMPANY_ID' => 'ASC'])
			->setDistinct()
		;

		foreach ($this->getIntervals() as $interval)
		{
			$query->whereExists($this->getSqlExpression($query, $interval, 'COMPANY_ID', $isNextDayIntervals));
		}

		return $query;
	}

	protected function getCompanyIdsFromQuery(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'COMPANY_ID');
	}

	private function getCompaniesWithActiveDealsQuery(array $everyPeriodCompanyIds): Query
	{
		return DealTable::query()
			->addSelect('COMPANY_ID')
			->whereIn('COMPANY_ID', $everyPeriodCompanyIds)
			->where('CLOSED', '=', 'N')
			->setDistinct()
		;
	}

	protected function getContactIds(array $filter): array
	{
		$dealsQuery = $this->getEveryPeriodDealsQuery($filter);
		$dealIds = $this->getEveryPeriodDealIds($dealsQuery);
		if (empty($dealIds))
		{
			return [];
		}

		if (!$this->isOnlyCalc)
		{
			$nextDayDealsQuery = $this->getEveryPeriodDealsQuery($filter, true);
			$nextDayDealIds = $this->getEveryPeriodDealIds($nextDayDealsQuery);
			$dealIds = array_diff($dealIds, $nextDayDealIds);

			if (empty($dealIds))
			{
				return [];
			}
		}

		$contactsQuery = $this->getEveryPeriodDealContactsQuery($dealIds);
		$contactIds = $this->getContactIdsFromQuery($contactsQuery);
		if (empty($contactIds))
		{
			return [];
		}

		$contactsWithActiveDealsQuery = $this->getNotCompletedDealsContactsQuery($contactIds);
		$contactsWithActiveDealIds = $this->getContactIdsFromQuery($contactsWithActiveDealsQuery);

		return array_diff($contactIds, $contactsWithActiveDealIds);
	}

	private function getEveryPeriodDealsQuery(array $filter, bool $isNextDayIntervals = false): Query
	{
		$query = DealTable::query()
			->setSelect(['ID'])
			->where('CONTACT_ID', '>', $filter['>ID'] ?? 0)
			->setLimit($this->limit)
			->setOrder(['CONTACT_ID' => 'ASC'])
		;

		foreach ($this->getIntervals() as $interval)
		{
			$query->whereExists($this->getSqlExpression($query, $interval, 'CONTACT_ID', $isNextDayIntervals));
		}

		return $query;
	}

	protected function getEveryPeriodDealIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'ID');
	}

	private function getEveryPeriodDealContactsQuery(array $everyPeriodDealIds): Query
	{
		return DealContactTable::query()
			->addSelect('CONTACT_ID')
			->whereIn('DEAL_ID', $everyPeriodDealIds)
			->setDistinct()
		;
	}

	protected function getContactIdsFromQuery(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'CONTACT_ID');
	}

	private function getNotCompletedDealsContactsQuery(array $everyPeriodDealContactIds): Query
	{
		return DealContactTable::query()
			->setSelect(['CONTACT_ID'])
			->where('DEAL.CLOSED', '=', 'N')
			->whereIn('CONTACT_ID', $everyPeriodDealContactIds)
			->setDistinct()
		;
	}

	private function getSqlExpression(
		Query $query,
		string $interval,
		string $fieldName,
		bool $isNextDayPeriod,
	): SqlExpression
	{
		$sqlHelper = Application::getConnection()->getSqlHelper();

		$periodStart = (new Date())->add($this->getOffset())->add($interval);
		$periodFinish = (new Date())->add($this->getOffset())->add($interval)->add($this->getPeriod());

		if ($isNextDayPeriod)
		{
			$periodStart->add('1 day');
		}

		return new SqlExpression("
			SELECT 1
			FROM " . DealTable::getTableName() . "
			WHERE
				" . $fieldName . " = " . $query->getInitAlias() . "." . $fieldName . "
				AND STAGE_SEMANTIC_ID = '" . $sqlHelper->forSql(PhaseSemantics::SUCCESS) . "' 
				AND DATE_CREATE BETWEEN " . $sqlHelper->convertToDbDateTime($periodStart) . " AND " . $sqlHelper->convertToDbDateTime($periodFinish),
		);
	}

	protected function getNextItemsMinId(int $entityTypeId, array $filter): ?int
	{
		if (!Common::isClientEntityTypeId($entityTypeId))
		{
			return null;
		}

		$minId = ($filter['>ID'] ?? 0) + $this->limit;
		$fieldName = $entityTypeId === \CCrmOwnerType::Contact ? 'CONTACT_ID' : 'COMPANY_ID';

		$query = DealTable::query()
			->setLimit(1)
			->setSelect([$fieldName])
			->where($fieldName, '>', $minId)
			->setOrder([$fieldName => 'ASC'])
		;

		$result = $query->exec()->fetch();

		return is_array($result) ? (int)$result[$fieldName] : null;
	}

	protected function getPeriod(): string
	{
		return '1 month';
	}

	protected function getOffset(): string
	{
		return '7 days';
	}
}
