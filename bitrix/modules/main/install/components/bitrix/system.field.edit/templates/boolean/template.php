<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arResult
 * @var array $arParams
 */
?><div class="fields boolean" id="main_<?=$arParams["arUserField"]["FIELD_NAME"]?>"><?php
foreach ($arResult["VALUE"] as $res):
?><div class="fields boolean"><?php
		switch($arParams["arUserField"]["SETTINGS"]["DISPLAY"])
		{
			case "DROPDOWN":
?><select name="<?=$arParams["arUserField"]["FIELD_NAME"]?>">
	<option value="1"<?=($res? ' selected': '')?>><?=\Bitrix\Main\Text\HtmlFilter::encode($arResult['FIELD_LABEL'][1])?></option>
	<option value="0"<?=(!$res? ' selected': '')?>><?=\Bitrix\Main\Text\HtmlFilter::encode($arResult['FIELD_LABEL'][0])?></option>
</select><?php
			break;
			case "RADIO":
?><label><input type="radio" value="1" name="<?=$arParams["arUserField"]["FIELD_NAME"]?>"
	<?=($res ? ' checked': '')?>><?=\Bitrix\Main\Text\HtmlFilter::encode($arResult['FIELD_LABEL'][1])?></label><br>
<label><input type="radio" value="0" name="<?=$arParams["arUserField"]["FIELD_NAME"]?>"
	<?=(!$res ? ' checked': '')?>><?=\Bitrix\Main\Text\HtmlFilter::encode($arResult['FIELD_LABEL'][0])?></label><?php
			break;
			default:
?><input type="hidden" value="0" name="<?=$arParams["arUserField"]["FIELD_NAME"]?>">
				<label><input type="checkbox" value="1" name="<?=$arParams["arUserField"]["FIELD_NAME"]?>" <?=($res ? "checked=\"checked\"": "")?>> <?=\Bitrix\Main\Text\HtmlFilter::encode($arResult['FIELD_LABEL'][1])?></label><?php
			break;
		}
?></div><?php
endforeach;
?></div><?php
if ($arParams["arUserField"]["MULTIPLE"] == "Y" && $arParams["SHOW_BUTTON"] != "N"):?>
<input type="button" value="<?=GetMessage("USER_TYPE_PROP_ADD")?>" onClick="addElement('<?=$arParams["arUserField"]["FIELD_NAME"]?>', this)">
<?php endif;?>