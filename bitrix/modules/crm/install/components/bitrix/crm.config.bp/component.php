<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Restriction\AvailabilityManager;
use Bitrix\Crm\Service\UserPermissions\ConfigurationCallSite;
use Bitrix\Crm\Service\UserPermissions\ConfigurationScope;

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

$isSettingsHub = ($arParams['IS_SETTINGS_HUB'] ?? null) === true;
$arParams['ENABLE_CONTROL_PANEL'] = ($arParams['ENABLE_CONTROL_PANEL'] ?? true) !== false;

if ($isSettingsHub)
{
	$request = \Bitrix\Main\Context::getCurrent()->getRequest();
	foreach ([$request->getQuery('back_url'), $request->getPost('back_url')] as $backUrl)
	{
		if ($backUrl !== null && $backUrl !== '')
		{
			ShowError(GetMessage('CRM_PERMISSION_DENIED'));

			return;
		}
	}

	$mode = $arParams['MODE'] ?? 'entity_list';
	$componentPage = match ($mode)
	{
		'list' => 'bp_list',
		'edit' => 'bp_edit',
		default => 'entity_list',
	};
	$arVariables = [
		'mode' => $mode,
		'entity_id' => $arParams['BP_ENTITY_ID'] ?? '',
		'bp_id' => $arParams['BP_BP_ID'] ?? 0,
	];

	$url = new \Bitrix\Main\Web\Uri($arParams['SETTINGS_HUB_URL']);
	$url->addParams([
		'IFRAME' => 'Y',
		'IFRAME_TYPE' => 'SIDE_SLIDER',
	]);
	$arUrlTemplates = ['entity_list' => $url->getUri()];
	foreach (['list', 'edit'] as $page)
	{
		$pageUrl = clone $url;
		$pageUrl->addParams(['mode' => $page]);
		$arUrlTemplates['bp_' . $page] = $pageUrl->getUri() . '&entity_id=#entity_id#';
	}
	$arUrlTemplates['bp_edit'] .= '&bp_id=#bp_id#';

	$arResult = [
		'FOLDER' => '',
		'URL_TEMPLATES' => $arUrlTemplates,
		'VARIABLES' => $arVariables,
		'ALIASES' => [],
	];
}
elseif ($arParams['SEF_MODE'] == 'Y')
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

$requestedEntityId = $isSettingsHub
	? ($arVariables['entity_id'] ?? null)
	: ($_REQUEST['entity_id'] ?? $arVariables['entity_id'] ?? null);
$scope = ConfigurationScope::ofCrm();
if (
	$componentPage !== 'entity_list'
	&& is_string($requestedEntityId)
	&& preg_match('/^CRM_DYNAMIC_(\d+)$/D', $requestedEntityId, $matches)
)
{
	$scope = ConfigurationScope::ofEntityType((int)$matches[1]);
}
$canManageTemplates = \Bitrix\Crm\Service\Container::getInstance()
	->getUserPermissions()
	->configuration()
	->canManageBizprocTemplates(ConfigurationCallSite::BizprocTemplateComponent, $scope)
;
if (!$canManageTemplates)
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

$this->IncludeComponentTemplate($componentPage);
