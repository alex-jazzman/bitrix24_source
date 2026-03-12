<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Superset\Import\DashboardReimportService;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\BIConnector\Manager;
use Bitrix\BIConnector\Services\ApacheSuperset;

/**
 * @var CMain $APPLICATION
 * @var array $arResult
 */

$APPLICATION->SetTitle(Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_LIST_TITLE'));

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

if (\Bitrix\Main\Loader::includeModule('pull'))
{
	global $USER;
	\CPullWatch::Add($USER->getId(), "superset_dashboard", true);
}

if (Manager::isAdmin())
{
	echo DashboardReimportService::getHtml();
}

Extension::load([
	'biconnector.apache-superset-dashboard-manager',
	'biconnector.apache-superset-market-manager',
	'biconnector.apache-superset-analytics',
	'biconnector.dashboard-export-master',
	'ui.dialogs.messagebox',
	'ui.hint',
	'ui.buttons',
	'pull.client',
	'ui.icons',
	'ui.icon-set.actions',
	'ui.feedback.form',
	'ui.alerts',
	'ui.tour',
	'ui.switcher',
	'ui.entity-selector',
	'spotlight',
	'ui.system.dialog',
]);

if ($arResult['SHOW_DELETE_INSTANCE_WARNING']):
?>
<div class="ui-alert ui-alert-danger">
	<span class="ui-alert-message">
		<?= Loc::getMessage(
			'BICONNECTOR_SUPERSET_DASHBOARD_GRID_LOCK_NOTIFICATION_MSGVER_1',
			[
				'[link]' => "<a href=\"{$arResult['OPEN_SETTINGS_LINK']}\" target='_blank'>",
				'[/link]' => '</a>',
			],
		) ?>
	</span>
</div>
<?php endif; ?>

<?php if ($arResult['SHOW_SECOND_DB_CONNECTION']): ?>
	<div class="ui-alert ui-alert-warning">
		<span class="ui-alert-message">
			<?= Loc::getMessage(
				'BICONNECTOR_SUPERSET_DASHBOARD_GRID_SECOND_DB_CONNECT_INFO',
				[
					'[link]' => "<a href=\"{$arResult['SECOND_DB_LINK_HELP']}\" target='_blank'>",
					'[/link]' => '</a>',
				],
			)?>
		</span>
	</div>
<?php elseif ($arResult['SHOW_SECOND_DB_KEY_UPDATE']): ?>
	<div class="ui-alert ui-alert-warning">
		<span class="ui-alert-message">
			<?= Loc::getMessage(
				'BICONNECTOR_SUPERSET_DASHBOARD_GRID_SECOND_DB_CONNECT_KEY_UPDATE',
				[
					'[link]' => "<a href=\"{$arResult['SECOND_DB_LINK_HELP']}\" target='_blank'>",
					'[/link]' => '</a>',
				],
			)?>
		</span>
	</div>
<?php endif; ?>

<div id="biconnector-dashboard-grid">
<?php

/** @var \Bitrix\Main\Grid\Grid $grid */
$grid = $arResult['GRID'];

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	\Bitrix\Main\Grid\Component\ComponentParams::get($grid, [
		'CURRENT_PAGE' => $grid->getPagination()?->getCurrentPage(),
	])
);

$limitManager = \Bitrix\BIConnector\LimitManager::getInstance();
$limitManager->setService(Manager::getInstance()->createService(ApacheSuperset::getServiceId()));

if ($limitManager->isLimitByLicence() && !$limitManager->checkLimitWarning())
{
	$APPLICATION->IncludeComponent('bitrix:biconnector.limit.lock', '', [
		'SUPERSET_LIMIT' => 'Y',
	]);
}

?>
</div>

<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		BX.BIConnector.SupersetDashboardGridManager.Instance = new BX.BIConnector.SupersetDashboardGridManager(<?= Json::encode([
			'gridId' => $grid?->getId(),
			'isNeedShowDraftGuide' => $arResult['NEED_SHOW_DRAFT_GUIDE'] ?? false,
			'isAvailableDashboardCreation' => $arResult['IS_AVAILABLE_DASHBOARD_CREATION'] ?? false,
			'isAvailableGroupCreation' => $arResult['IS_AVAILABLE_GROUP_CREATION'] ?? false,
			'isMarketExists' => $arParams['IS_MARKET_EXISTS'] ?? false,
			'marketUrl' => $arParams['MARKET_URL'] ?? '',
			'supersetStatus' => $arResult['SUPERSET_STATUS'],
		])?>);
	});
</script>
