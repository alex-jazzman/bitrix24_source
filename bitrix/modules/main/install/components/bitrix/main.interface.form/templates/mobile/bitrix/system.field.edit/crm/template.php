<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
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
if (empty($arResult["VALUE"]))
	return "";
$id = $arParams["formId"]."_".$arParams["~arUserField"]["ENTITY_ID"]."_".$arParams["~arUserField"]["ID"];
CUtil::InitJSCore(array('ajax'));
$empty = true;
$fieldName = $arParams['arUserField']['~FIELD_NAME'].($arParams['arUserField']['MULTIPLE'] == "Y" ? "[]" : "");
?><div id="<?=$id?>Container"><?php
foreach ($arResult["VALUE"] as $entityType => $arEntity)
{
	?><dl class="mobile-grid-field-crm-edit" data-bx-type="<?=$entityType?>"><?php
		?><dt><?= GetMessage('CRM_ENTITY_TYPE_' . $entityType) ?></dt><?php
	foreach($arEntity as $entityId => $entity)
	{
		$empty = false;
		?><dd id="<?=$entity["id"]?>"><?php
			?><?= htmlspecialcharsbx($entity['title'])?><?php
			?><del></del><?php
			?><input type="hidden" name="<?=$fieldName?>" value="<?=$entityId?>" /><?php
		?></dd><?php
	}
	?></dl><?php
}
?></div><?php
?><a class="mobile-grid-button crm-button" href="#" id="<?=$id?>Add"><?=GetMessage("MPF_ADD")?></a>
<script>
BX.ready(function(){
	BX.CRM.UFMobile.add({
		id : '<?=$id?>',
		controlName : '<?= CUtil::JSEscape($fieldName)?>'
	});
});
</script>