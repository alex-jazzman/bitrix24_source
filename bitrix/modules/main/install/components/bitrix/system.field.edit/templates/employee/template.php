<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2013 Bitrix
 */

/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponentTemplate $this
 */

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

global $USER_FIELD_MANAGER;

$name = $arParams["arUserField"]["~FIELD_NAME"];
?>
<table id="table_<?=$name?>" width="100%" cellpadding="0" cellspacing="0">
	<?php
foreach ($arResult["VALUE"] as $i => $ID)
{
	$name_c = ($arParams["arUserField"]["MULTIPLE"] == "Y"? $name.'['.$i.']' : $name);
	$name_x = preg_replace("/[\\[\\]]/is", "_", $name_c);
?>
	<tr>
		<td>
		<input type="text" name="<?=$name_c?>" id="<?= $name_x?>" value="<?= intval($ID) > 0 ? intval($ID) : ''?>" size="3" class="typeinput" />
			<?php
		$APPLICATION->IncludeComponent(
			'bitrix:intranet.user.search',
			'',
			array(
				'INPUT_NAME' => $name_x,
				'MULTIPLE' => 'N',
				'SHOW_BUTTON' => 'Y'
			),
			null,
			array('HIDE_ICONS' => 'Y')
		)
?>
		<IFRAME style="width:0; height:0; border: 0; display: none;" src="javascript:void(0)" name="hiddenframe<?=$name_c?>" id="hiddenframe<?=$name_x?>"></IFRAME>
		<br /><span id="div_<?=$name_x?>"></span>

		<script data-skip-moving="true">
		var value_<?=$name_x?> = '';
		function Ch<?=$name_x?>()
		{
			var DV_<?=$name_x?> = document.getElementById("div_<?=$name_x?>");
			if (document.getElementById('<?= $name_x?>'))
			{
				var old_value = value_<?=$name_x?>;
				value_<?=$name_x?> = parseInt(document.getElementById('<?= $name_x?>').value);
				if (value_<?=$name_x?> > 0)
				{
					if (old_value != value_<?=$name_x?>)
					{
						DV_<?=$name_x?>.innerHTML = '<i><?= CUtil::JSEscape(GetMessage("MAIN_WAIT"))?></i>';
						document.getElementById("hiddenframe<?=$name_x?>").src='/bitrix/admin/get_user.php?ID=' + value_<?=$name_x?>+'&strName=<?=$name_x?>&lang=<?= LANG.(defined("ADMIN_SECTION") && ADMIN_SECTION===true?"&admin_section=Y":"")?>';
					}

				}
				else
				{
					DV_<?=$name_x?>.innerHTML = '';
				}
			}
			setTimeout(function(){Ch<?=$name_x?>()},1000);
		}
		Ch<?=$name_x?>();
		</script>
		</td>
	</tr>
	<?php
}
?>
	<?php
if($arParams["arUserField"]["MULTIPLE"] == "Y"):
?>
<tr>
	<td>
		<?= $USER_FIELD_MANAGER->ShowScript();?>
		<input type="button" value="<?=GetMessage("USER_TYPE_PROP_ADD")?>" onclick="addNewRow('table_<?=$name?>', '<?=$name?>')">
	</td>
</tr>
<?php
endif; //multiple
?>
<script>
	BX.addCustomEvent('onAutoSaveRestore',
	function(ob, data)
	{
		for (var i in data)
		{
			if (i.substring(0,<?=(mb_strlen($name) + 1)?>)=='<?=CUtil::JSEscape($name)?>[')
			{
				addNewRow('table_<?=$name?>', '<?=$name?>');
			}
		}
	})
</script>
</table>
