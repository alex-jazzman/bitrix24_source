<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if (!CBXFeatures::IsFeatureEnabled('timeman') || !CModule::IncludeModule('timeman'))
{
	return false;
}

$toolId = \Bitrix\Timeman\Integration\Intranet\Settings::TOOLS['worktime'];
if (!(new \Bitrix\Timeman\Integration\Intranet\Settings())->isToolAvailable($toolId))
{
	$this->IncludeComponentTemplate('tool-disabled');

	return true;
}

if (CTimeMan::CanUse())
{
	if (abs(CTimeZone::GetOffset()) > BX_TIMEMAN_WRONG_DATE_CHECK)
	{
		$arResult['ERROR'] = 'WRONG_DATE';
		$this->IncludeComponentTemplate('error');
		return true;
	}

	$arResult['TASKS_ENABLED'] = CBXFeatures::IsFeatureEnabled('Tasks') && CModule::IncludeModule('tasks');

	$arResult['START_INFO'] = CTimeMan::GetRuntimeInfo(false);

	$obReportUser = new CUserReportFull;
	$arResult['WORK_REPORT'] = $obReportUser->GetReportData();

	CIntranetPlanner::initScripts($arResult['START_INFO']['PLANNER']);
	$arResult['START_INFO']['PLANNER'] = $arResult['START_INFO']['PLANNER']['DATA'];

	CJSCore::Init(array('timeman'));

	$this->IncludeComponentTemplate();
	return true;
}
return false;
?>
