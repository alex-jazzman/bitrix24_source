<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Restriction\AvailabilityManager;
use Bitrix\Crm\Restriction\RestrictionManager;
use Bitrix\Crm\Service\Container;

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

$toolsManager = \Bitrix\Crm\Service\Container::getInstance()->getIntranetToolsManager();
$isAvailable = $toolsManager->checkCrmAvailability();
if (!$isAvailable)
{
	print AvailabilityManager::getInstance()->getCrmInaccessibilityContent();

	return;
}

if(!CAllCrmInvoice::installExternalEntities())
	return;
if(!CCrmQuote::LocalComponentCausedUpdater())
	return;

if (!CModule::IncludeModule('currency'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_CURRENCY'));
	return;
}
if (!CModule::IncludeModule('catalog'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_CATALOG'));
	return;
}
if (!CModule::IncludeModule('sale'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_SALE'));
	return;
}

/** @var array $arParams */
/** @global CMain $APPLICATION */
global $APPLICATION;

$arDefaultUrlTemplates404 = array(
	'index' => 'index.php',
	'report' => 'report/',
	'construct' => 'construct/#report_id#/#action#/',
	'view' => 'view/#report_id#/'
);

$arDefaultVariableAliases404 = array(

);
$arDefaultVariableAliases = array();
$componentPage = '';
$arComponentVariables = array('report_id', 'action');

$arResult['NAME_TEMPLATE'] =
	empty($arParams['NAME_TEMPLATE'])
		? CSite::GetNameFormat(false)
		: str_replace(array("#NOBR#","#/NOBR#"), array("",""), $arParams["NAME_TEMPLATE"])
;

if ($arParams['SEF_MODE'] === 'Y')
{
	$arVariables = array();
	$arUrlTemplates = CComponentEngine::MakeComponentUrlTemplates(
		$arDefaultUrlTemplates404,
		$arParams['SEF_URL_TEMPLATES']
	);
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases(
		$arDefaultVariableAliases404,
		$arParams['VARIABLE_ALIASES']
	);
	$componentPage = CComponentEngine::ParseComponentPath($arParams['SEF_FOLDER'], $arUrlTemplates, $arVariables);

	if (empty($componentPage) || (!array_key_exists($componentPage, $arDefaultUrlTemplates404)))
		$componentPage = 'index';

	CComponentEngine::InitComponentVariables($componentPage, $arComponentVariables, $arVariableAliases, $arVariables);

	foreach ($arUrlTemplates as $url => $value)
	{
		$index = 'PATH_TO_REPORT_' . mb_strtoupper($url);
		if (!isset($arParams[$index]) || $arParams[$index] === '')
		{
			$arResult[$index] = $arParams['SEF_FOLDER'] . $value;
		}
		else
		{
			$arResult[$index] = $arParams['PATH_TO_' . mb_strtoupper($url)];
		}
	}
}
else
{
	$arComponentVariables[] = $arParams['VARIABLE_ALIASES']['report_id'];
	$arComponentVariables[] = $arParams['VARIABLE_ALIASES']['action'];

	$arVariables = array();
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases(
		$arDefaultVariableAliases, $arParams['VARIABLE_ALIASES']
	);
	CComponentEngine::InitComponentVariables(false, $arComponentVariables, $arVariableAliases, $arVariables);

	$componentPage = 'index';
	if (isset($_REQUEST['report']))
		$componentPage = 'report';
	else if (isset($_REQUEST['construct']))
		$componentPage = 'construct';
	else if (isset($_REQUEST['view']))
		$componentPage = 'view';

	$arResult['PATH_TO_REPORT_REPORT'] = $APPLICATION->GetCurPage();
	$arResult['PATH_TO_REPORT_CONSTRUCT'] = $APPLICATION->GetCurPage()."?report_id=#report_id#&action=#action#";
	$arResult['PATH_TO_REPORT_VIEW'] = $APPLICATION->GetCurPage()."?report_id=#report_id#";
}

if (!RestrictionManager::getReportRestriction()->hasPermission())
{
	$componentPage = 'restrictions';
}

$arResult = array_merge(
	array(
		'VARIABLES' => $arVariables,
		'ALIASES' => $arParams['SEF_MODE'] == 'Y'? array(): $arVariableAliases,
		'ELEMENT_ID' => $arParams['ELEMENT_ID'] ?? 0,
		'PATH_TO_LEAD_EDIT' => $arParams['PATH_TO_LEAD_EDIT'] ?? '',
		'PATH_TO_LEAD_SHOW' => $arParams['PATH_TO_LEAD_SHOW'] ?? '',
		'PATH_TO_LEAD_CONVERT' => $arParams['PATH_TO_LEAD_CONVERT'] ?? '',
		'PATH_TO_DEAL_EDIT' => $arParams['PATH_TO_DEAL_EDIT'] ?? '',
		'PATH_TO_DEAL_SHOW' => $arParams['PATH_TO_DEAL_SHOW'] ?? '',
		'PATH_TO_CONTACT_EDIT' => $arParams['PATH_TO_CONTACT_EDIT'] ?? '',
		'PATH_TO_CONTACT_SHOW' => $arParams['PATH_TO_CONTACT_SHOW'] ?? '',
		'PATH_TO_COMPANY_EDIT' => $arParams['PATH_TO_COMPANY_EDIT'] ?? '',
		'PATH_TO_COMPANY_SHOW' => $arParams['PATH_TO_COMPANY_SHOW'] ?? '',
		'PATH_TO_USER_PROFILE' => $arParams['PATH_TO_USER_PROFILE'] ?? ''
	),
	$arResult
);

$toolsManager = Container::getInstance()->getIntranetToolsManager();
$isAvailable = $toolsManager->checkReportsConstructAvailability();
if (!$isAvailable)
{
	$componentPage = 'disabled';
}

$this->IncludeComponentTemplate($componentPage);