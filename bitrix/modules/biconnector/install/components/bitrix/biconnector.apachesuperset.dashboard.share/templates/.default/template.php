<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 * @var string $templateFolder
 * @var CMain $APPLICATION
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\BIConnector\Integration\Superset\Integrator\ServiceLocation;

Loader::includeModule('biconnector');
Loader::includeModule('ui');


Extension::load([
	'biconnector.apache-superset-dashboard-skeleton',
	'biconnector.apache-superset-embedded-loader',
	'biconnector.apache-superset-dashboard-manager',
	'biconnector.apache-superset-analytics',
	'pull.client',
	'ui.system.dialog',
	'ui.system.input',
	'ui.system.typography',
	'ui.buttons',
	'ui.lottie',
	'ui.icon-set.outline',
	'main.core',
]);

$languageId = (string)($arResult['LANGUAGE_ID'] ?? '');
if ($languageId !== '' && ServiceLocation::isRuRegion($languageId))
{
	$portalLogo = $templateFolder . '/images/portal-logo-ru.svg';
	$biBuilderLogo = $templateFolder . '/images/bibuilder-logo-ru.svg';
}
else
{
	$portalLogo = $templateFolder . '/images/portal-logo-en.svg';
	$biBuilderLogo = $templateFolder . '/images/bibuilder-logo-en.svg';
}

$dashboardTitle = htmlspecialcharsbx($arResult['DASHBOARD_TITLE'] ?? '');

$pageTitle = !empty($dashboardTitle)
	? $dashboardTitle
	: Loc::getMessage('BICONNECTOR_SHARE_PAGE_NOT_FOUND_TITLE')
;
$APPLICATION->SetTitle($pageTitle);

?>

<style>
	.biconnector-share__popup-character {
		background-image: url('<?= $templateFolder ?>/images/password-popup-character.png');
	}
	.biconnector-share__not-found-icon {
		background-image: url('<?= $templateFolder ?>/images/icon_not_found.png');
	}
	.biconnector-share__error-icon {
		background-image: url('<?= $templateFolder ?>/images/icon_lock.png');
	}
</style>

<div id="dashboard">
	<div class="dashboard-header">
		<div class="dashboard-header-title-section">
			<div class="dashboard-header-logo">
				<img src="<?= $portalLogo ?>" alt="">
				<img src="<?= $biBuilderLogo ?>" alt="">
			</div>
			<div class="dashboard-header-selector-text" title="<?= $dashboardTitle ?>"><?= $dashboardTitle ?></div>
		</div>
	</div>
	<div class="biconnector-dashboard__loader"></div>
</div>

<script>
	BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(() => {
		new BX.BIConnector.ApacheSuperset.Dashboard.Share(
			<?= Json::encode([
				'status' => $arResult['STATUS'],
				'token' => $arResult['TOKEN'],
				'dashboardTitle' => $arResult['DASHBOARD_TITLE'] ?? '',
				'embeddedParams' => $arResult['EMBEDDED_PARAMS'] ?? null,
				'lockedExternalFilters' => $arResult['LOCKED_EXTERNAL_FILTERS'] ?? null,
				'urlParams' => $arResult['URL_PARAMS'] ?? null,
				'pullConfig' => $arResult['PULL_CONFIG'] ?? null,
				'dashboardType' => $arResult['DASHBOARD_TYPE'] ?? null,
				'dashboardId' => $arResult['DASHBOARD_ID'] ?? null,
				'firstStartup' => $arResult['FIRST_STARTUP'] ?? false,
				'portalLogo' => $portalLogo,
				'biBuilderLogo' => $biBuilderLogo,
			]) ?>
		);
	});
</script>
