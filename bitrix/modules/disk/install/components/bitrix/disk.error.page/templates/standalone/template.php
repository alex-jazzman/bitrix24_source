<?php
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @var CBitrixComponentTemplate $this */
/** @var \Bitrix\Disk\Internals\BaseComponent $component */

$errorPageTemplatePath = '/bitrix/components/bitrix/disk.error.page/templates/.default';
$accessCardTemplatePath = '/bitrix/components/bitrix/disk.external.link/templates/.default';

Loc::loadMessages($_SERVER['DOCUMENT_ROOT'] . $errorPageTemplatePath . '/template.php');

include $_SERVER['DOCUMENT_ROOT'] . $accessCardTemplatePath . '/access-page.php';

$extensions = [
	'ui.design-tokens',
	'ui.design-tokens.air',
	'ui.fonts.opensans',
];
if ($showExternalHeader)
{
	$extensions[] = 'ui.buttons';
}

Extension::load($extensions);

$APPLICATION->SetAdditionalCSS($accessCardTemplatePath . '/access-card.css');
if ($showExternalHeader)
{
	// The header markup is styled by the external page stylesheet.
	$APPLICATION->SetAdditionalCSS($accessCardTemplatePath . '/style.css');
}

$langId = LANGUAGE_ID;

$illustration = $accessCardTemplatePath . '/images/access-lock.png';
// Own phrases: the _V2 ones of the .default template are shared with its other consumers.
$title = Loc::getMessage('DISK_ERROR_PAGE_STANDALONE_DENIED_TITLE');
$description = Loc::getMessage('DISK_ERROR_PAGE_STANDALONE_DENIED_DESCRIPTION');
$mode = 'denied';
$slotHtml = '';
$cardTestId = 'disk-error-page-card';
?>
<!DOCTYPE html>
<html lang="<?= LANGUAGE_ID ?>">
<head>
	<?php $APPLICATION->ShowHead(); ?>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?= Loc::getMessage('DISK_ERROR_PAGE_TITLE') ?></title>
</head>
<body class="<?= $pageBodyClass ?>">
	<?php if ($showExternalHeader): ?>
		<?php include $_SERVER['DOCUMENT_ROOT'] . $accessCardTemplatePath . '/access-header.php'; ?>
	<?php endif; ?>
	<div class="<?= $cardLayoutClass ?>">
		<?php include $_SERVER['DOCUMENT_ROOT'] . $accessCardTemplatePath . '/access-card.php'; ?>
	</div>
</body>
</html>
