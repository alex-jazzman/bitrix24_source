<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @global CMain $APPLICATION
 */

$APPLICATION->SetAdditionalCSS('/bitrix/gadgets/bitrix/bitrix24/styles.css');

$logoFile = "/bitrix/gadgets/bitrix/bitrix24/images/logo-".LANGUAGE_ID.".png";
if (!file_exists($_SERVER["DOCUMENT_ROOT"].$logoFile))
	$logoFile = "/bitrix/gadgets/bitrix/bitrix24/images/logo-en.png";
?>
<div class="bx-gadget-top-label-wrap"><div class="bx-gadget-top-label"><?= GetMessage("GD_BITRIX24")?></div></div>
<div class="bx-gadget-title-wrap">
	<span class="bx-gadget-title-text"><?= GetMessage("GD_BITRIX24_TITLE")?></span><img src="<?= $logoFile?>" alt="Bitrix24"/>
</div>
<a class="bx-gadget-bitrix24-btn" href="<?= htmlspecialcharsBx(GetMessage("GD_BITRIX24_LINK"));?>"><?= GetMessage("GD_BITRIX24_BUTTON")?></a>
<div class="bx-gadget-bitrix24-text-wrap">
	<span class="bx-gadget-bitrix24-text-left"></span><span class="bx-gadget-bitrix24-text">
	<?= GetMessage("GD_BITRIX24_LIST")?>
	<span class="bx-gadget-bitrix24-text-other"><?= GetMessage("GD_BITRIX24_MORE")?></span> <br>
	</span>
</div>
<div class="bx-gadget-shield"></div>
