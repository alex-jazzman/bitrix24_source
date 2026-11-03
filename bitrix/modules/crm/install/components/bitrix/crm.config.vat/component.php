<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

$arParams['ENABLE_CONTROL_PANEL'] = ($arParams['ENABLE_CONTROL_PANEL'] ?? true) !== false;
$arParams['IS_SETTINGS_HUB'] = is_string($arParams['SETTINGS_HUB_URL'] ?? null)
	&& $arParams['SETTINGS_HUB_URL'] !== '';

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

if(!CAllCrmInvoice::installExternalEntities())
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

if (!\Bitrix\Catalog\Access\AccessController::getCurrent()->check(\Bitrix\Catalog\Access\ActionDictionary::ACTION_VAT_EDIT))
{
	$this->IncludeComponentTemplate('vat_error');
	return;
}

global $APPLICATION;

$componentPage = '';
$arDefaultUrlTemplates404 = array(
	'vat_list' => '',
	'vat_add' => 'add/',
	'vat_edit' => 'edit/#vat_id#/',
	'vat_show' => 'show/#vat_id#/'
);

if ($arParams['IS_SETTINGS_HUB'])
{
	$componentPage = match ($arParams['MODE'] ?? 'list')
	{
		'add' => 'vat_add',
		'edit' => 'vat_edit',
		'show' => 'vat_show',
		default => 'vat_list',
	};
	$arVariables = ['vat_id' => (int)($arParams['VAT_ID'] ?? 0)];
	$arVariableAliases = [];

	$url = new \Bitrix\Main\Web\Uri($arParams['SETTINGS_HUB_URL']);
	$arResult['PATH_TO_VAT_LIST'] = $url->getUri();
	$addUrl = clone $url;
	$addUrl->addParams(['add' => '']);
	$arResult['PATH_TO_VAT_ADD'] = $addUrl->getUri();
	$editUrl = clone $url;
	$editUrl->addParams(['edit' => '']);
	$arResult['PATH_TO_VAT_EDIT'] = $editUrl->getUri() . '&vat_id=#vat_id#';
	$showUrl = clone $url;
	$showUrl->addParams(['show' => '']);
	$arResult['PATH_TO_VAT_SHOW'] = $showUrl->getUri() . '&vat_id=#vat_id#';
}
elseif ($arParams['SEF_MODE'] === 'Y')
{
	$arDefaultVariableAliases404 = array();
	$arComponentVariables = array('vat_id');
	$arVariables = array();
	$arUrlTemplates = CComponentEngine::MakeComponentUrlTemplates($arDefaultUrlTemplates404, $arParams['SEF_URL_TEMPLATES']);
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases($arDefaultVariableAliases404, $arParams['VARIABLE_ALIASES']);
	$componentPage = CComponentEngine::ParseComponentPath($arParams['SEF_FOLDER'], $arUrlTemplates, $arVariables);

	if (!(is_string($componentPage) && isset($componentPage[0]) && isset($arDefaultUrlTemplates404[$componentPage])))
	{
		$componentPage = 'vat_list';
	}

	CComponentEngine::InitComponentVariables($componentPage, $arComponentVariables, $arVariableAliases, $arVariables);

	foreach ($arUrlTemplates as $url => $value)
	{
		$key = 'PATH_TO_'.mb_strtoupper($url);
		$arResult[$key] = isset($arParams[$key][0]) ? $arParams[$key] : $arParams['SEF_FOLDER'].$value;
	}
}
else
{
	$arComponentVariables = array(
		isset($arParams['VARIABLE_ALIASES']['vat_id']) ? $arParams['VARIABLE_ALIASES']['vat_id'] : 'vat_id'
	);

	$arDefaultVariableAliases = array(
		'vat_id' => 'vat_id'
	);
	$arVariables = array();
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases($arDefaultVariableAliases, $arParams['VARIABLE_ALIASES']);
	CComponentEngine::InitComponentVariables(false, $arComponentVariables, $arVariableAliases, $arVariables);

	$componentPage = 'vat_list';
	if (isset($_REQUEST['edit']))
	{
		$componentPage = 'vat_edit';
	}
	elseif (isset($_REQUEST['show']))
	{
		$componentPage = 'vat_show';
	}
	elseif (isset($_REQUEST['add']))
	{
		$componentPage = 'vat_add';
	}

	$curPage = $APPLICATION->GetCurPage();

	$arResult['PATH_TO_VAT_LIST'] = $curPage;
	$arResult['PATH_TO_VAT_ADD'] = $curPage.'?add';
	$arResult['PATH_TO_VAT_EDIT'] = $curPage.'?'.$arVariableAliases['vat_id'].'=#vat_id#&edit';
	$arResult['PATH_TO_VAT_SHOW'] = $curPage.'?'.$arVariableAliases['vat_id'].'=#vat_id#&show';
}

$arResult =
	array_merge(
		array(
			'VARIABLES' => $arVariables,
			'ALIASES' => $arParams['SEF_MODE'] == 'Y' ? array(): $arVariableAliases,
			'VAT_ID' => isset($arVariables['vat_id']) ? strval($arVariables['vat_id']) : ''
		),
		$arResult
	);

$this->IncludeComponentTemplate($componentPage);
?>
