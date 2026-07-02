<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 * @var array $arParams
 */

if(
	$arParams["arUserField"]["ENTITY_VALUE_ID"] <= 0
	&& $arParams["arUserField"]["SETTINGS"]["DEFAULT_VALUE"] > 0
)
{
	$arResult['VALUE'] = array($arParams["arUserField"]["SETTINGS"]["DEFAULT_VALUE"]);
}
else
{
	$arResult['VALUE'] = array_filter($arResult["VALUE"]);
}

if($arParams['arUserField']["SETTINGS"]["DISPLAY"] != "CHECKBOX")
{
	if($arParams["arUserField"]["MULTIPLE"] == "Y")
	{
		?>
		<select multiple="multiple" name="<?= $arParams["arUserField"]["FIELD_NAME"]?>" size="<?= $arParams["arUserField"]["SETTINGS"]["LIST_HEIGHT"]?>" <?=($arParams["arUserField"]["EDIT_IN_LIST"]!="Y"? ' disabled="disabled" ':'')?> >
			<?php
		foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
		{
			$bSelected = in_array($key, $arResult["VALUE"]);
			?>
			<option value="<?= $key?>" <?= ($bSelected? "selected" : "")?> title="<?= trim($val, " .")?>"><?= $val?></option>
			<?php
		}
		?>
		</select>
		<?php
	}
	else
	{
		?>
		<select name="<?= $arParams["arUserField"]["FIELD_NAME"]?>" size="<?= $arParams["arUserField"]["SETTINGS"]["LIST_HEIGHT"]?>" <?=($arParams["arUserField"]["EDIT_IN_LIST"]!="Y"? ' disabled="disabled" ':'')?> >
			<?php
		$bWasSelect = false;
		foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
		{
			if($bWasSelect)
				$bSelected = false;
			else
				$bSelected = in_array($key, $arResult["VALUE"]);

			if($bSelected)
				$bWasSelect = true;
			?>
			<option value="<?= $key?>" <?= ($bSelected? "selected" : "")?> title="<?= trim($val, " .")?>"><?= $val?></option>
			<?php
		}
		?>
		</select>
		<?php
	}
}
else
{
	if($arParams["arUserField"]["MULTIPLE"] == "Y")
	{
		?>
		<input type="hidden" value="" name="<?= $arParams["arUserField"]["FIELD_NAME"]?>">
		<?php
		foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
		{
			$id = $arParams["arUserField"]["FIELD_NAME"]."_".$key;

			$bSelected = in_array($key, $arResult["VALUE"]);
			?>
			<input type="checkbox" value="<?= $key?>" name="<?= $arParams["arUserField"]["FIELD_NAME"]?>" <?= ($bSelected? "checked" : "")?> id="<?= $id?>"><label for="<?= $id?>"><?= $val?></label><br />
			<?php
		}
	}
	else
	{
		$bWasSelect = false;
		foreach ($arParams["arUserField"]["USER_TYPE"]["FIELDS"] as $key => $val)
		{
			$id = $arParams["arUserField"]["FIELD_NAME"]."_".$key;

			if($bWasSelect)
				$bSelected = false;
			else
				$bSelected = in_array($key, $arResult["VALUE"]);

			if($bSelected)
				$bWasSelect = true;
			?>
			<input type="radio" value="<?= $key?>" name="<?= $arParams["arUserField"]["FIELD_NAME"]?>" <?= ($bSelected? "checked" : "")?> id="<?= $id?>"><label for="<?= $id?>"><?= $val?></label><br />
			<?php
		}
	}
}
?>