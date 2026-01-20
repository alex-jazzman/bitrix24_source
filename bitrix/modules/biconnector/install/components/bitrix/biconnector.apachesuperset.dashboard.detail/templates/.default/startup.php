<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var string $templateFolder
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\BIConnector\Integration\Superset\Integrator\ServiceLocation;

Loader::includeModule('biconnector');
Loader::includeModule('ui');

if (\Bitrix\Main\Loader::includeModule('pull'))
{
	global $USER;
	\CPullWatch::Add($USER->getId(), "superset_dashboard", true);
}

Extension::load([
	'loc',
	'ui.buttons',
	'ui.icons',
	'biconnector.apache-superset-dashboard-manager',
	'pull.client',
	'ui.lottie',
]);
CJSCore::Init(['helper']);

$helpDeskUrl = new \Bitrix\Main\Web\Uri(\Bitrix\UI\Util::getHelpdeskUrl(true) . '/widget2/');
$helpDeskUrl->addParams([
	'action' => 'open',
	'redirect' => 'detail',
]);

$dashboardTitle = htmlspecialcharsbx($arResult['DASHBOARD_TITLE']);
$APPLICATION->SetTitle($dashboardTitle);


$supersetServiceLocation = $arResult['SUPERSET_SERVICE_LOCATION'];
if ($supersetServiceLocation === ServiceLocation::DATACENTER_LOCATION_REGION_EN)
{
	$portalLogo = $templateFolder . '/images/portal-logo-en.svg';
	$biBuilderLogo = $templateFolder . '/images/bibuilder-logo-en.svg';
}
else
{
	$portalLogo = $templateFolder . '/images/portal-logo-ru.svg';
	$biBuilderLogo = $templateFolder . '/images/bibuilder-logo-ru.svg';
}

$templateMessages = Loc::loadLanguageFile($_SERVER['DOCUMENT_ROOT'] . $templateFolder . '/template.php');

?>
<style>
	.dashboard-header {
		--forward-icon: url("<?= $templateFolder . '/images/forward.svg' ?>");
		--more-icon: url("<?= $templateFolder . '/images/more.svg' ?>");
	}

	.icon-forward i {
		background-image: var(--forward-icon, var(--ui-icon-service-bg-image)) !important;
	}

	.icon-more i {
		background-image: var(--more-icon, var(--ui-icon-service-bg-image)) !important;
	}
</style>

<div id="dashboard">
	<div class="dashboard-header">
		<div class="dashboard-header-title-section">
			<div class="dashboard-header-logo">
				<a style="height: 22px; cursor: pointer;" href="/bi/dashboard/"><img src="<?= $portalLogo ?>" alt=""></a>
				<img src="<?= $biBuilderLogo ?>" alt="">
			</div>
			<div class="dashboard-header-selector-text"><?= $dashboardTitle ?></div>
		</div>
		<div class="dashboard-header-buttons">
			<button id="edit-btn" disabled="disabled" class="ui-btn --air ui-btn-md --style-tinted ui-btn-no-caps --with-left-icon dashboard-header-buttons-edit">
				<div class="ui-icon-set --edit-l"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_EDIT') ?>
			</button>
			<button id="download-btn" disabled="disabled" class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps ui-btn-dropdown dashboard-header-buttons-download">
				<div class="ui-icon-set --o-download"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_DOWNLOAD') ?>
			</button>
			<button id="share-btn" disabled="disabled" class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps ui-btn-dropdown dashboard-header-buttons-share">
				<div class="ui-icon-set --o-forward"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_SHARE') ?>
			</button>
			<div id="more-btn" disabled="disabled" class="ui-icon-set --more-l dashboard-header-buttons-more disabled"></div>
		</div>
	</div>
	<div class='biconnector-dashboard__loader'></div>
</div>

<script>
	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		BX.message(<?= Json::encode($templateMessages) ?>);

		new BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
			container: document.querySelector('.biconnector-dashboard__loader'),
			dashboardId: <?= (int)$arResult['DASHBOARD_ID'] ?>,
			status: '<?= \CUtil::JSEscape($arResult['DASHBOARD_STATUS']) ?>',
			dashboardType: '<?= \CUtil::JSEscape($arResult['DASHBOARD_TYPE']) ?>',
			supersetStatus: '<?= \CUtil::JSEscape($arResult['SUPERSET_STATUS']) ?>',
			isFirstStartup: <?= Json::encode($arResult['IS_FIRST_STARTUP'] ?? false) ?>,
			periodicReload: <?= Json::encode($arResult['PERIODIC_RELOAD'] ?? false) ?>,
		});
	});

	BX.Helper.init({
		frameOpenUrl: '<?= $helpDeskUrl ?>',
		langId: '<?= LANGUAGE_ID ?>'
	});
</script>
