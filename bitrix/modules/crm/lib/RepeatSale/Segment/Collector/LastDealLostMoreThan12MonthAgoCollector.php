<?php

namespace Bitrix\Crm\RepeatSale\Segment\Collector;

use Bitrix\Crm\Binding\DealContactTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\Type\Date;

class LastDealLostMoreThan12MonthAgoCollector extends BaseCollector
{
	protected function getCompanyIds(array $filter): array
	{
		$lostDealsCompaniesQuery = $this->getLostDealsCompaniesQuery($filter);
		$lostDealsCompanyIds = $this->getLostDealsCompanyIds($lostDealsCompaniesQuery);

		if (empty($lostDealsCompanyIds))
		{
			return [];
		}

		$notLostDealsCompaniesQuery = $this->getNotLostDealsCompaniesQuery($lostDealsCompanyIds);
		$notLostDealsCompanyIds = $this->getNotLostDealsCompanyIds($notLostDealsCompaniesQuery);

		return array_diff($lostDealsCompanyIds, $notLostDealsCompanyIds);
	}

	private function getLostDealsCompaniesQuery(array $filter): Query
	{
		$oneYearAgo = (new Date())->add('-1 year');

		return DealTable::query()
			->addSelect('COMPANY_ID')
			->where('STAGE_SEMANTIC_ID', PhaseSemantics::FAILURE)
			->where('COMPANY_ID', '>', $filter['>ID'] ?? 0)
			->where('CLOSEDATE', '<=', $oneYearAgo)
			->setLimit($this->limit)
			->setDistinct()
		;
	}

	protected function getLostDealsCompanyIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'COMPANY_ID');
	}

	private function getNotLostDealsCompaniesQuery(array $lostDealsCompanyIds): Query
	{
		$oneYearAgo = (new Date())->add('-1 year');

		return DealTable::query()
			->addSelect('COMPANY_ID')
			->whereIn('COMPANY_ID', $lostDealsCompanyIds)
			->where('CLOSEDATE', '>', $oneYearAgo)
			->setDistinct()
		;
	}

	protected function getNotLostDealsCompanyIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'COMPANY_ID');
	}

	protected function getContactIds(array $filter): array
	{
		$lostDealsQuery = $this->getLostDealsQuery($filter);
		$lostDealsIds = $this->getLostDealIds($lostDealsQuery);

		if (empty($lostDealsIds))
		{
			return [];
		}

		$lostDealsContactsQuery = $this->getLostDealsContactsQuery($lostDealsIds);
		$lostDealsContactIds = $this->getLostDealsContactIds($lostDealsContactsQuery);

		if (empty($lostDealsContactIds))
		{
			return [];
		}

		$notLostDealsContactsQuery = $this->getNotLostDealsContactsQuery($lostDealsContactIds);
		$notLostDealsContactIds = $this->getNotLostDealsContactIds($notLostDealsContactsQuery);

		return array_diff($lostDealsContactIds, $notLostDealsContactIds);
	}

	private function getLostDealsQuery(array $filter): Query
	{
		$oneYearAgo = (new Date())->add('-1 year');

		return DealTable::query()
			->addSelect('ID')
			->where('STAGE_SEMANTIC_ID', PhaseSemantics::FAILURE)
			->where('CONTACT_ID', '>', $filter['>ID'] ?? 0)
			->where('CLOSEDATE', '<=', $oneYearAgo)
			->setLimit($this->limit)
			->setDistinct()
		;
	}

	protected function getLostDealIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'ID');
	}

	private function getLostDealsContactsQuery(array $ids): Query
	{
		return DealContactTable::query()
			->addSelect('CONTACT_ID')
			->whereIn('DEAL_ID', $ids)
			->addGroup('CONTACT_ID')
		;
	}

	protected function getLostDealsContactIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'CONTACT_ID');
	}

	private function getNotLostDealsContactsQuery(array $ids): Query
	{
		$oneYearAgo = (new Date())->add('-1 year');

		return DealContactTable::query()
			->setSelect(['CONTACT_ID'])
			->registerRuntimeField(new ReferenceField(
				'DEAL',
				DealTable::getEntity(),
				['=this.DEAL_ID' => 'ref.ID'],
				['join_type' => 'RIGHT']
			))
			->where('DEAL.BEGINDATE', '>', $oneYearAgo)
			->whereIn('CONTACT_ID', $ids)
			->setDistinct()
		;
	}

	protected function getNotLostDealsContactIds(Query $query): array
	{
		return array_column($query->exec()->fetchAll(), 'CONTACT_ID');
	}
}
