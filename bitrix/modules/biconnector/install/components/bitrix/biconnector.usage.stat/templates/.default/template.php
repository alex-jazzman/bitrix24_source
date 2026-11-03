<?php

/**
 * Bitrix vars
 * @var array $arParams
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var CBitrixComponent $component
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Superset\Selfhost\License\SelfHostedLicenseView;
use Bitrix\Main\Grid\Component\ComponentParams;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

$APPLICATION->SetTitle(Loc::getMessage('BIC_USAGE_STAT_PAGE_TITLE'));

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

// the BI Builder slice logs queries permanently, so the collection window banner never applies there
$hasExternalStatBanner = !$arResult['IS_BI_BUILDER_SERVICE'];

$extensions = [
	'sidepanel',
	'ui.buttons',
	'ui.fonts.opensans',
	'biconnector.error-message',
	'biconnector.grid',
	'main.ui.filter',
	'main.core',
	'main.core.events',
	'ui.notification',
	'ui.hint',
	'ui.label',
	'ui.system.chip',
	'ui.alerts',
	'ui.a11y',
];

$isOnboardingAvailable = ($arResult['EXT_STAT_ONBOARDING']['canShow'] ?? false) === true;
if ($isOnboardingAvailable)
{
	// the hint is shown at most once per user, so its extensions are not needed on every hit
	$extensions[] = 'main.popup';
	$extensions[] = 'spotlight';
	$extensions[] = 'biconnector.aha-moment';
}

Extension::load($extensions);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'pagetitle-toolbar-field-view');

/** @var \Bitrix\Main\Grid\Grid $grid */
$grid = $arResult['GRID'];

$gridParams = [
	'CURRENT_PAGE' => $grid->getPagination()?->getCurrentPage(),
];
if (!empty($arResult['GRID_STUB']))
{
	$gridParams['STUB'] = $arResult['GRID_STUB'];
}

$externalStatBannerId = 'usage-stat-ext-collection-banner';
?>
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
<?php if ($hasExternalStatBanner): ?>
	<div
		class="ui-alert ui-alert-primary"
		id="<?= $externalStatBannerId ?>"
		<?php if (!$arResult['IS_EXTERNAL_STAT_ENABLED']): ?>style="display: none;"<?php endif; ?>
	>
		<span class="ui-alert-message">
			<?php if ($arResult['IS_EXTERNAL_STAT_ENABLED']): ?>
				<?= Loc::getMessage('CT_BBSU_EXT_STAT_ACTIVE_BANNER', ['#HOURS#' => $arResult['EXTERNAL_STAT_HOURS_LEFT']]) ?>
			<?php endif; ?>
		</span>
	</div>
<?php endif; ?>
<?php
$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	ComponentParams::get($grid, $gridParams)
);
?>
<script>
	function showMore(btn, fullText)
	{
		const text = btn.previousSibling;
		text.textContent = fullText;
		btn.remove();
		return false;
	}

	function reloadUsageStats()
	{
		BX.Main.gridManager.getInstanceById('<?= CUtil::JSEscape($grid->getId()) ?>').reload();
	}

	BX.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		BX.BIConnector.UsageStatGridManager.Instance = new BX.BIConnector.UsageStatGridManager({
			gridId: '<?= CUtil::JSEscape($grid->getId()) ?>',
			externalStat: {
				buttonId: '<?= CUtil::JSEscape($arResult['EXT_STAT_BUTTON_ID']) ?>',
				bannerId: '<?= $hasExternalStatBanner ? CUtil::JSEscape($externalStatBannerId) : '' ?>',
				active: <?= $arResult['IS_EXTERNAL_STAT_ENABLED'] ? 'true' : 'false' ?>,
				hoursLeft: <?= (int)$arResult['EXTERNAL_STAT_HOURS_LEFT'] ?>,
				labels: <?= Json::encode($arResult['EXT_STAT_BUTTON_LABELS']) ?>,
				onboarding: <?= Json::encode($arResult['EXT_STAT_ONBOARDING']) ?>,
			},
		});
		<?php if ($isOnboardingAvailable): ?>
			BX.BIConnector.UsageStatGridManager.Instance.showOnboarding();
		<?php endif; ?>
	});
</script>
<?php
if (!$arResult['IS_BI_BUILDER_SERVICE'] && !\Bitrix\BIConnector\LimitManager::getInstance()->checkLimitWarning())
{
	$APPLICATION->IncludeComponent('bitrix:biconnector.limit.lock', '');
}
