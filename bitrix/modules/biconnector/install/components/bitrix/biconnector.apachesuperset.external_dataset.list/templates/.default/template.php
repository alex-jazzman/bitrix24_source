<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/**
 * @var CMain $APPLICATION
 * @var array $arResult
 */

Extension::load([
	'biconnector.grid',
	'biconnector.dataset-import-v2',
	'biconnector.error-message',
	'biconnector.file-export',
	'biconnector.loading-popup',
	'ui.hint',
	'ui.notification',
	'ui.buttons',
	'ui.icons',
	'ui.system.dialog',
]);

if (!empty($arResult['ERROR_MESSAGE']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => $arResult['ERROR_MESSAGE'],
		]
	);

	return;
}

?>

<div id="biconnector-external-dataset-grid">
	<?php

	$grid = $arResult['GRID'];

	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		\Bitrix\Main\Grid\Component\ComponentParams::get(
			$grid,
			[
				'CURRENT_PAGE' => $grid->getPagination()?->getCurrentPage(),
				'STUB' => $arResult['GRID_STUB'] ?? null,
			])
	);
	?>
</div>

<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		BX.BIConnector.ExternalDatasetManager.Instance = new BX.BIConnector.ExternalDatasetManager(<?= Json::encode([
			'gridId' => $grid?->getId(),
			'isAvailableGroupManagement' => (bool)($arResult['IS_AVAILABLE_GROUP_MANAGEMENT'] ?? false),
			'createMenuItems' => $arResult['CREATE_MENU_ITEMS'] ?? [],
			'isGroupLevelSelected' => (bool)($arResult['IS_GROUP_LEVEL_SELECTED'] ?? false),
		])?>);
	});
</script>
