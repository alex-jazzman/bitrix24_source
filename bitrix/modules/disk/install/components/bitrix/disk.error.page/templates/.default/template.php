<?php
use Bitrix\Main\Localization\Loc;
$APPLICATION->SetPageProperty("BodyClass", "disk-error-page-align-center");
\Bitrix\Main\UI\Extension::load([
	"ui.design-tokens",
	"ui.design-tokens.air",
	"ui.fonts.opensans",
]);

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var \Bitrix\Disk\Internals\BaseComponent $component */

$APPLICATION->SetAdditionalCSS('/bitrix/components/bitrix/disk.external.link/templates/.default/access-card.css');

$illustration = '/bitrix/components/bitrix/disk.external.link/templates/.default/images/access-lock.png';
$title = Loc::getMessage('DISK_ERROR_PAGE_TITLE_V2');
$description = Loc::getMessage('DISK_ERROR_PAGE_BASE_DESCRIPTION_V2');
$mode = 'denied';
$slotHtml = '';
$cardTestId = 'disk-error-page-card';
?>

<div class="bx-disk-grid">
	<div class="disk-error-page__layout">
		<?php include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-card.php'; ?>
	</div>
</div>
