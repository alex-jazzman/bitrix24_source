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
use Bitrix\UI\Buttons\AirButtonStyle;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Tag;

Loc::loadMessages(__DIR__ . '/template.php');
Loc::loadMessages(__FILE__);

global $APPLICATION;

include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-page.php';

Extension::load([
	'disk',
	'ui.viewer',
	'sidepanel',
	'disk.viewer.document-item',
	'disk.viewer.board-item',
	'ui.dialogs.messagebox',
	'ui.notification',
	'ui.fonts.opensans',
	'ui.design-tokens',
	'ui.buttons',
	// stands in for the clipboard API outside a secure context
	'clipboard',
	'ui.icon-set.disk',
	'ui.icon-set.outline',
]);

$APPLICATION->SetAdditionalCSS($templateFolder . '/access-card.css');
$APPLICATION->SetAdditionalCSS($templateFolder . '/folder-list.css');

$langId = $component->getLangId();
?>
<!DOCTYPE html>
<html lang="<?= mb_strtolower($langId) ?>">
<head>
	<meta charset="<?= LANG_CHARSET ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?= $component->getMessage('DISK_EXT_LINK_FOLDER_TITLE') ?></title>
	<meta http-equiv="Content-Type" content="text/html; charset=<?=SITE_CHARSET?>" />
	<? if(!$arResult['PROTECTED_BY_PASSWORD']){ ?>
		<meta content="<?= $arResult['FOLDER']['VIEW_URL'] ?>" property="og:url"/>
		<meta content="<?= htmlspecialcharsbx($arResult['SITE_NAME']) ?>" property="og:site_name"/>
		<meta content="<?= htmlspecialcharsbx($arResult['FOLDER']['NAME']) ?>" property="og:title"/>
		<meta content="website" property="og:type"/>
		<meta content="<?= $component->getMessage('DISK_EXT_LINK_OPEN_FOLDER_GRAPH_MADE_BY_B24') ?>" property="og:description"/>
	<? } ?>
	<?
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
<?php if (!($arResult['PROTECTED_BY_PASSWORD']) || $arResult['VALID_PASSWORD']) {
	/** @var callable $applyAirStyle */
	include $_SERVER['DOCUMENT_ROOT']
		. '/bitrix/components/bitrix/disk.external.link/templates/.default/access-button.php';

	$downloadAllowed =
		!empty($arResult['ENABLED_MOD_ZIP'])
		&& !empty($arResult['FOLDER']['CREATED_BY'])
		&& !empty($arResult['FOLDER']['SIZE'])
	;

	$downloadButton = null;
	if ($downloadAllowed && $arResult['FILE_LIMIT_EXCEEDED'] === false)
	{
		$downloadButton = new Button([
			'text' => $component->getMessage('DISK_EXT_LINK_FOLDER_DOWNLOAD'),
			'tag' => Tag::LINK,
			'link' => $arResult['FOLDER']['DOWNLOAD_URL'],
		]);
		$downloadButton->addAttribute('data-testid', 'disk-ext-folder-download-btn');
	}
	elseif ($downloadAllowed && $arResult['FILE_LIMIT_EXCEEDED'] === true)
	{
		$downloadButton = new Button([
			'text' => $component->getMessage('DISK_EXT_LINK_FOLDER_DOWNLOAD'),
			'tag' => Tag::BUTTON,
		]);
		$downloadButton
			->addAttribute('id', 'download-error-btn')
			->addAttribute('type', 'button')
			->addAttribute('data-testid', 'disk-ext-folder-download-limit-btn')
		;
	}

	if ($downloadButton !== null)
	{
		$applyAirStyle($downloadButton, AirButtonStyle::FILLED);
		// Buttons\Size has no constant for the XL step of the air design (46px).
		$downloadButton->addClass('ui-btn-xl');
	}

	$copyLinkButton = new Button([
		'text' => $component->getMessage('DISK_EXT_LINK_COPY_LINK'),
		'tag' => Tag::BUTTON,
	]);
	$applyAirStyle($copyLinkButton, AirButtonStyle::TINTED);
	$copyLinkButton
		->addClass('ui-btn-xl')
		->addAttribute('id', 'disk-ext-folder-copy-link')
		->addAttribute('type', 'button')
		->addAttribute('data-testid', 'disk-ext-folder-copy-link-btn')
	;

	$copyLinkButtonHtml = $copyLinkButton->render(false);
	$downloadButtonHtml = $downloadButton === null ? '' : $downloadButton->render(false);

	?>
		<main class="disk-ext-content-layout" data-testid="disk-ext-folder-page">
			<div class="disk-object-container disk-ext-surface" data-testid="disk-ext-folder-card">
				<?php include $_SERVER['DOCUMENT_ROOT']
					. '/bitrix/components/bitrix/disk.external.link/templates/.default/folder-header.php'; ?>

				<?php include $_SERVER['DOCUMENT_ROOT']
					. '/bitrix/components/bitrix/disk.external.link/templates/.default/folder-list.php'; ?>
			</div>
		</main>
		<script>
		BX(function () {
			BX.message({disk_document_service: 'gdrive'});

			<?php if($arResult['SESSION_EXPIRED']): ?>
				BX.UI.Notification.Center.notify({
					content: '<?= GetMessageJS('DISK_EXT_SESSION_EXPIRED') ?>',
				});
			<?php endif; ?>

			const downloadErrorBtn = BX('download-error-btn');
			if (downloadErrorBtn)
			{
				downloadErrorBtn.addEventListener('click', showErrorPopup);
			}
		});

		function showErrorPopup()
		{
			BX.UI.Dialogs.MessageBox.show({
				message: '<?= CUtil::JSEscape(Loc::getMessage("DISK_EXT_LINK_ERROR_POPUP_TEXT")) ?>',
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
				onOk: function(messageBox) {
					messageBox.close();
				},
				useAirDesign: true,
			});
		}
		</script>
		<?php
		$copyLinkButtonId = 'disk-ext-folder-copy-link';
		$copyLinkUrl = $arResult['SHARE_URL'];

		include $_SERVER['DOCUMENT_ROOT']
			. '/bitrix/components/bitrix/disk.external.link/templates/.default/copy-link-script.php';
		?>
		<? } elseif($arResult['PROTECTED_BY_PASSWORD']){ ?>
			<? $this->getComponent()->includeComponentTemplate('protected_by_password'); ?>
		<? } ?>
</div>
</body>
</html>