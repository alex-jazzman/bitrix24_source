<?php


namespace ITHive\ResourcesEmployee;


use Bitrix\Main\Localization\Loc;
use COption;

class Events
{

	const MODULE_ID = 'ithive.resourcesemployee';
	public static function OnBeforeTaskAddHandler(&$arFields){
		return self::checkRequiredFields($arFields);
	}

	public static function OnBeforeTaskUpdateHandler($ID, &$arFields){
		return self::checkRequiredFields($arFields);
	}

	private static function checkRequiredFields($arFields){
		if(!COption::GetOptionInt(self::MODULE_ID, 'required_fields')){
			return true;
		}
		if(
			empty($arFields['START_DATE_PLAN'])||
			empty($arFields['END_DATE_PLAN'])||
			(int)$arFields['TIME_ESTIMATE']<=0
		){
			global $APPLICATION;
			$APPLICATION->ThrowException(Loc::getMessage("REQUIRED_FIELDS_ERROR"), __METHOD__);
			return false;
		}
		return true;
	}
}