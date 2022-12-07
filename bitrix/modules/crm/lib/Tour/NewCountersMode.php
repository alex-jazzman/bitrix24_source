<?php

namespace Bitrix\Crm\Tour;

use Bitrix\Main\Localization\Loc;

class NewCountersMode extends Base
{
	use OtherTourChecker;

	public const OPTION_NAME = 'new-counters-mode';

	protected function canShow(): bool
	{
		return
			$this->isTourAvailable()
			&& $this->isUserSeenOtherTour(ActivityViewMode::getInstance(), self::OPTION_CATEGORY)
		;
	}

	protected function getSteps(): array
	{
		return [
			[
				'id' => 'step-new-counters',
				'title' => Loc::getMessage('CRM_TOUR_NEW_COUNTERS_TITLE'),
				'text' => Loc::getMessage('CRM_TOUR_NEW_COUNTERS_TEXT'),
				'useDynamicTarget' => true,
				'eventName' => 'BX.Crm.EntityCounterPanel::onShowNewCountersTour',
			],
		];
	}
}
