<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

/** @var $this CBitrixComponentTemplate */
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */

use Bitrix\Disk\Document\Flipchart\Configuration;

$isBoardsPage = (bool)$arResult['BOARDS_GUIDE']['IS_BOARDS_PAGE'];

// outside the boards page the target lives in the create panel of buttons.php, which renders the board
// card only with the panel shown and boards enabled
$isGuideTargetRendered = $isBoardsPage || (empty($arResult['HIDE_BUTTONS']) && Configuration::isBoardsEnabled());

$isGuideMustBeShown = !$arResult['BOARDS_GUIDE']['IS_VIEWED'] && $isGuideTargetRendered;
?>

<?php if ($isGuideMustBeShown):
	$guideTargetSelector = $isBoardsPage ? '.toolbar-button-create-new-board' : '.disk-documents-control-panel-card--board';
	$guideSpotlightTargetSelector = $isBoardsPage ? $guideTargetSelector : '.disk-documents-control-panel-card--board .disk-documents-control-panel-card-btn';
?>
<script>
	BX.ready(function() {
		new BX.Disk.Documents.BoardsGuide({
			id: '<?= $arResult['BOARDS_GUIDE']['ID']?>',
			targetSelector: '<?= $guideTargetSelector?>',
			spotlightSelector: '<?= $guideSpotlightTargetSelector?>',
			isBoardsPage: <?= $isBoardsPage ? 'true' : 'false' ?>
		}).start();
	});
</script>
<?php endif; ?>