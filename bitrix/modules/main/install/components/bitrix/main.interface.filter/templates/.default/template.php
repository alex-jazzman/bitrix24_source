<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die();

/**
 * @var array $arResult
 * @var CBitrixComponent $component
 * @global CMain $APPLICATION
 */
?>

<?php if(!empty($arParams["FILTER"])):?>
<div class="bx-interface-filter">
<form name="filter_<?=$arParams["GRID_ID"]?>" action="" method="GET">
	<?php
foreach($arResult["GET_VARS"] as $var=>$value):
	if(is_array($value)):
		foreach($value as $k=>$v):
			if(is_array($v))
				continue;
?>
<input type="hidden" name="<?=htmlspecialcharsbx($var)?>[<?=htmlspecialcharsbx($k)?>]" value="<?=htmlspecialcharsbx($v)?>">
		<?php
		endforeach;
	else:
?>
<input type="hidden" name="<?=htmlspecialcharsbx($var)?>" value="<?=htmlspecialcharsbx($value)?>">
	<?php
	endif;
endforeach;
?>
<table cellspacing="0" class="bx-interface-filter">
	<tr class="bx-filter-header" id="flt_header_<?=$arParams["GRID_ID"]?>" oncontextmenu="return bxGrid_<?=$arParams["GRID_ID"]?>.filterMenu">
		<td>
<?php if(!empty($arResult["FILTER"])):?>
			<div class="bx-filter-btn bx-filter-on" title="<?= GetMessage("interface_grid_used")?>"></div>
<?php else:?>
			<div class="bx-filter-btn bx-filter-off" title="<?= GetMessage("interface_grid_not_used")?>"></div>
<?php endif?>
			<div class="bx-filter-text"><?= GetMessage("interface_grid_search")?></div>
			<div class="bx-filter-sep"></div>
			<a href="javascript:void(0)" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.SwitchFilterRows(true)" class="bx-filter-btn bx-filter-show" title="<?= GetMessage("interface_grid_show_all")?>"></a>
			<a href="javascript:void(0)" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.SwitchFilterRows(false)" class="bx-filter-btn bx-filter-hide" title="<?= GetMessage("interface_grid_hide_all")?>"></a>
			<div class="bx-filter-sep"></div>
			<a href="javascript:void(0)" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.menu.ShowMenu(this, bxGrid_<?=$arParams["GRID_ID"]?>.filterMenu);" class="bx-filter-btn bx-filter-menu" title="<?= GetMessage("interface_grid_additional")?>"></a>
			<div class="empty" style="width:50px; float:left;"></div>
<?php if($arResult["OPTIONS"]["filter_shown"] <> "N"):?>
			<a href="javascript:void(0)" id="a_minmax_<?=$arParams["GRID_ID"]?>" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.SwitchFilter(this)" class="bx-filter-btn bx-filter-min" title="<?= GetMessage("interface_grid_to_head")?>"></a>
<?php else:?>
			<a href="javascript:void(0)" id="a_minmax_<?=$arParams["GRID_ID"]?>" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.SwitchFilter(this)" class="bx-filter-btn bx-filter-max" title="<?= GetMessage("interface_grid_from_head")?>"></a>
<?php endif?>
		</td>
	</tr>
	<tr class="bx-filter-content" id="flt_content_<?=$arParams["GRID_ID"]?>"<?php if($arResult["OPTIONS"]["filter_shown"] == "N"):?> style="display:none"<?php endif?>>
		<td>
			<table cellspacing="0" class="bx-filter-rows">
				<?php
foreach($arParams["FILTER"] as $field):
	$bShow = $arResult["FILTER_ROWS"][$field["id"]];
?>
				<tr id="flt_row_<?=$arParams["GRID_ID"]?>_<?=$field["id"]?>"<?php if($field["valign"] <> '') echo ' valign="'.$field["valign"].'"';?><?php if(!$bShow) echo ' style="display:none"'?>>
					<td><?=$field["name"]?>:</td>
					<td>
						<?php
	//default attributes
	if(!is_array($field["params"]))
		$field["params"] = array();
	if($field["type"] == '' || $field["type"] == 'text')
	{
		if($field["params"]["size"] == '')
			$field["params"]["size"] = "30";
	}
	elseif($field["type"] == 'date')
	{
		if($field["params"]["size"] == '')
			$field["params"]["size"] = "10";
	}
	elseif($field["type"] == 'number')
	{
		if($field["params"]["size"] == '')
			$field["params"]["size"] = "8";
	}
	
	$params = '';
	foreach($field["params"] as $p=>$v)
		$params .= ' '.$p.'="'.$v.'"';

	$value = $arResult["FILTER"][$field["id"]];

	switch($field["type"]):
		case 'custom':
			echo $field["value"];
			break;
		case 'checkbox':
