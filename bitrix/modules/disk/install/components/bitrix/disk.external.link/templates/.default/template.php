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

include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-page.php';

$fileInfo = $arResult['FILE'] ?? [];
$showsFileCard = !$arResult['PROTECTED_BY_PASSWORD'] || $arResult['VALID_PASSWORD'];

// Single source of the preview branch: both the extension list and the markup below rely on it.
$previewMode = null;
if ($showsFileCard)
{
	if (!empty($fileInfo['PREVIEW']))
	{
		$previewMode = 'document';
	}
	elseif (!empty($fileInfo['IS_IMAGE']))
	{
		$previewMode = 'image';
	}
	elseif (!empty($fileInfo['VIEWER']))
	{
		$previewMode = 'viewer';
	}
	else
	{
		$previewMode = 'icon';
	}
}

$extensions = [
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.viewer',
	'ui.notification',
	'ui.buttons',
];
if ($showsFileCard)
{
	// stands in for the clipboard API outside a secure context
	$extensions[] = 'clipboard';
}
if ($previewMode === 'icon')
{
	$extensions[] = 'ui.icon-set.disk';
}

Extension::load($extensions);
if (isset($arResult['FILE']['VIEWER']) && str_contains((string)$arResult['FILE']['VIEWER'], 'disk.viewer.tiff-item'))
{
	Extension::load('disk.viewer.tiff-item');
}

$APPLICATION->SetAdditionalCSS($templateFolder . '/access-card.css');

$langId = $component->getLangId();

$unifiedLink = $arResult['UNIFIED_LINK'];
?>
<!DOCTYPE html>
<html lang="<?= mb_strtolower($langId)?>">
<head>
	<meta charset="<?= LANG_CHARSET ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?= Loc::getMessage('DISK_EXT_LINK_TITLE') ?></title>

	<? if(!$arResult['PROTECTED_BY_PASSWORD']){ ?>
		<meta content="<?= $arResult['FILE']['VIEW_URL'] ?>" property="og:url"/>
		<meta content="<?= htmlspecialcharsbx($arResult['SITE_NAME']) ?>" property="og:site_name"/>
		<meta content="<?= htmlspecialcharsbx($arResult['FILE']['NAME']) ?>" property="og:title"/>
		<meta content="website" property="og:type"/>
		<meta content="<?= $component->getMessage('DISK_EXT_LINK_OPEN_GRAPH_MADE_BY_B24') ?>" property="og:description"/>
		<? if($arResult['FILE']['IS_IMAGE'] && $arResult['FILE']['IMAGE_DIMENSIONS']){ ?>
			<meta content="<?= $arResult['FILE']['ABSOLUTE_SHOW_FILE_URL'] ?>" property="og:image"/>
			<meta content="<?= $arResult['FILE']['IMAGE_DIMENSIONS']['WIDTH'] ?>" property="og:image:width"/>
			<meta content="<?= $arResult['FILE']['IMAGE_DIMENSIONS']['HEIGHT'] ?>" property="og:image:height"/>
		<? } ?>
	<? }
	$APPLICATION->ShowCSS();
	$APPLICATION->ShowHeadStrings();
	$APPLICATION->ShowHeadScripts();
	?>
</head>
<body class="<?= $pageBodyClass ?>">
<script>
	BX.ready(function(){
		let inlineController = new BX.UI.Viewer.InlineController({baseContainer: BX('test-content')});
		inlineController.renderItemByNode(BX('test-content'));
		<?php if (!$arResult['FROM_UNIFIED_LINK'] && is_string($unifiedLink)) { ?>
			window.history.replaceState({}, '', '<?= $unifiedLink ?>');
		<?php } elseif($arResult['SESSION_EXPIRED']) { ?>
			BX.UI.Notification.Center.notify({
				content: '<?= GetMessageJS('DISK_EXT_SESSION_EXPIRED') ?>',
			});

			let url = window.location.href;
			url = url.replace(/\&session=expired/, '');
			window.history.replaceState({}, '', url);

		<?php } ?>
	});
</script>
	<div class="bx-shared-wrap">

		<?php if ($showExternalHeader): ?>
			<?php include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-header.php'; ?>
		<?php endif; ?>
