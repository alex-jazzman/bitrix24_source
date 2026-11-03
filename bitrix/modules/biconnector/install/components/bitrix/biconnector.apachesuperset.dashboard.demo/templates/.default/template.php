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

use Bitrix\BIConnector\Integration\Superset\Integrator\ServiceLocation;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Loader::includeModule('biconnector');
Loader::includeModule('ui');

$dashboardId = (int)$arResult['DASHBOARD_ID'];
$isInfoAvailable = $arResult['IS_AVAILABLE'] && $dashboardId > 0;

$extensions = [
	'ui.design-tokens',
	'ui.design-tokens.air',
	'ui.system.chip',
	'biconnector.apache-superset-dashboard-demo',
];

if ($isInfoAvailable)
{
	$extensions[] = 'ui.buttons';
	$extensions[] = 'ui.icon-set.outline';
}

Extension::load($extensions);

$title = (string)$arResult['TITLE'];
$APPLICATION->SetTitle($title);

if ($arResult['SERVICE_LOCATION'] === ServiceLocation::DATACENTER_LOCATION_REGION_EN)
{
	$portalLogo = $templateFolder . '/images/portal-logo-en.svg';
	$biBuilderLogo = $templateFolder . '/images/bibuilder-logo-en.svg';
}
else
{
	$portalLogo = $templateFolder . '/images/portal-logo-ru.svg';
	$biBuilderLogo = $templateFolder . '/images/bibuilder-logo-ru.svg';
}

?>

<div class="biconnector-demo" id="biconnector-demo" data-testid="dashboard-demo-root" role="main"<?php if ($arResult['IS_AVAILABLE']): ?> aria-busy="true"<?php endif; ?>>
	<div class="biconnector-demo__header">
		<div class="biconnector-demo__header-main">
			<div class="dashboard-header-logo" data-testid="dashboard-demo-logo">
				<a class="biconnector-demo__logo-link" data-testid="dashboard-demo-logo-link" href="/bi/dashboard/"><img src="<?= $portalLogo ?>" alt="<?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_DEMO_LOGO_LINK')) ?>"></a>
				<img src="<?= $biBuilderLogo ?>" alt="">
			</div>
			<h1 class="biconnector-demo__title dashboard-header-selector-text" data-testid="dashboard-demo-title" title="<?= htmlspecialcharsbx($title) ?>"><?= htmlspecialcharsbx($title) ?></h1>
			<div
				class="ui-chip --tinted-bitrix-gpt --l --compact biconnector-demo__label"
				data-testid="dashboard-demo-label"
				data-role="demo-label"
				data-hint-interactivity
				role="note"
				tabindex="0"
				aria-describedby="biconnector-demo-label-hint"
			>
				<div class="ui-chip-text"><?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_DEMO_LABEL')) ?></div>
			</div>
			<span class="biconnector-demo__hint-description" id="biconnector-demo-label-hint"><?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_DEMO_LABEL_HINT')) ?></span>
		</div>
		<?php if ($isInfoAvailable): ?>
			<div class="biconnector-demo__header-buttons">
				<button
					type="button"
					aria-haspopup="dialog"
					class="ui-btn --air ui-btn-md --style-outline ui-btn-no-caps biconnector-demo__info-button"
					data-role="demo-info"
					data-testid="dashboard-demo-info-button"
				>
					<div class="ui-icon-set --o-info-circle"></div>
					<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_DEMO_INFO_BUTTON') ?>
				</button>
			</div>
		<?php endif; ?>
	</div>
	<?php if ($arResult['IS_AVAILABLE']): ?>
		<div class="biconnector-demo__skeleton" data-testid="dashboard-demo-skeleton" data-role="demo-skeleton"></div>
		<div class="biconnector-demo__frame --hidden" data-testid="dashboard-demo-frame" data-role="demo-frame"></div>
		<div class="biconnector-demo__state --hidden" data-testid="dashboard-demo-state" data-role="demo-state" role="status" tabindex="-1"></div>
	<?php else: ?>
		<div class="biconnector-demo__state" data-testid="dashboard-demo-state" data-state="UNAVAILABLE">
			<div class="biconnector-demo__state-icon"></div>
			<h2 class="biconnector-demo__state-title" data-testid="dashboard-demo-state-title"><?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_DEMO_UNAVAILABLE_TITLE') ?></h2>
			<div class="biconnector-demo__state-text"><?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_DEMO_UNAVAILABLE_TEXT') ?></div>
		</div>
	<?php endif; ?>
</div>

<script>
	BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(() => {
		<?php if ($arResult['IS_AVAILABLE']): ?>
		new BX.BIConnector.ApacheSuperset.Dashboard.DemoInstance(<?= Json::encode([
			'containerId' => 'biconnector-demo',
			'reportCode' => $arResult['REPORT_CODE'],
			'title' => $title,
			'dashboardId' => $dashboardId,
		]) ?>);
		<?php endif; ?>
		BX.BIConnector.ApacheSuperset.Dashboard.initDemoLabelHint('biconnector-demo');
	});
</script>
