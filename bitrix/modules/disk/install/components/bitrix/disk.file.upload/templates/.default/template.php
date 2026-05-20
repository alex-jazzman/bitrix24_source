<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

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
/** @var \Bitrix\Disk\Folder $arParams["FOLDER"] */
include_once(__DIR__."/message.php");

\Bitrix\Main\UI\Extension::load(['uploader', 'ui.design-tokens', 'ui.buttons', 'sidepanel']);

//$arParams["INPUT_CONTAINER"];
//$arParams["CID"];
//$arParams["DROPZONE"];
?>
<script>
BX.ready(function() {
	BX.DiskUpload.initialize({
		bp: '<?= CUtil::JSEscape((string)($arParams['STATUS_START_BIZPROC'] ?? '')) ?>',
		bpParameters: '<?= CUtil::JSEscape((string)($arParams['BIZPROC_PARAMETERS'] ?? '')) ?>',
		bpParametersRequired: <?= \Bitrix\Main\Web\Json::encode((array)($arParams['BIZPROC_PARAMETERS_REQUIRED'] ?? [])) ?>,
		signedDocumentType: '<?= CUtil::JSEscape((string)($arResult['SIGNED_DOCUMENT_TYPE'] ?? '')) ?>',
		signedDocumentId: '<?= CUtil::JSEscape((string)($arResult['SIGNED_DOCUMENT_ID'] ?? '')) ?>',
		storageId: <?= (int)($arParams['STORAGE_ID'] ?? 0) ?>,
		CID : '<?= CUtil::JSEscape((string)($arParams['CID'] ?? '')) ?>',
		<?php if (!empty($arParams['FILE_ID'])): ?>targetFileId : '<?= CUtil::JSEscape((string)$arParams['FILE_ID']) ?>',<?php
		else: ?>targetFolderId : '<?= CUtil::JSEscape((string)($arParams['FOLDER'] ? $arParams['FOLDER']->getId() : '')) ?>',<?php endif; ?>
		urlUpload : '/bitrix/components/bitrix/disk.file.upload/ajax.php',
		<?php if (!empty($arParams['~INPUT_CONTAINER'])) { ?>inputContainer : <?=$arParams['~INPUT_CONTAINER'] ?>,<?php } ?>
		dropZone : <?= $arParams['~DROPZONE'] ?? 'null' ?>,
	});
});
</script>
<?php
global $USER;
if(
	\Bitrix\Disk\Integration\Bitrix24Manager::isEnabled()
)
{
	?>
	<div id="bx-bitrix24-business-tools-info" style="display: none; width: 600px; margin: 9px;">
		<?php $APPLICATION->IncludeComponent('bitrix:bitrix24.business.tools.info', '', array()); ?>
	</div>
<?php
}
