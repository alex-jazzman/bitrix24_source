<?php
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
/** @var CDiskExternalLinkComponent $component */
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Loc::loadMessages(__DIR__ . '/template.php');

include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-page.php';

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
]);

$APPLICATION->SetAdditionalCSS($templateFolder . '/access-card.css');

$langId = $component->getLangId();

$illustration = $templateFolder . '/images/access-lock.png';
$title = $component->getMessage('DISK_EXT_LINK_DENIED_TITLE');
$description = ($arResult['ERROR_MESSAGE'] ?? '') ?: $component->getMessage('DISK_EXT_LINK_DENIED_DESCRIPTION');
$mode = 'denied';
$slotHtml = '';
$cardTestId = 'disk-ext-denied-card';
?>
<!DOCTYPE html>
<html lang="<?= mb_strtolower($langId) ?>">
<head>
	<meta charset="<?= LANG_CHARSET ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="Content-Type" content="text/html; charset=<?= SITE_CHARSET ?>" />
	<title><?= $component->getMessage('DISK_EXT_LINK_TITLE') ?></title>
	<?php
	$APPLICATION->ShowCSS();
	$APPLICATION->ShowHeadStrings();
	$APPLICATION->ShowHeadScripts();
	?>
</head>
<body class="<?= $pageBodyClass ?>">
	<div class="bx-shared-wrap">
		<?php if ($showExternalHeader): ?>
			<?php include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-header.php'; ?>
		<?php endif; ?>
		<div class="<?= $cardLayoutClass ?>">
			<?php include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-card.php'; ?>
		</div>
	</div>
</body>
</html>
