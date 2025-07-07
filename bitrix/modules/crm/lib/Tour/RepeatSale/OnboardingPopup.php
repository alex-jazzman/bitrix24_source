<?php

namespace Bitrix\Crm\Tour\RepeatSale;

use Bitrix\Crm\RepeatSale\FlowController;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Tour\Base;
use Bitrix\Main\Type\DateTime;

final class OnboardingPopup extends Base
{
	protected const OPTION_NAME = 'repeat-sale-onboarding-popup';

	protected function canShow(): bool
	{
		if ($this->isUserSeenTour())
		{
			return false;
		}

		$availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();

		return
			$availabilityChecker->isEnabled()
			&& $availabilityChecker->isItemsCountsLessThenLimit()
			&& FlowController::getInstance()->getEnableDate() === null
		;
	}

	protected function getShowDeadline(): ?DateTime
	{
		return new DateTime('01.10.2025', 'd.m.Y');
	}

	protected function getPortalMaxCreatedDate(): ?DateTime
	{
		return new DateTime('01.06.2025', 'd.m.Y');
	}

	protected function getComponentTemplate(): string
	{
		return 'repeat_sale_onboarding';
	}
}
