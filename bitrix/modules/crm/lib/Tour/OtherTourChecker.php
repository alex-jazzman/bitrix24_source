<?php

namespace Bitrix\Crm\Tour;

use CUserOptions;

trait OtherTourChecker
{
	private function isUserSeenOtherTour(Base $tour, string $category): bool
	{
		$option = CUserOptions::GetOption($category, $tour->getOptionName(), []);

		return isset($option['closed']) && $option['closed'] === 'Y';
	}
}
