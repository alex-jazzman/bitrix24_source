<?
IncludeModuleLangFile(__FILE__);
?>
<form action="<?echo $APPLICATION->GetCurPage()?>">
	<?=bitrix_sessid_post()?>
	<input type="hidden" name="lang" value="<?echo LANG?>">
	<input type="hidden" name="id" value="salescenter">
	<input type="hidden" name="uninstall" value="Y">
	<input type="hidden" name="step" value="2">

	<?echo GetMessage("SALESCENTER_UNINSTALL_TITLE_MSGVER_1")?>
	<div class="adm-info-message-wrap">
		<div class="adm-info-message">
			<div><?echo GetMessage("SALESCENTER_UNINSTALL_QUESTION")?></div>
		</div>
	</div>
	<p><input type="checkbox" name="savedata" id="savedata" value="Y" checked><label for="savedata"><?echo GetMessage("MOD_UNINST_SAVE_TABLES")?></label></p>
	<input type="submit" name="inst" value="<?echo GetMessage("MOD_UNINST_DEL")?>">
</form>
