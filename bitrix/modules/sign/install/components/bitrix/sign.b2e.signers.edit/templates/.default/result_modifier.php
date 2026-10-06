<?php

use Bitrix\Main\Grid\Export\ExcelExporter;
use Bitrix\Main\Context;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;
use Bitrix\UI\Buttons\JsCode;
use Bitrix\UI\Buttons\SettingsButton;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loc::loadMessages(__FILE__);

/**
 * @var array $arResult
 */

$exportUri = new Uri(Context::getCurrent()->getRequest()->getRequestUri());
$exportUri->deleteParams([
	ExcelExporter::REQUEST_PARAM_NAME,
	'ncc',
	'exportSelectedIds',
]);
$arResult['EXPORT_URL'] = (string)$exportUri;
$arResult['EXPORT_ONCLICK'] = "(new BX.Sign.V2.Grid.B2e.Signers()).exportToExcel('" . CUtil::JSEscape($arResult['EXPORT_URL']) . "')";

$listId = (int)($arResult['LIST_ID'] ?? 0);
$hasSigners = (bool)($arResult['HAS_SIGNERS'] ?? false);

$menuItems = [];

// the action set over the whole group is fully decided by the component; here only its phrases
// are resolved. A handler stays a JsCode: a raw string would be escaped as JSON and broken
foreach ($arResult['GROUP_ACTIONS'] ?? [] as $action)
{
	$menuItem = [
		'text' => Loc::getMessage($action['phrase']),
		'onclick' => new JsCode($action['handler']),
	];
	foreach (['id', 'className', 'dataset'] as $optionalKey)
	{
		if (isset($action[$optionalKey]))
		{
			$menuItem[$optionalKey] = $action[$optionalKey];
		}
	}

	$menuItems[] = $menuItem;
}

// a delimiter is drawn only above visible group actions: for an empty group they are all hidden
if ($menuItems !== [] && $hasSigners)
{
	$menuItems[] = ['delimiter' => true];
}

$menuItems[] = [
	'text' => Loc::getMessage('SIGN_B2E_SIGNERS_EDIT_EXPORT_TO_EXCEL'),
	'onclick' => new JsCode($arResult['EXPORT_ONCLICK']),
	'dataset' => ['testId' => 'sign-b2e-signers-edit-export-menu-item'],
];

$arResult['TOOLBAR_MENU'] = (new SettingsButton())
	->addDataAttribute('test-id', 'sign-b2e-signers-edit-export-settings')
	->setDataRole("signers-settings-button-{$listId}")
	->setMenu([
		'items' => $menuItems,
	]);
