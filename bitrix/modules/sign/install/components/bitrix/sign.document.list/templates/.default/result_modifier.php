<?php

use Bitrix\Main\Grid\Export\ExcelExporter;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Buttons\JsCode;
use Bitrix\UI\Buttons\SettingsButton;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 */

$arResult['TOOLBAR_MENU'] = null;

// Component types that have a server-side Excel export projection. Only these show
// the gear-menu "Export to Excel" item; the personal/current grids have no export
// path, so the item must not appear there (it used to render but did nothing).
$exportableTypes = ['document', 'safe'];
$gridType = (string)($arResult['GRID_TYPE'] ?? '');
$isExportableType = in_array($gridType, $exportableTypes, true);

if (
	$arResult['IS_EXCEL_EXPORT_AVAILABLE']
	&& !$arResult['IS_EXCEL_EXPORT_MODE']
	&& $isExportableType
)
{
	$exportItem = [
		'text' => Loc::getMessage('SIGN_DOCUMENT_LIST_TOOLBAR_EXPORT_TO_EXCEL'),
		// e2e handle: BX.Main.Menu applies the `dataset` map to the menu item node, so
		// this renders as data-testid on the gear-menu "Export to Excel" entry (both the
		// document link and the safe JsCode variant get it).
		'dataset' => ['testid' => 'sign-document-list-toolbar-export-to-excel'],
	];

	if ($gridType === 'safe')
	{
		// The company Safe routes the click through its grid controller so the current
		// row selection is added to the export (whole level otherwise). The handler is a
		// JsCode object, not a string: the toolbar button is re-created from its DOM node
		// by BX.UI.ButtonManager, whose #convertEventHandler accepts a function or a
		// `{code}` object and throws on a bare string. The code must not `return` - it is
		// run via eval() as a program, where a top-level return is a syntax error. No
		// `href` here: the menu item's click does not prevent the default, so an <a href>
		// would navigate on top of the handler and trigger a second, whole-level download.
		$gridId = \CUtil::JSEscape((string)$arResult['GRID_ID']);
		$exportItem['onclick'] = new JsCode(
			"(new BX.Sign.V2.Grid.B2e.Safe('{$gridId}')).exportToExcel();",
		);
	}
	else
	{
		// The document grid exports via a plain link: mode=excel on the current URL.
		$exportItem['href'] = (new ExcelExporter())->getControl()->getLink();
	}

	$arResult['TOOLBAR_MENU'] = (new SettingsButton())->setMenu([
		'items' => [
			$exportItem,
		],
	]);
}
