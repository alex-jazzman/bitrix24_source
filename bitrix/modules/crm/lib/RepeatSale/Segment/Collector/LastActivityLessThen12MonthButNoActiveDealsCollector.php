<?php

namespace Bitrix\Crm\RepeatSale\Segment\Collector;

use Bitrix\Crm\Binding\DealContactTable;
use Bitrix\Crm\CompanyTable;
use Bitrix\Crm\ContactTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\Type\Date;

final class LastActivityLessThen12MonthButNoActiveDealsCollector extends BaseCollector
{
	protected function getCompanyIds(array $filter): array
	{
		$oneYearAgo = (new Date())->add('-1 year');

		$activeCompaniesQuery = CompanyTable::query()
			->addSelect('ID')
			->where('ID', '>', $filter['>ID'] ?? 0)
			->where('LAST_ACTIVITY_TIME', '>=', $oneYearAgo)
			->setLimit($this->limit)
		;
		$activeCompanyIds = array_column($activeCompaniesQuery->exec()->fetchAll(), 'ID');

		$activeDealsResult = DealTable::query()
			->addSelect('COMPANY_ID')
			->whereIn('COMPANY_ID', $activeCompanyIds)
			->where(Query::filter()
				->logic('or')
				->where(Query::filter()->where('CLOSED', 'N'))
				->where(
					Query::filter()
						->logic('or')
						->where([
							['CLOSEDATE', '>=', $oneYearAgo],
							['STAGE_SEMANTIC_ID', '!=', PhaseSemantics::SUCCESS]
						])
				)
			)
			->setGroup('COMPANY_ID')
		;
		$activeDealsCompanyIds = array_column($activeDealsResult->exec()->fetchAll(), 'COMPANY_ID');

		return array_diff($activeCompanyIds, $activeDealsCompanyIds);
	}

	protected function getContactIds(array $filter): array
	{
		$oneYearAgo = (new Date())->add('-1 year');

		$activeContactsQuery = ContactTable::query()
			->addSelect('ID')
			->where('ID', '>', $filter['>ID'] ?? 0)
			->where('LAST_ACTIVITY_TIME', '>=', $oneYearAgo)
			->setLimit($this->limit)
		;
		$activeContactIds = array_column($activeContactsQuery->exec()->fetchAll(), 'ID');

		$activeContactsResult = DealContactTable::query()
			->addSelect('CONTACT_ID')
			->whereIn('CONTACT_ID', $activeContactIds)
			->where(Query::filter()
				->logic('or')
				->where(Query::filter()->where('DEAL.CLOSED', 'N'))
				->where(
					Query::filter()
						->where([
							['DEAL.CLOSEDATE', '>=', $oneYearAgo],
							['DEAL.STAGE_SEMANTIC_ID', '!=', PhaseSemantics::SUCCESS]
						])
				)
			)
			->setGroup('CONTACT_ID')
		;

		$activeDealsContactIds = array_column($activeContactsResult->exec()->fetchAll(), 'CONTACT_ID');

		return array_diff($activeContactIds, $activeDealsContactIds);
	}
}
