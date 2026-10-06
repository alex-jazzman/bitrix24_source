<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 * @var CMain $APPLICATION
 */

use Bitrix\BIConnector\Integration\Superset\SupersetInitializer;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Loader::includeModule('biconnector');

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

Loader::includeModule('ui');

CJSCore::Init(['spotlight']);

Extension::load([
	'biconnector.aha-moment',
	'biconnector.apache-superset-analytics',
	'biconnector.dashboard-parameters-selector',
	'ui.entity-editor',
	'ui.entity-selector',
	'ui.icon-set.outline',
	'ui.forms',
	'ui.hint',
	'ui.notification',
	'ui.text-editor',
	'ui.uploader.core',
	'ui.uploader.tile-widget',
]);

Toolbar::deleteFavoriteStar();
$APPLICATION->setTitle(htmlspecialcharsbx($arResult['TITLE']));

$isEditMode = !empty($arResult['SETTINGS']['isEditMode']);
if (!$isEditMode && SupersetInitializer::isSupersetExist())
{
	Toolbar::addButton(
		new \Bitrix\UI\Buttons\Button([
			'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
			'size' => \Bitrix\UI\Buttons\Size::MEDIUM,
			'icon' => \Bitrix\UI\Buttons\Icon::DOTS,
			'className' => 'dashboard-edit-more-btn',
			'dataset' => [
				'testid' => 'biconnector-dashboard-edit-more-button',
			],
			'click' => new \Bitrix\UI\Buttons\JsCode('BX.BIConnector.SupersetDashboardEditManager.Instance.onMoreButtonClick();'),
		])
	);
}

$settings = $arResult['SETTINGS'];
$settings['emptyCoverIconPath'] = $templateFolder . '/images/icon_empty.png';

?>

<div class="dashboard-edit-container" data-testid="biconnector-dashboard-edit-form">
	<form id='dashboard-edit-form' name='dashboard-edit-form'></form>
	<?php
	$buttons = [
		[
			'TYPE' => 'save',
			'ONCLICK' => 'BX.BIConnector.SupersetDashboardEditManager.Instance.onClickSave(); return false;',
			'ID' => 'dashboard-button-save'
		],
		'cancel'
	];
	$APPLICATION->IncludeComponent(
		'bitrix:ui.button.panel',
		'',
		[
			'BUTTONS' => $buttons,
			'ALIGN' => 'center'
		],
		false
	);
	?>
</div>

<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		BX.BIConnector.SupersetDashboardEditManager.Instance =
			new BX.BIConnector.SupersetDashboardEditManager(<?= Json::encode($settings) ?>);
	});
</script>
