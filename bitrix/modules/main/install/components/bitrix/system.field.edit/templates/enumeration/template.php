<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2013 Bitrix
 */

/**
 * Bitrix vars
 *
 * @var array $arParams
 * @var array $arResult
 */

$bWasSelect = false;

?><input type="hidden" name="<?=$arParams["arUserField"]["FIELD_NAME"]?>" value=""><?php

if ($arParams["arUserField"]["SETTINGS"]["DISPLAY"] == "CHECKBOX")
{
	foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
	{
		$bSelected = in_array($key, $arResult["VALUE"]) && (
			(!$bWasSelect) ||
			($arParams["arUserField"]["MULTIPLE"] == "Y")
		);
		$bWasSelect = $bWasSelect || $bSelected;

		?><?php if($arParams["arUserField"]["MULTIPLE"]=="Y"):?>
			<label><input
				type="checkbox"
				value="<?= $key?>"
				name="<?= $arParams["arUserField"]["FIELD_NAME"]?>"
				<?= ($bSelected? "checked" : "")?>
			><?=$val?></label><br />
		<?php else:?>
			<label><input
				type="radio"
				value="<?= $key?>"
				name="<?= $arParams["arUserField"]["FIELD_NAME"]?>"
				<?= ($bSelected? "checked" : "")?>
			><?=$val?></label><br />
		<?php endif;?><?php
	}
}
else
{
	?><select
		class="bx-user-field-enum"
		name="<?=$arParams["arUserField"]["FIELD_NAME"]?>"
		<?php if($arParams["arUserField"]["SETTINGS"]["LIST_HEIGHT"] > 1):?>
			size="<?=$arParams["arUserField"]["SETTINGS"]["LIST_HEIGHT"]?>"
		<?php endif;?>
		<?php if ($arParams["arUserField"]["MULTIPLE"]=="Y"):?>
			multiple="multiple"
		<?php endif;?>
	>
	<?php
	$values = $arResult["VALUE"];
	if(!is_array($values))
		$values = array($values);
	$values = array_map("strval", $values);
	if(count($values) > 1)
		$values = array_filter($values);
	foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
	{
		$bSelected = in_array(strval($key), $values, true) && (
			(!$bWasSelect) ||
			($arParams["arUserField"]["MULTIPLE"] == "Y")
		);
		$bWasSelect = $bWasSelect || $bSelected;

		?><option value="<?= $key?>"<?= ($bSelected? " selected" : "")?>><?= $val?></option><?php
	}
	?></select><?php
}
