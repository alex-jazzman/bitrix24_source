<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/** @var array $arResult */
global $APPLICATION;

Extension::load([
	'crm.config.measure-grid',
]);

$measureGridOptions = [
	'gridId' => (string)$arResult['GRID_ID'],
	'componentName' => (string)$this->getComponent()->getName(),
	'editUrlTemplate' => (string)$arResult['PATH_TO_MEASURE_EDIT'],
	'isSlider' => (bool)$arResult['IS_SIDE_PANEL'],
];

?>
<div data-testid="crm-measure-list-root">
	<?php
	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		$arResult['grid'],
	);
	?>
</div>
<script>
	BX.ready(() => {
		BX.Crm.Config.MeasureGrid.create(<?= Json::encode($measureGridOptions) ?>);
	});
</script>
