<?php

namespace Bitrix\Crm\RepeatSale\Segment\Collector;

use Bitrix\Crm\Binding\DealContactTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Main\Application;
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\Type\Date;

abstract class BasePeriodCollector extends BaseCollector
{

	abstract protected function getIntervals(): array;

	protected function getCompanyIds(array $filter): array
	{
		$everyPeriodCompaniesQuery = $this->getEveryPeriodCompaniesQuery($filter);
		$everyPeriodCompanyIds = $this->getEveryPeriodCompaniesIds($everyPeriodCompaniesQuery);
		if (empty($everyPeriodCompanyIds))
		{
			return [];
		}

		$companiesWithActiveDealsQuery = $this->getCompaniesWithActiveDealsQuery($everyPeriodCompanyIds);
		$companiesWithActiveDealIds = $this->getCompaniesWithActiveDealIds($companiesWithActiveDealsQuery);

		return array_diff($everyPeriodCompanyIds, $companiesWithActiveDealIds);
	}

	private function getEveryPeriodCompaniesQuery(array $filter): Query
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
			$query->whereExists($this->getSqlExpression($query, $interval));
		}

		return $query;
	}

	protected function getEveryPeriodCompaniesIds(Query $query): array
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

	protected function getCompaniesWithActiveDealIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'COMPANY_ID');
	}

	protected function getContactIds(array $filter): array
	{
		$everyPeriodDealsQuery = $this->getEveryPeriodDealsQuery($filter);
		$everyPeriodDealIds = $this->getEveryPeriodDealIds($everyPeriodDealsQuery);
		if (empty($everyPeriodDealIds))
		{
			return [];
		}

		$everyPeriodDealContactsQuery = $this->getEveryPeriodDealContactsQuery($everyPeriodDealIds);
		$everyPeriodDealContactIds = $this->getEveryPeriodDealContactIds($everyPeriodDealContactsQuery);
		if (empty($everyPeriodDealContactIds))
		{
			return [];
		}

		$notCompletedDealsContactsQuery = $this->getNotCompletedDealsContactsQuery($everyPeriodDealContactIds);
		$notCompletedDealsContactIds = $this->getNotCompletedDealsContactsIds($notCompletedDealsContactsQuery);

		return array_diff($everyPeriodDealContactIds, $notCompletedDealsContactIds);
	}

	private function getEveryPeriodDealsQuery(array $filter): Query{
		$query = DealTable::query()
			->setSelect(['ID'])
			->where('CONTACT_ID', '>', $filter['>ID'] ?? 0)
			->setLimit($this->limit)
			->setOrder(['CONTACT_ID' => 'ASC'])
		;

		foreach ($this->getIntervals() as $interval)
		{
			$query->whereExists($this->getSqlExpression($query, $interval, 'CONTACT_ID'));
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

	protected function getEveryPeriodDealContactIds(Query $query): array
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

	protected function getNotCompletedDealsContactsIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'CONTACT_ID');
	}

	private function getSqlExpression(Query $query, string $interval = '-1 year', string $fieldName = 'COMPANY_ID'): SqlExpression
	{
		$sqlHelper = Application::getConnection()->getSqlHelper();

		$lastPeriodStart = (new Date())->add($interval)->add('-15 days');
		$lastPeriodEnd = (new Date())->add($interval)->add('15 days');

		return new SqlExpression("
			SELECT 1
			FROM " . DealTable::getTableName() . "
			WHERE
				" . $fieldName . " = " .  $query->getInitAlias() . "." . $fieldName . "
				AND STAGE_SEMANTIC_ID = '" . $sqlHelper->forSql(PhaseSemantics::SUCCESS) . "' 
				AND CLOSEDATE BETWEEN " . $sqlHelper->convertToDbDateTime($lastPeriodStart) . " AND " . $sqlHelper->convertToDbDateTime($lastPeriodEnd)
		);
	}
}
