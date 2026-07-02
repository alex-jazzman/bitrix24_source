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

use Bitrix\BIConnector\Manager;
use Bitrix\BIConnector\Services\ApacheSuperset;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\BIConnector\Integration\Superset\Integrator\ServiceLocation;

Loader::includeModule('biconnector');
Loader::includeModule('ui');

CJSCore::Init(['spotlight']);

Extension::load([
	'biconnector.apache-superset-analytics',
	'biconnector.apache-superset-dashboard-skeleton',
	'ui.lottie',
]);

$analyticSource = Context::getCurrent()->getRequest()->get('openFrom') ?? 'direct';

$analyticScope = Context::getCurrent()->getRequest()->get('scope');

if (!empty($arResult['ERROR_MESSAGES']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => $arResult['ERROR_MESSAGES'][0],
		]
	);

	?>
		<script>
			BX.ready(() => {
				BX.BIConnector.ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
					c_element: '<?= CUtil::JSEscape($analyticSource) ?>',
					status: 'error',
				});
			});
		</script>
	<?php

	return;
}

Extension::load([
	'biconnector.apache-superset-embedded-loader',
	'biconnector.apache-superset-dashboard-manager',
	'biconnector.apache-superset-dashboard-selector',
	'biconnector.apache-superset-feedback-form',
	'biconnector.dashboard-export-master',
	'biconnector.share-popup',
	'biconnector.aha-moment',
	'ui.entity-selector',
	'ui.feedback.form',
	'ui.icons',
	'ui.notification',
	'ui.icon-set.actions',
	'ui.hint',
	'loc',
	'sidepanel',
	'main.date',
	'main.core',
	'ui.buttons',
	'im.v2.lib.opener',
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

$limitManager = \Bitrix\BIConnector\LimitManager::getInstance();
$limitManager->setService(Manager::getInstance()->createService(ApacheSuperset::getServiceId()));

if ($limitManager->isLimitByLicence() && !$limitManager->checkLimitWarning())
{
	$APPLICATION->IncludeComponent('bitrix:biconnector.limit.lock', '', [
		'SUPERSET_LIMIT' => 'Y',
	]);
}

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
			<div class="dashboard-header-selector-container" id="dashboard-selector">
				<div class="dashboard-header-selector-text" id="dashboard-selector-text" title="<?= $dashboardTitle ?>"><?= $dashboardTitle ?></div>
				<div class="ui-icon-set --chevron-down dashboard-header-selector-icon"></div>
			</div>
		</div>
		<div class="dashboard-header-buttons">
			<button id="edit-btn" class="ui-btn --air ui-btn-md --style-tinted ui-btn-no-caps --with-left-icon dashboard-header-buttons-edit">
				<div class="ui-icon-set --edit-l"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_EDIT') ?>
			</button>
			<button id="info-btn" class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps dashboard-header-buttons-info">
				<div class="ui-icon-set --o-info-circle"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_INFO') ?>
			</button>
			<?php if (Option::get('biconnector', 'bitrixgpt_bi_constructor', 'N') === 'Y'): ?>
				<button id="bitrixgpt-btn" class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps dashboard-header-buttons-gpt">
					<img src="<?= $templateFolder ?>/images/bitrixgpt.svg" class="dashboard-header-gpt-icon" alt="">
					<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_BITRIXGPT_BUTTON') ?>
				</button>
			<?php endif; ?>
			<button id="download-btn" class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps ui-btn-dropdown dashboard-header-buttons-download">
				<div class="ui-icon-set --o-download"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_DOWNLOAD') ?>
			</button>
			<button id="share-btn" class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps ui-btn-dropdown dashboard-header-buttons-share">
				<div class="ui-icon-set --o-share"></div>
				<?= Loc::getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_SHARE_LINK') ?>
			</button>
			<div id="more-btn" class="ui-icon-set --more-l dashboard-header-buttons-more"></div>
		</div>
	</div>
	<div class='dashboard-iframe'></div>
</div>

<script>
	BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.message(<?= Json::encode(Loc::loadLanguageFile($_SERVER['DOCUMENT_ROOT'] . $templateFolder . '/startup.php')) ?>);
	BX.ready(() => {

		<?php if ($arResult['CAN_SEND_STARTUP_METRIC']): ?>
		BX.BIConnector.ApacheSupersetAnalytics.sendAnalytics('infrastructure', 'start', {
			c_element: 'system',
			status: 'success',
		});
		BX.ajax.runAction('biconnector.superset.onStartupMetricSend');
		<?php endif; ?>

		BX.BIConnector.ApacheSuperset.Dashboard.Detail.create(
			<?= Json::encode([
				'appNodeId' => 'dashboard',
				'canExport' => $arResult['CAN_EXPORT'],
				'canEdit' => $arResult['CAN_EDIT'],
				'canShare' => $arResult['CAN_SHARE'],
				'shareData' => $arResult['SHARE_DATA'],
				'analyticSource' => $analyticSource,
				'analyticScope' => $analyticScope,
				'dashboardEmbeddedParams' => [
					'guestToken' => $arResult['GUEST_TOKEN'],
					'uuid' => $arResult['DASHBOARD_UUID'],
					'id' => $arResult['DASHBOARD_ID'],
					'title' => $dashboardTitle,
					'nativeFilters' => $arResult['NATIVE_FILTERS'],
					'urlParams' => $arResult['URL_PARAMS'],
					'editUrl' => $arResult['DASHBOARD_EDIT_URL'],
					'supersetDomain' => $arResult['SUPERSET_DOMAIN'],
					'type' => $arResult['DASHBOARD_TYPE'],
					'appId' => $arResult['DASHBOARD_APP_ID'],
					'isUseExternalDatasets' => $arResult['IS_USE_EXTERNAL_DATASETS'],
					'filters' => $arResult['FILTERS'],
				],
				'embeddedDebugMode' => $arResult['EMBEDDED_DEBUG_MODE'],
				'infoAhaMoment' => $arResult['INFO_AHA_MOMENT'],
			]) ?>
		);

		new BX.BIConnector.SupersetDashboardSelector(<?= Json::encode([
			'containerId' => 'dashboard-selector',
			'textNodeId' => 'dashboard-selector-text',
			'dashboardId' => $arResult['DASHBOARD_ID'],
			'marketCollectionUrl' => $arResult['MARKET_COLLECTION_URL'],
			'isMarketInstalled' => Loader::includeModule('market'),
			'dashboardUrlParams' => $arResult['URL_PARAMS'],
		]) ?>);
	});
</script>
