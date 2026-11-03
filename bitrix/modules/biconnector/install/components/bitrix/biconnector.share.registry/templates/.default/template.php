<?php

/**
 * Bitrix vars
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var CBitrixComponent $component
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Grid\Component\ComponentParams;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

$APPLICATION->SetTitle(Loc::getMessage('BICONNECTOR_SHARE_REGISTRY_PAGE_TITLE'));

if (!empty($arResult['ERROR_MESSAGES']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => $arResult['ERROR_MESSAGES'][0],
		]
	);

	return;
}

Extension::load([
	'biconnector.share-registry',
	'biconnector.grid',
	'main.ui.filter',
	'ui.hint',
	'ui.icon-set.actions',
	'ui.icon-set.main',
	'ui.label',
]);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'pagetitle-toolbar-field-view');

/** @var \Bitrix\BIConnector\Internal\Grid\ShareRegistry\ShareRegistryGrid $grid */
$grid = $arResult['GRID'];

$gridParams = [
	'CURRENT_PAGE' => $grid->getPagination()?->getCurrentPage(),
	'SHOW_PAGESIZE' => false,
];
if (!empty($arResult['GRID_STUB']))
{
	$gridParams['STUB'] = $arResult['GRID_STUB'];
}
?>
<div class="ui-icon-set__scope">
<?php
$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	ComponentParams::get($grid, $gridParams)
);
?>
</div>
<script>
	BX.ready(() => {
		BX.BIConnector.ShareRegistry.GridManager.Instance = new BX.BIConnector.ShareRegistry.GridManager(<?= Json::encode([
			'gridId' => $grid->getId(),
		]) ?>);
	});
</script>
