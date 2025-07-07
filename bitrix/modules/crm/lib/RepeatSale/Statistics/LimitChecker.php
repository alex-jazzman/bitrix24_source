<?php

namespace Bitrix\Crm\RepeatSale\Statistics;

use Bitrix\Crm\CompanyTable;
use Bitrix\Crm\ContactTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\Traits\Singleton;
use Bitrix\Main\Config\Option;

final class LimitChecker
{
	use Singleton;

	private const ENTITY_ITEMS_COUNT_LIMIT_OPTION_NAME = 'repeat_sale_entity_items_count_limit';
	private const ENTITY_ITEMS_COUNT_LIMIT = 300000;
	private const TTL = 86400;

	public function isLimitExceeded(): bool
	{
		$limit = $this->getEntityItemsCountLimit();
		$cache = ['ttl' => self::TTL];

		$dealsCount = DealTable::getCount([], $cache);
		if ($dealsCount >= $limit)
		{
			return true;
		}

		$contactsCount = ContactTable::getCount([], $cache);
		if ($contactsCount >= $limit)
		{
			return true;
		}

		$companiesCount = CompanyTable::getCount([], $cache);

		return $companiesCount >= $limit;
	}

	private function getEntityItemsCountLimit(): int
	{
		return (int)Option::get('crm', self::ENTITY_ITEMS_COUNT_LIMIT_OPTION_NAME, self::ENTITY_ITEMS_COUNT_LIMIT);
	}
}
