<?php

namespace Bitrix\Crm\RepeatSale\Segment;

enum SystemSegmentCode: string
{
	case DEAL_LOST_MORE_12_MONTH = 'deal_lost_more_12_month';
	case DEAL_LAST_ACTIVITY_LESS_12_MONTH = 'deal_activity_less_12_month';
	case DEAL_EVERY_YEAR = 'deal_every_year';
	case DEAL_EVERY_HALF_YEAR = 'deal_every_half_year';
	case DEAL_EVERY_MONTH = 'deal_every_month_year';
}
