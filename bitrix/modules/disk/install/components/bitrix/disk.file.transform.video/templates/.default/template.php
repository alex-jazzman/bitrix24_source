<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

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

\Bitrix\Main\UI\Extension::load("ui.fonts.opensans");
?>

<script>
	BX.message(<?=\CUtil::PhpToJSObject($arResult['MESSAGES'])?>);
</script>

<?
if($arResult['STATUS'] == 'PROCESS')
{?>
	<div id="component_container_<?=$component->getComponentId() ?>" class="disk-file-transform-file-container disk-file-transform-file-loader-video disk-file-transform-file-container-<?=$arResult['COMMAND_ID'];?>" role="status" aria-live="polite"<?
		if($arResult['REFRESH_URL'])
		{
			?> data-bx-refresh-url="<?=CUtil::JSEscape($arResult['REFRESH_URL']);?>"<?
		}?>
	    >
		<div class="disk-file-transform-file-loader-container">
			<h3 class="disk-file-transform-file-loader-title"><?=htmlspecialcharsbx($arResult['TITLE']);?></h3>
			<?if(!empty($arResult['DESC']))
			{?>
			<div class="disk-file-transform-file-loader-desc"><?=htmlspecialcharsbx($arResult['DESC']);?></div>
			<?}?>
			<div class="disk-file-transform-file-loader-inner">
				<div class="disk-file-transform-file-loader-visual" aria-hidden="true">
					<svg class="disk-file-transform-file-circular" viewBox="25 25 50 50">
						<circle class="disk-file-transform-file-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle>
						<circle class="disk-file-transform-file-inner-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle>
					</svg>
					<div class="disk-file-transform-file-loader-button"></div>
				</div>
				<div class="disk-file-transform-file-loader-actions">
					<a href="<?=htmlspecialcharsbx($arResult['DOWNLOAD_LINK']);?>" target="_blank" download class="disk-file-transform-file-loader-link disk-file-transform-file-download-link"><?=htmlspecialcharsbx($arResult['MESSAGES']['DISK_FILE_TRANSFORM_VIDEO_DOWNLOAD']);?></a>
				</div>
			</div>
		</div>
	</div>
<?}
elseif($arResult['STATUS'] == 'ERROR')
{?>
	<div id="component_container_<?=$component->getComponentId() ?>" class="disk-file-transform-file-container disk-file-transform-file-disable disk-file-transform-file-container-<?=$arResult['COMMAND_ID'];?>" role="alert" aria-live="assertive">
		<div class="disk-file-transform-file-loader-container">
			<h3 class="disk-file-transform-file-loader-title"><?=htmlspecialcharsbx($arResult['TITLE']);?></h3>
			<?if(!empty($arResult['DESC']))
			{?>
				<div class="disk-file-transform-file-loader-desc"><?=htmlspecialcharsbx($arResult['DESC']);?></div>
			<?}?>
			<div class="disk-file-transform-file-loader-inner">
				<div class="disk-file-transform-file-loader-visual" aria-hidden="true">
					<div class="disk-file-transform-file-loader-button disk-file-transform-file-loader-button-sad"></div>
				</div>
				<div class="disk-file-transform-file-loader-actions">
					<a href="<?=htmlspecialcharsbx($arResult['DOWNLOAD_LINK']);?>" target="_blank" download class="disk-file-transform-file-loader-link disk-file-transform-file-download-link"><?=htmlspecialcharsbx($arResult['MESSAGES']['DISK_FILE_TRANSFORM_VIDEO_DOWNLOAD']);?></a>
					<button type="button" class="disk-file-transform-file-loader-link disk-file-transform-file-loader-retry"><?=htmlspecialcharsbx($arResult['TRANSFORM_URL_TEXT']);?></button>
				</div>
			</div>
		</div>
	</div>
<?
}
elseif($arResult['STATUS'] == 'NOT_STARTED')
{
	?>
	<div id="component_container_<?=$component->getComponentId() ?>" class="disk-file-transform-file-container disk-file-transform-file-disable" role="status" aria-live="polite">
		<div class="disk-file-transform-file-loader-container">
			<h3 class="disk-file-transform-file-loader-title"><?=htmlspecialcharsbx($arResult['TITLE']);?></h3>
			<?if(!empty($arResult['DESC']))
			{?>
				<div class="disk-file-transform-file-loader-desc"><?=htmlspecialcharsbx($arResult['DESC']);?></div>
			<?}?>
			<div class="disk-file-transform-file-loader-inner">
				<div class="disk-file-transform-file-loader-visual" aria-hidden="true">
					<div class="disk-file-transform-file-loader-button"></div>
				</div>
				<div class="disk-file-transform-file-loader-actions">
					<a href="<?=htmlspecialcharsbx($arResult['DOWNLOAD_LINK']);?>" target="_blank" download class="disk-file-transform-file-loader-link disk-file-transform-file-download-link"><?=htmlspecialcharsbx($arResult['MESSAGES']['DISK_FILE_TRANSFORM_VIDEO_DOWNLOAD']);?></a>
					<button type="button" class="disk-file-transform-file-loader-link disk-file-transform-file-loader-retry"><?=htmlspecialcharsbx($arResult['TRANSFORM_URL_TEXT']);?></button>
				</div>
			</div>
		</div>
	</div>
	<?
}?>
<script>


BX.ready(function(){

	var runComponent = function () {
		new BX.Disk.FileTransformVideo({
			layout: {
				containerId: 'component_container_<?=$component->getComponentId() ?>'
			},
			runGeneratePreviewLinkClass: 'disk-file-transform-file-loader-retry',
			runGenerationPreviewData: {
				action: '<?=$arResult['RUN_GENERATION_PREVIEW']['ACTION'] ?>',
				fileId: '<?=$arResult['RUN_GENERATION_PREVIEW']['FILE_ID'] ?>',
				attachedObjectId: '<?=$arResult['RUN_GENERATION_PREVIEW']['ATTACHED_OBJECT_ID'] ?>'
			},
			downloadLink: '<?=CUtil::JSUrlEscape($arResult['DOWNLOAD_LINK']) ?>',
			pullTag: '<?=CUtil::JSEscape($arResult['PULL_TAG']) ?>',
			status: '<?=CUtil::JSEscape($arResult['STATUS']) ?>',
			retryInterval: <?=((int)$arResult['RETRY_INTERVAL'] * 1000) ?>,
			waitTimeout: <?=((int)$arResult['WAIT_TIMEOUT'] * 1000) ?>
		});
	};

	if (!BX.getClass('BX.Disk.FileTransformVideo'))
	{
		BX.loadCSS('<?=CUtil::GetAdditionalFileURL($this->__folder.'/style.css');?>');
		BX.loadScript('<?=CUtil::GetAdditionalFileURL($this->__folder.'/script.js');?>', runComponent);
	}
	else
	{
		runComponent();
	}
});
</script>
