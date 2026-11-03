<?php

use Bitrix\BIConnector\Superset\Grid\UnusedElementsGrid;
use Bitrix\Main\Grid;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 * @var array $arResult
 */

Extension::load([
	'biconnector.error-message',
	'biconnector.grid',
	'ui.dialogs.messagebox',
	'ui.hint',
	'ui.notification',
]);

?>

<div id="biconnector-unused-elements-grid">
<?php

/** @var UnusedElementsGrid $grid */
$grid = $arResult['GRID'];

$params = Grid\Component\ComponentParams::get(
	$grid,
	[
		'CURRENT_PAGE' => $grid->getPagination()?->getCurrentPage(),
		'STUB' => $arResult['GRID_STUB'] ?? null,
		'SHOW_ACTION_PANEL' => false,
		'TOP_ACTION_PANEL_RENDER_TO' => '.ui-side-panel-toolbar',
		'TOP_ACTION_PANEL_PINNED_MODE' => false,
		'TOP_ACTION_PANEL_CLASS' => 'biconnector-unused-elements-action-panel',
		'ACTION_PANEL_OPTIONS' => [
				'MAX_HEIGHT' => 58,
			],
	],
);

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$params,
);
?>
</div>

<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		BX.BIConnector.UnusedElementsGridManager.Instance = new BX.BIConnector.UnusedElementsGridManager(<?= Json::encode([
			'gridId' => $grid?->getId(),
		])?>);
	});
</script>
