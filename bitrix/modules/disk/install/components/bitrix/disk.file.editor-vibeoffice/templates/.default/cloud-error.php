<?php

/** @var $this CBitrixComponentTemplate */
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @var CBitrixComponentTemplate $this */
/** @var BaseComponent $component */

use Bitrix\Disk\Internals\BaseComponent;
use Bitrix\Main\Context;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
Loc::loadLanguageFile(__DIR__ . '/template.php');

/** @var array $arResult */
Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
]);

$containerId = 'cloud-error-' . $this->randString();
$headerText = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_MODE_VIEW');

$headerLogoClass = '';
if (Context::getCurrent()->getLanguage() !== 'ru')
{
	$headerLogoClass = 'disk-fe-office-header-logo--eng';
}

$title = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_CLOUD_ERROR_COMMON_TITLE');
$description = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_CLOUD_ERROR_COMMON_DESCR');
?>
<div data-id="<?= $containerId ?>-wrapper">
	<div class="disk-fe-office-header">
		<div class="disk-fe-office-header-left">
			<a href="<?= $arResult['HEADER_LOGO_LINK'] ?? '' ?>" class="disk-fe-office-header-logo <?= $headerLogoClass ?>" target="_blank"></a>
			<div class="disk-fe-office-header-mode">
				<span class="disk-fe-office-header-mode-text"><?= $headerText ?></span>
			</div>
		</div>
	</div>
	<div data-id="<?= $containerId ?>" style="height: calc(100vh - 70px)">
		<div
			class="disk-fe-vo-cloud-error"
			data-id="<?= $containerId ?>-base"
			data-testid="disk-vibeoffice-error"
		>
			<div class="disk-fe-vo-cloud-error-title"><?= $title ?></div>
			<div class="disk-fe-vo-cloud-error-desc"><?= $description ?></div>
		</div>
	</div>
</div>
