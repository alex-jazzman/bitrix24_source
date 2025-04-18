<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Restriction\AvailabilityManager;

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

$toolsManager = \Bitrix\Crm\Service\Container::getInstance()->getIntranetToolsManager();
$isAvailable = $toolsManager->checkBizprocAvailability();
if (!$isAvailable)
{
	print AvailabilityManager::getInstance()->getBizprocInaccessibilityContent();

	return;
}

if (!CModule::IncludeModule('bizproc') || !CBPRuntime::isFeatureEnabled())
{
	ShowError(GetMessage('BIZPROC_MODULE_NOT_INSTALLED'));
	return;
}

if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->isCrmAdmin())
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}


$arDefaultUrlTemplates404 = [
	'entity_list' => '',
	'bp_list' => '#entity_id#/',
	'bp_edit' => '#entity_id#/edit/#bp_id#/',
];

$arDefaultVariableAliases404 = [];

$arDefaultVariableAliases = [];

$arComponentVariables = [
	'bp_id',
	'entity_id',
	'mode',
];

if ($arParams['SEF_MODE'] == 'Y')
{
	$arVariables = [];

	$arUrlTemplates = CComponentEngine::MakeComponentUrlTemplates($arDefaultUrlTemplates404, $arParams['SEF_URL_TEMPLATES']);
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases($arDefaultVariableAliases404, $arParams['VARIABLE_ALIASES']);

	$componentPage = CComponentEngine::ParseComponentPath(
		$arParams['SEF_FOLDER'],
		$arUrlTemplates,
		$arVariables
	);

	if(!$componentPage)
	{
		$componentPage = 'entity_list';
	}

	CComponentEngine::InitComponentVariables($componentPage, $arComponentVariables, $arVariableAliases, $arVariables);
	$arResult = [
		'FOLDER' => $arParams['SEF_FOLDER'],
		'URL_TEMPLATES' => $arUrlTemplates,
		'VARIABLES' => $arVariables,
		'ALIASES' => $arVariableAliases
	];
}
else
{
	$arVariables = [];
	if(!isset($arParams['VARIABLE_ALIASES']['ID']))
	{
		$arParams['VARIABLE_ALIASES']['ID'] = 'ID';
	}

	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases(
		$arDefaultVariableAliases,
		$arParams['VARIABLE_ALIASES']
	);
	CComponentEngine::InitComponentVariables(
		false,
		$arComponentVariables,
		$arVariableAliases,
		$arVariables
	);

	$componentPage = 'entity_list'; //default page

	if(isset($arVariables['mode']))
	{
		switch($arVariables['mode'])
		{
			case 'edit':
				if(isset($arVariables['bp_id']))
				{
					$componentPage = 'bp_edit';
				}

				break;
			case 'list':
				$componentPage = 'bp_list';

				break;
		}
	}

	$arResult = [
		'FOLDER' => '',
		'URL_TEMPLATES' => [
			'entity_list' => $APPLICATION->GetCurPage(),
			'bp_edit' => $APPLICATION->GetCurPage()
				.'?'.$arVariableAliases['mode'].'=edit'
				.'&'.$arVariableAliases['entity_id'].'=#entity_id#'
				.'&'.$arVariableAliases['bp_id'].'=#bp_id#'
			,
			'bp_list' => $APPLICATION->GetCurPage()
				.'?'.$arVariableAliases['mode'].'=list'
				.'&'.$arVariableAliases['entity_id'].'=#entity_id#'
			,
		],
		'VARIABLES' => $arVariables,
		'ALIASES' => $arVariableAliases
	];
}

$this->IncludeComponentTemplate($componentPage);