<?php if (!($arResult['PROTECTED_BY_PASSWORD']) || $arResult['VALID_PASSWORD']) {
	/** @var callable $applyAirStyle */
	include $_SERVER['DOCUMENT_ROOT']
		. '/bitrix/components/bitrix/disk.external.link/templates/.default/access-button.php';

	$downloadButton = new Button([
		'text' => $component->getMessage('DISK_EXT_LINK_FILE_DOWNLOAD'),
		'tag' => Tag::LINK,
		'link' => $arResult['FILE']['DOWNLOAD_URL'],
	]);
	$applyAirStyle($downloadButton, AirButtonStyle::FILLED);
	$downloadButton
		// Buttons\Size has no constant for the XL step of the air design (46px).
		->addClass('ui-btn-xl')
		// Media files are served inline by the fast download path, so the link has to ask for saving.
		->addAttribute('download', $arResult['FILE']['NAME'])
		->addAttribute('data-testid', 'disk-ext-file-download-btn')
	;

	$copyLinkButton = new Button([
		'text' => $component->getMessage('DISK_EXT_LINK_COPY_LINK'),
		'tag' => Tag::BUTTON,
	]);
	$applyAirStyle($copyLinkButton, AirButtonStyle::TINTED);
	$copyLinkButton
		->addClass('ui-btn-xl')
		->addAttribute('id', 'disk-ext-file-copy-link')
		->addAttribute('type', 'button')
		->addAttribute('data-testid', 'disk-ext-file-copy-link-btn')
	;

	$downloadButtonHtml = $downloadButton->render(false);
	$copyLinkButtonHtml = $copyLinkButton->render(false);
	?>
		<main class="disk-ext-content-layout --centered" data-testid="disk-ext-file-page">
			<div class="disk-ext-file-card disk-ext-surface" data-testid="disk-ext-file-card">
				<div class="disk-ext-file-card__preview" data-testid="disk-ext-file-preview">
				<?php if ($previewMode === 'document'): ?>
					<iframe
						class="disk-ext-file-card__preview-frame"
						src="<?= htmlspecialcharsbx($arResult['FILE']['PREVIEW']['VIEW_URL']) ?>"
						title="<?= htmlspecialcharsbx($arResult['FILE']['NAME']) ?>"
						data-testid="disk-ext-file-preview-frame"
					></iframe>
				<?php elseif ($previewMode === 'image'):
					// The preview is a proportional resize, so the dimensions of the original give the
					// browser the ratio to reserve place by; the CSS keeps the image itself responsive.
					$previewWidth = (int)($arResult['FILE']['IMAGE_DIMENSIONS']['WIDTH'] ?? 0);
					$previewHeight = (int)($arResult['FILE']['IMAGE_DIMENSIONS']['HEIGHT'] ?? 0);
					$previewSizeAttributes = $previewWidth > 0 && $previewHeight > 0
						? ' width="' . $previewWidth . '" height="' . $previewHeight . '"'
						: ''
					;
					$openOriginalLabel = $component->getMessage('DISK_EXT_LINK_FILE_OPEN_ORIGINAL');
					?>
					<div class="bx-shared-preview-images">
						<a
							href="<?= htmlspecialcharsbx($arResult['FILE']['SHOW_FILE_URL']) ?>"
							target="_blank"
							rel="noopener"
							aria-label="<?= htmlspecialcharsbx($openOriginalLabel) ?>"
							data-testid="disk-ext-file-preview-link"
						><img
							src="<?= htmlspecialcharsbx($arResult['FILE']['SHOW_PREVIEW_URL']) ?>"<?= $previewSizeAttributes ?>
							alt=""
						></a>
					</div>
				<?php elseif ($previewMode === 'viewer'):
					echo $arResult['FILE']['VIEWER'];
				else:
					$iconName = htmlspecialcharsbx($arResult['FILE']['ICON_NAME']);
					?>
					<div
						class="disk-ext-file-card__type-icon ui-icon-set --<?= $iconName ?> --fixed-color"
						data-testid="disk-ext-file-type-icon"
					></div>
				<?php endif; ?>
				</div>
				<?php include $_SERVER['DOCUMENT_ROOT']
					. '/bitrix/components/bitrix/disk.external.link/templates/.default/file-header.php'; ?>
			</div>
		</main>
		<?php
		$copyLinkButtonId = 'disk-ext-file-copy-link';
		$copyLinkUrl = $arResult['FILE']['VIEW_URL'];

		include $_SERVER['DOCUMENT_ROOT']
			. '/bitrix/components/bitrix/disk.external.link/templates/.default/copy-link-script.php';
		?>
<? } elseif($arResult['PROTECTED_BY_PASSWORD']){ ?>
	<? $this->getComponent()->includeComponentTemplate('protected_by_password'); ?>
<? } ?>
	</div>
</body>
</html>
