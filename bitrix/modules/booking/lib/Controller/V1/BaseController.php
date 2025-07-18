<?php

declare(strict_types=1);

namespace Bitrix\Booking\Controller\V1;

use Bitrix\Main;
use Bitrix\Main\Loader;

abstract class BaseController extends Main\Engine\JsonController
{
	public function getDefaultPreFilters()
	{
		$prefilters = [
			...parent::getDefaultPreFilters(),
			new Main\Engine\ActionFilter\Scope(Main\Engine\ActionFilter\Scope::AJAX),
		];

		if (Loader::includeModule('intranet'))
		{
			$prefilters[] = new \Bitrix\Intranet\ActionFilter\IntranetUser();
		}

		return $prefilters;
	}
}
