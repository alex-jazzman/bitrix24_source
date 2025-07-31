<?php

use Bitrix\Intranet\Enum\UserAgentType;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Context;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

class IntranetMobilePopup extends \CBitrixComponent
{
	/**
	 * Default exclusion where the popup will not be displayed, which will be interrupted by the option
	 */
	public const EXCLUDED_REGIONS = 'br';

	public function executeComponent()
	{
		//only mobile
		$request = Context::getCurrent()->getRequest();
		$clientType = UserAgentType::fromRequest($request);
		$this->arResult['isMobile'] = $clientType === UserAgentType::MOBILE_APP;

		//installation will be from the controller side
		$excludedRegionsForMobilePopup = Option::get('intranet', 'excludedRegionsForMobilePopup', null);

		$exclude = IntranetMobilePopup::EXCLUDED_REGIONS;
		if (!is_null($excludedRegionsForMobilePopup) && strlen($excludedRegionsForMobilePopup) > 0)
		{
			$exclude = $excludedRegionsForMobilePopup;
		}
		//if we store an empty list, then there are no restrictions
		else if ($excludedRegionsForMobilePopup === '')
		{
			$exclude = null;
		}

		$region = Application::getInstance()->getLicense()->getRegion();
		if (!is_null($exclude) && str_contains($exclude, $region))
		{
			return;
		}

		$this->includeComponentTemplate();
	}
}
