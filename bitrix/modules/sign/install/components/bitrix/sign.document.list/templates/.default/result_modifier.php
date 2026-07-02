<?php

use Bitrix\Main\Grid\Export\ExcelExporter;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Buttons\SettingsButton;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 */

$arResult['TOOLBAR_MENU'] = null;

if (
	$arResult['IS_SHOW_TOOLBAR_FILTER']
	&& !$arResult['IS_EXCEL_EXPORT_MODE']
)
{
	$arResult['TOOLBAR_MENU'] = (new SettingsButton())->setMenu([
		'items' => [
			[
				'text' => Loc::getMessage('SIGN_DOCUMENT_LIST_TOOLBAR_EXPORT_TO_EXCEL'),
				'href' => (new ExcelExporter())->getControl()->getLink(),
			],
		],
	]);
}
