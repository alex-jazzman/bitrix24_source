<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

global $APPLICATION;

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$isSidePanelRequest = $request->getQuery('IFRAME') === 'Y';
$isSidePanelWrapped = ($arParams['SIDE_PANEL_WRAPPED'] ?? 'N') === 'Y';

if ($isSidePanelRequest && !$isSidePanelWrapped)
{
	$popupComponentParams = $arParams;
	$popupComponentParams['SIDE_PANEL_WRAPPED'] = 'Y';

	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:crm.config.locations',
			'POPUP_COMPONENT_TEMPLATE_NAME' => $this->getTemplateName(),
			'POPUP_COMPONENT_PARAMS' => $popupComponentParams,
			'USE_UI_TOOLBAR' => 'Y',
		],
	);

	return;
}

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

$componentPage = '';
$arDefaultUrlTemplates404 = array(
	'locations_list' => '',
	'locations_add' => 'add/',
	'locations_edit' => 'edit/#loc_id#/',
	'locations_import' => 'import/',
);

if ($arParams['SEF_MODE'] === 'Y')
{
	$arDefaultVariableAliases404 = array();
	$arComponentVariables = array('loc_id');
	$arVariables = array();
	$arUrlTemplates = CComponentEngine::MakeComponentUrlTemplates($arDefaultUrlTemplates404, $arParams['SEF_URL_TEMPLATES'] ?? null);
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases($arDefaultVariableAliases404, $arParams['VARIABLE_ALIASES'] ?? null);
	$componentPage = CComponentEngine::ParseComponentPath($arParams['SEF_FOLDER'], $arUrlTemplates, $arVariables);

	if (!(is_string($componentPage) && isset($componentPage[0]) && isset($arDefaultUrlTemplates404[$componentPage])))
	{
		$componentPage = 'locations_list';
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
		isset($arParams['VARIABLE_ALIASES']['loc_id']) ? $arParams['VARIABLE_ALIASES']['loc_id'] : 'loc_id'
	);

	$arDefaultVariableAliases = array(
		'loc_id' => 'loc_id'
	);
	$arVariables = array();
	$arVariableAliases = CComponentEngine::MakeComponentVariableAliases($arDefaultVariableAliases, $arParams['VARIABLE_ALIASES']);
	CComponentEngine::InitComponentVariables(false, $arComponentVariables, $arVariableAliases, $arVariables);

	$componentPage = 'locations_list';
	if (isset($_REQUEST['edit']))
	{
		$componentPage = 'locations_edit';
	}

	$curPage = $APPLICATION->GetCurPage();

	$arResult['PATH_TO_LOCATIONS_LIST'] = $curPage;
	$arResult['PATH_TO_LOCATIONS_ADD'] = $curPage.'?add';
	$arResult['PATH_TO_LOCATIONS_EDIT'] = $curPage.'?'.$arVariableAliases['loc_id'].'=#loc_id#&edit';
	$arResult['PATH_TO_LOCATIONS_IMPORT'] = $curPage.'?import';
}

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$parentIdFromRequest =
	$request->getQuery('PARENT_ID') !== null
	&& !\Bitrix\Main\Grid\Context::isInternalRequest()
;

$arResult =
	array_merge(
		array(
			'VARIABLES' => $arVariables,
			'ALIASES' => $arParams['SEF_MODE'] == 'Y' ? array(): $arVariableAliases,
			'LOC_ID' => isset($arVariables['loc_id']) ? strval($arVariables['loc_id']) : '',
			'PARENT_ID' => max(0, (int)$request->getQuery('PARENT_ID')),
			'PARENT_ID_FROM_REQUEST' => $parentIdFromRequest,
			'SHOW_CONTROL_PANEL' => $request->getQuery('IFRAME') !== 'Y',
		),
		$arResult
	);

$this->IncludeComponentTemplate($componentPage);
?>
