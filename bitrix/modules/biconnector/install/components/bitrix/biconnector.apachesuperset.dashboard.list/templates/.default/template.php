<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Superset\Import\DashboardReimportService;
use Bitrix\BIConnector\Superset\Selfhost\License\SelfHostedLicenseView;
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
	'biconnector.grid',
	'biconnector.apache-superset-dashboard-manager',
	'biconnector.apache-superset-market-manager',
	'biconnector.apache-superset-analytics',
	'biconnector.aha-moment',
	'biconnector.dashboard-export-master',
	'biconnector.dashboard-related-items-list',
	'biconnector.error-message',
	'ui.dialogs.messagebox',
	'ui.hint',
	'ui.notification',
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
	'ui.system.typography',
	'biconnector.share-popup',
	'biconnector.ai-digest-setup',
]);

$digestSetupOnboarding = $arResult['DIGEST_SETUP_ONBOARDING'] ?? [];
$canShowDigestSetupOnboarding = ($digestSetupOnboarding['canShow'] ?? false) === true;

$bitrixGptAnnouncement = $arResult['BITRIXGPT_BI_ANNOUNCEMENT'] ?? [];
$canShowBitrixGptAnnouncement = ($bitrixGptAnnouncement['canShow'] ?? false) === true;

if ($canShowBitrixGptAnnouncement)
{
	Extension::load('biconnector.bitrixgpt-bi-announce');
}

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

<?php if (!empty($arResult['STALE_CONDITIONS'])): ?>
	<div id="biconnector-stale-conditions-warning" class="ui-alert ui-alert-warning">
		<span class="ui-alert-message">
			<?php if (!empty($arResult['STALE_CONDITION_NAMES'])): ?>
				<?= Loc::getMessage(
					'BICONNECTOR_SUPERSET_DASHBOARD_GRID_STALE_CONDITIONS_WARNING',
					[
						'#FIELDS#' => htmlspecialcharsbx(implode(', ', $arResult['STALE_CONDITION_NAMES'])),
					],
				)?>
			<?php else: ?>
				<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STALE_CONDITIONS_WARNING_SHORT')?>
			<?php endif; ?>
		</span>
	</div>
<?php endif; ?>

<?php if ($arResult['SELFHOST_LICENSE_NOTICE'] !== null): ?>
	<?php $licenseNotice = $arResult['SELFHOST_LICENSE_NOTICE']; ?>
	<?php $licenseNoticeClass =
		$licenseNotice['design'] === SelfHostedLicenseView::DESIGN_ALERT
			? 'ui-alert-danger'
			: 'ui-alert-warning'
	; ?>
	<div
		class="ui-alert <?= $licenseNoticeClass ?>"
		data-testid="biconnector-selfhost-license-notice"
		data-state="<?= htmlspecialcharsbx($licenseNotice['state']) ?>"
	>
		<span class="ui-alert-message">
			<?php if ($licenseNotice['title'] !== ''): ?>
				<b><?= htmlspecialcharsbx($licenseNotice['title']) ?></b>
			<?php endif ?>
			<?= htmlspecialcharsbx($licenseNotice['description']) ?>
			<?php if ($licenseNotice['actionUrl'] !== null && $licenseNotice['actionText'] !== null): ?>
				<a
					href="<?= htmlspecialcharsbx($licenseNotice['actionUrl']) ?>"
					target="_blank"
					rel="noopener"
					data-testid="biconnector-selfhost-license-notice-action"
				><?= htmlspecialcharsbx($licenseNotice['actionText']) ?></a>
				<?php if ($licenseNotice['actionNote'] !== null): ?>
					<?= htmlspecialcharsbx($licenseNotice['actionNote']) ?>
				<?php endif ?>
			<?php endif ?>
		</span>
	</div>
<?php endif; ?>

<?php if (isset($arResult['AI_AGENTS_PROMO'])): ?>
	<div class="ui-alert ui-alert-primary" data-testid="ai-agents-promo">
		<span class="ui-alert-message">
			<?= htmlspecialcharsbx(
				Loc::getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_AI_AGENTS_PROMO_TEXT')
			) ?>
			<a
				href="<?= htmlspecialcharsbx($arResult['AI_AGENTS_PROMO']['url']) ?>"
				data-testid="ai-agents-promo-link"
			><?= htmlspecialcharsbx(
				Loc::getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_AI_AGENTS_PROMO_LINK')
			) ?></a>
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
			'selfHostedLicensePopup' => $arResult['SELFHOST_LICENSE_POPUP'] ?? null,
			'publishAhaMoment' => $arResult['PUBLISH_AHA_MOMENT'] ?? [],
			'constructorButtonHint' => $arResult['CONSTRUCTOR_BUTTON_HINT'] ?? [],
			'isAvailableDashboardCreation' => $arResult['IS_AVAILABLE_DASHBOARD_CREATION'] ?? false,
			'isAvailableGroupCreation' => $arResult['IS_AVAILABLE_GROUP_CREATION'] ?? false,
			'isMarketExists' => $arParams['IS_MARKET_EXISTS'] ?? false,
			'marketUrl' => $arParams['MARKET_URL'] ?? '',
			'supersetStatus' => $arResult['SUPERSET_STATUS'],
		])?>);

		<?php if ($canShowBitrixGptAnnouncement): ?>
		BX.BIConnector.BitrixGptBiAnnounce.init(<?= Json::encode($bitrixGptAnnouncement) ?>);
		<?php endif; ?>

		<?php if ($canShowDigestSetupOnboarding): ?>
		BX.BIConnector.AiDigestOnboarding.enqueue({
			version: 'v1',
			availability: <?= Json::encode($digestSetupOnboarding['availability'] ?? []) ?>,
		});
		<?php endif; ?>
	});
</script>
