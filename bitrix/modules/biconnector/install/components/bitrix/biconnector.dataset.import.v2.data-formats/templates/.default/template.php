<?php

/**
 * Bitrix vars
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var CBitrixComponentTemplate $this
 */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

CModule::includeModule('biconnector');

if (!empty($arResult['ERROR_MESSAGES']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => $arResult['ERROR_MESSAGES'][0],
			'DESCRIPTION' => $arResult['ERROR_DESCRIPTIONS'][0] ?? null,
		]
	);

	return;
}

Extension::load([
	'ui.design-tokens',
	'ui.icon-set.outline',
	'biconnector.dataset-import-v2.data-formats',
]);

$APPLICATION->SetPageProperty('BodyClass', 'biconnector-dataset-import-v2-formats-page');
Toolbar::deleteFavoriteStar();
$APPLICATION->SetTitle(Loc::getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TITLE'));
?>
<div id="biconnector-dataset-import-v2-formats-root"></div>
<?php
$APPLICATION->IncludeComponent(
	'bitrix:ui.button.panel',
	'',
	[
		'BUTTONS' => [
			[
				'TYPE' => 'save',
				'ONCLICK' => "BX.Event.EventEmitter.emit('biconnector:dataset-import-v2:formats-save'); return false;",
				'ID' => 'biconnector-dataset-import-v2-formats-save',
			],
			'cancel',
		],
		'ALIGN' => 'left',
	],
	false
);
?>
<script>
	BX.ready(() => {
		const initialData = {
			current: <?= Json::encode($arResult['current']) ?>,
			templates: <?= Json::encode($arResult['templates']) ?>,
		};

		const app = BX.BIConnector.DatasetImportV2.DataFormatsAppFactory.getApp(initialData);
		if (app)
		{
			app.mount('#biconnector-dataset-import-v2-formats-root');
		}
	});
</script>
