<?php

namespace Bitrix\Crm\RepeatSale;

use Bitrix\Crm\Feature;
use Bitrix\Crm\Restriction\RestrictionManager;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Config\Option;

class AvailabilityChecker
{
	public const SEGMENT_INITIALIZATION_OPTION_NAME = 'repeat_sale_segment_initialization';
	public const ENABLE_PENDING_OPTION_NAME = 'repeat_sale_enable_pending';

	public function isAvailable(): bool
	{
		return
			$this->isEnabled()
			&& !$this->isSegmentsInitializationProgress()
		;
	}

	public function isEnabled(): bool
	{
		$intranetToolManager = Container::getInstance()->getIntranetToolsManager();

		return
			Feature::enabled(Feature\RepeatSale::class)
			&& $intranetToolManager->checkRepeatSaleAvailability()
		;
	}

	public function isSegmentsInitializationProgress(): bool
	{
		return Option::get('crm', self::SEGMENT_INITIALIZATION_OPTION_NAME, 'N') === 'Y';
	}

	public function isEnablePending(): bool
	{
		return Option::get('crm', self::ENABLE_PENDING_OPTION_NAME, 'N') === 'Y';
	}

	public function hasPermission(): bool
	{
		return RestrictionManager::getRepeatSaleRestriction()->hasPermission();
	}
}
