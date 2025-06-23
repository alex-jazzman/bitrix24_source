<?php

namespace Bitrix\Crm\RepeatSale;

use Bitrix\Crm\Traits\Singleton;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Type\DateTime;

final class FlowController
{
	use Singleton;

	public const FLOW_ENABLE_DATE_OPTION_NAME = 'repeat_sale_flow_enable_date';

	public function saveEnableDate(): void
	{
		$now = (new DateTime())->disableUserTime();
		Option::set('crm', self::FLOW_ENABLE_DATE_OPTION_NAME, $now->toString());
	}

	public function getEnableDate(): ?DateTime
	{
		$date = Option::get('crm', self::FLOW_ENABLE_DATE_OPTION_NAME, null);

		return $date ? DateTime::createFromText($date) : null;
	}
}
