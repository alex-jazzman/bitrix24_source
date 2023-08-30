<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?php
//***********************************
//status and unsubscription/activation section
//***********************************
?>
<form action="<?=$arResult["FORM_ACTION"]?>" method="get">
<table width="100%" border="0" cellpadding="0" cellspacing="0" class="data-table">
	<thead><tr><td colspan="3"><?php echo GetMessage("subscr_title_status")?></td></tr></thead>
	<tr valign="top">
		<td nowrap><?php echo GetMessage("subscr_conf")?></td>
		<td nowrap class="<?php echo ($arResult["SUBSCRIPTION"]["CONFIRMED"] == "Y"? "notetext":"errortext")?>"><?php echo ($arResult["SUBSCRIPTION"]["CONFIRMED"] == "Y"? GetMessage("subscr_yes"):GetMessage("subscr_no"));?></td>
		<td width="60%" rowspan="5">
            <?php if($arResult["SUBSCRIPTION"]["CONFIRMED"] <> "Y"):?>
				<p><?php echo GetMessage("subscr_title_status_note1")?></p>
            <?php elseif($arResult["SUBSCRIPTION"]["ACTIVE"] == "Y"):?>
				<p><?php echo GetMessage("subscr_title_status_note2")?></p>
				<p><?php echo GetMessage("subscr_status_note3")?></p>
            <?php else:?>
				<p><?php echo GetMessage("subscr_status_note4")?></p>
				<p><?php echo GetMessage("subscr_status_note5")?></p>
            <?php endif;?>
		</td>
	</tr>
	<tr>
		<td nowrap><?php echo GetMessage("subscr_act")?></td>
		<td nowrap class="<?php echo ($arResult["SUBSCRIPTION"]["ACTIVE"] == "Y"? "notetext":"errortext")?>"><?php echo ($arResult["SUBSCRIPTION"]["ACTIVE"] == "Y"? GetMessage("subscr_yes"):GetMessage("subscr_no"));?></td>
	</tr>
	<tr>
		<td nowrap><?php echo GetMessage("adm_id")?></td>
		<td nowrap><?php echo $arResult["SUBSCRIPTION"]["ID"];?>&nbsp;</td>
	</tr>
	<tr>
		<td nowrap><?php echo GetMessage("subscr_date_add")?></td>
		<td nowrap><?php echo $arResult["SUBSCRIPTION"]["DATE_INSERT"];?>&nbsp;</td>
	</tr>
	<tr>
		<td nowrap><?php echo GetMessage("subscr_date_upd")?></td>
		<td nowrap><?php echo $arResult["SUBSCRIPTION"]["DATE_UPDATE"];?>&nbsp;</td>
	</tr>
    <?php if($arResult["SUBSCRIPTION"]["CONFIRMED"] == "Y"):?>
		<tfoot><tr><td colspan="3">
                <?php if($arResult["SUBSCRIPTION"]["ACTIVE"] == "Y"):?>
			<input type="submit" name="unsubscribe" value="<?=GetMessage("subscr_unsubscr")?>" />
			<input type="hidden" name="action" value="unsubscribe" />
                <?php else:?>
			<input type="submit" name="activate" value="<?=GetMessage("subscr_activate")?>" />
			<input type="hidden" name="action" value="activate" />
                <?php endif;?>
		</td></tr></tfoot>
    <?php endif;?>
</table>
<input type="hidden" name="ID" value="<?=$arResult["SUBSCRIPTION"]["ID"];?>" />
    <?php echo bitrix_sessid_post();?>
</form>
<br />