?>
<input type="hidden" name="<?=$field["id"]?>" value="N">
<input type="checkbox" name="<?=$field["id"]?>" value="Y"<?=($value == "Y"? ' checked':'')?><?=$params?>>
	<?php
			break;
		case 'list':
			$bMulti = isset($field["params"]["multiple"]);
?>
<select name="<?=$field["id"].($bMulti? '[]':'')?>"<?=$params?>>
		<?php
			if(is_array($field["items"])):
				if(!is_array($value))
					$value = array($value);
				$bSel = false;
				if($bMulti):
?>
	<option value=""<?=($value[0] == ''? ' selected':'')?>><?= GetMessage("interface_grid_no_no_no")?></option>
				<?php
				endif;
				foreach($field["items"] as $k=>$v):
?>
	<option value="<?=htmlspecialcharsbx($k)?>"<?php if(in_array($k, $value) && (!$bSel || $bMulti)) {$bSel = true; echo ' selected';}?>><?=htmlspecialcharsbx($v)?></option>
				<?php
				endforeach;
?>
</select>
	<?php
			endif;
			break;
		case 'date':
			$APPLICATION->IncludeComponent(
				"bitrix:main.calendar.interval",
				"",
				array(
					"FORM_NAME" => "filter_".$arParams["GRID_ID"],
					"SELECT_NAME" => $field["id"]."_datesel",
					"SELECT_VALUE" => $arResult["FILTER"][$field["id"]."_datesel"],
					"INPUT_NAME_DAYS" => $field["id"]."_days",
					"INPUT_VALUE_DAYS" => $arResult["FILTER"][$field["id"]."_days"],
					"INPUT_NAME_FROM" => $field["id"]."_from",
					"INPUT_VALUE_FROM" => $arResult["FILTER"][$field["id"]."_from"],
					"INPUT_NAME_TO" => $field["id"]."_to",
					"INPUT_VALUE_TO" => $arResult["FILTER"][$field["id"]."_to"],
					"INPUT_PARAMS" => $params,
				),
				$component,
				array("HIDE_ICONS"=>true)
			);
?>
<script>
BX.ready(function(){bxCalendarInterval.OnDateChange(document.forms['filter_<?=$arParams["GRID_ID"]?>'].<?=$field["id"]?>_datesel)});
</script>
	<?php
			break;
		case 'quick':
?>
<input type="text" name="<?=$field["id"]?>" value="<?=htmlspecialcharsbx($value)?>"<?=$params?>>
		<?php
			if(is_array($field["items"])):
?>
<select name="<?=$field["id"]?>_list">
<?php foreach($field["items"] as $key=>$item):?>
	<option value="<?=htmlspecialcharsbx($key)?>"<?=($arResult["FILTER"][$field["id"]."_list"] == $key? ' selected':'')?>><?=htmlspecialcharsbx($item)?></option>
<?php endforeach?>
</select>
	<?php
			endif;
			break;
		case 'number':
?>
<input type="text" name="<?=$field["id"]?>_from" value="<?=htmlspecialcharsbx($arResult["FILTER"][$field["id"]."_from"])?>"<?=$params?>> ... 
<input type="text" name="<?=$field["id"]?>_to" value="<?=htmlspecialcharsbx($arResult["FILTER"][$field["id"]."_to"])?>"<?=$params?>>
	<?php
			break;
		default:
?>
<input type="text" name="<?=$field["id"]?>" value="<?=htmlspecialcharsbx($value)?>"<?=$params?>>
		<?php
			break;
	endswitch;
?>
					</td>
					<td class="bx-filter-minus"><a href="javascript:void(0)" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.SwitchFilterRow('<?=CUtil::addslashes($field["id"])?>')" class="bx-filter-minus" title="<?= GetMessage("interface_grid_hide")?>"></a></td>
				</tr>
<?php endforeach?>
			</table>
			<div class="bx-filter-buttons">
				<input type="submit" name="filter" value="<?= GetMessage("interface_grid_find")?>" title="<?= GetMessage("interface_grid_find_title")?>">
				<input type="button" name="" value="<?= GetMessage("interface_grid_flt_cancel")?>" title="<?= GetMessage("interface_grid_flt_cancel_title")?>" onclick="bxGrid_<?=$arParams["GRID_ID"]?>.ClearFilter(this.form)">
				<input type="hidden" name="clear_filter" value="">
			</div>
		</td>
	</tr>
</table>

</form>
</div>
<?php endif;?>
