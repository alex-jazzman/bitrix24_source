<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 * @var array $arResult
 * @var string $templateFolder
 * @var CMain $APPLICATION
 * @var CBitrixComponent $component
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Loader::includeModule('biconnector');
Loader::includeModule('ui');
$isMarketModuleInstalled = Loader::includeModule('market');

$extensions = [
	'main.core',
	'main.popup',
	'main.loader',
	'ui.buttons',
	'ui.icons',
	'ui.icon-set.actions',
	'ui.system.dialog',
	'ui.viewer',
	'ui.notification',
	'ui.hint',
	'im.public',
	'biconnector.apache-superset-dashboard-manager',
	'biconnector.apache-superset-analytics',
	'sidepanel',
];

if ($isMarketModuleInstalled)
{
	$extensions[] = 'ui.vue3';
	$extensions[] = 'market.rating-review';
	$extensions[] = 'market.rating-stars-input';
	$extensions[] = 'market.market-links';
}

Extension::load($extensions);

Toolbar::deleteFavoriteStar();

if (!empty($arResult['DASHBOARD_TITLE']))
{
	$APPLICATION->SetTitle(htmlspecialcharsbx($arResult['DASHBOARD_TITLE']));
}

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

$appNodeId = 'biconnector-dashboard-detail-info-app';
?>

<div id="<?=htmlspecialcharsbx($appNodeId)?>" style="position: relative; min-height: 620px;"></div>

<script>
	BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(() => {
		BX.BIConnector.ApacheSuperset.Dashboard.Detail.Info.create(<?= Json::encode([
			'appNodeId' => $appNodeId,
			'componentName' => $component->getName(),
			'dashboardId' => (int)($arParams['DASHBOARD_ID'] ?? 0),
			'dashboardListUrl' => '/bi/dashboard/',
			'imagesPath' => $templateFolder . '/images',
			'isMarketModuleInstalled' => $isMarketModuleInstalled,
			'canModifySettings' => (bool)($arResult['CAN_MODIFY_SETTINGS'] ?? false),
			'canDelete' => (bool)($arResult['CAN_DELETE'] ?? false),
		]) ?>);
	});
</script>
