<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 * @var array $arParams
 */

$bWasSelect = false;

?>
<span class="fields crm_status field-wrap">
<select name="<?=$arParams["arUserField"]["FIELD_NAME"]?>"<?php
if ($arParams["arUserField"]["MULTIPLE"]=="Y"):
?> multiple="multiple"<?php
endif;
?>><?php

foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
{
	$bSelected = in_array((string) $key, $arResult["VALUE"], true) && (
		(!$bWasSelect) ||
		($arParams["arUserField"]["MULTIPLE"] == "Y")
	);
	$bWasSelect = $bWasSelect || $bSelected;

	?><option value="<?= $key?>"<?= ($bSelected? " selected" : "")?>><?= $val?></option><?php
}
?></select>
</span><?php