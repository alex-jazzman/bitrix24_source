<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bitrix24;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

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


Extension::load([
	'biconnector.apache-superset-dashboard-manager',
	'biconnector.apache-superset-analytics',
	'biconnector.apache-superset-cleaner',
	'ui.dialogs.messagebox',
	'ui.hint',
	'pull.client',
	'ui.icons',
	'ui.alerts',
]);

if (
	CurrentUser::get()->isAdmin()
	&& Bitrix24\LicenseScanner\Manager::getInstance()->shouldWarnPortal()
):
?>

<div class='ui-alert ui-alert-danger'>
	<span class='ui-alert-message'><?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_LOCK_NOTIFICATION') ?></span>
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
$limitManager->setIsSuperset();
if (!$limitManager->checkLimitWarning())
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
		])?>);
		BX.UI.Hint.init(BX('biconnector-dashboard-grid'));

		BX.BIConnector.ApacheSupersetCleaner.Instance = new BX.BIConnector.ApacheSupersetCleaner();
	});
</script>
