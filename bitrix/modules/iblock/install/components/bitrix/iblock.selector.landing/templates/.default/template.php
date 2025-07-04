<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @global CMain $APPLICATION
 * @var array $arParams
 * @var array $arResult
 * @var IblockElement $component
 * @var CBitrixComponentTemplate $this
 * @var string $templateName
 * @var string $componentPath
 * @var string $templateFolder
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Loader::includeModule('ui');

$settings = $arResult['SETTINGS'];

if ($settings['FILTER']['PAGETITLE'] === 'Y')
{
	Toolbar::addFilter($arResult['FILTER']);
}
else
{
	$APPLICATION->includeComponent(
		'bitrix:main.ui.filter',
		'',
		$arResult['FILTER'],
		$component,
		['HIDE_ICONS' => true]
	);
}

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$arResult['GRID'],
	$component,
	['HIDE_ICONS' => true]
);

$APPLICATION->IncludeComponent(
	'bitrix:ui.button.panel',
	'',
	[
		//'ID' => ''
		'BUTTONS' => [
			['TYPE' => 'save'],
			['TYPE' => 'cancel']
		],
		'ALIGN' => 'center'
	],
	$component,
	['HIDE_ICONS' => true]
);

$filterSettings = [
	'defaultFilter' => ($settings['FILTER']['DEFAULT'] ?? []),
	'internalFilter' => ($settings['FILTER']['INTERNAL'] ?? []),
	'useQuickSearch' => !$arResult['FILTER']['DISABLE_SEARCH']
];
if ($filterSettings['useQuickSearch'])
{
	$filterSettings['quickSearchField'] = [
		'field' => (string)$settings['FILTER']['QUICK_SEARCH_FIELD']['FIELD'],
		'name' => (string)$settings['FILTER']['QUICK_SEARCH_FIELD']['NAME']
	];
}
?>
<script>
	BX.ready(function() {
		BX.IblockSelectorLanding.create(
			'<?= \CUtil::jsEscape($arResult['FILTER']['FILTER_ID']) ?>',
			<?= Json::encode($filterSettings) ?>
		);
	});
</script>
<?php
unset($settings);
