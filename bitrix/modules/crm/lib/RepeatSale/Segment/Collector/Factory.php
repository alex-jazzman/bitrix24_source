<?php

namespace Bitrix\Crm\RepeatSale\Segment\Collector;

use Bitrix\Crm\RepeatSale\Segment\SystemSegmentCode;
use Bitrix\Crm\Traits\Singleton;

final class Factory
{
	use Singleton;

	public function getCollector(?SystemSegmentCode $segmentCode): ?BaseCollector
	{
		if ($segmentCode === SystemSegmentCode::DEAL_LOST_MORE_12_MONTH)
		{
			return LastDealLostMoreThan12MonthAgoCollector::getInstance();
		}

		if ($segmentCode === SystemSegmentCode::DEAL_LAST_ACTIVITY_LESS_12_MONTH)
		{
			return LastActivityLessThen12MonthButNoActiveDealsCollector::getInstance();
		}

		if ($segmentCode === SystemSegmentCode::DEAL_EVERY_YEAR)
		{
			return DealEveryYearCollector::getInstance();
		}

		if ($segmentCode === SystemSegmentCode::DEAL_EVERY_HALF_YEAR)
		{
			return DealEveryHalfYearCollector::getInstance();
		}

		if ($segmentCode === SystemSegmentCode::DEAL_EVERY_MONTH)
		{
			return DealEveryMonthCollector::getInstance();
		}

		return null;
	}
}
