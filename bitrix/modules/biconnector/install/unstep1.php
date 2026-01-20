<?php
/** @var CMain $APPLICATION */

if (
	isset($biconnector_uninstaller_errors)
	&& is_array($biconnector_uninstaller_errors)
	&& (count($biconnector_uninstaller_errors) > 0)
):
	$errors = implode("<br>", $biconnector_uninstaller_errors);

	CAdminMessage::ShowMessage([
		"TYPE" => "ERROR",
		"MESSAGE" => GetMessage("MOD_UNINST_ERR"),
		"DETAILS" => $errors,
		"HTML" => true,
	]);
	?>

	<form action="<?= $APPLICATION->GetCurPage()?>">
		<?=bitrix_sessid_post()?>
		<input type="hidden" name="lang" value="<?= LANG?>">
		<input type="submit" name="" value="<?= GetMessage("MOD_BACK")?>">
	</form>

<?php else: ?>

	<form action="<?php echo $APPLICATION->GetCurPage()?>">
		<?=bitrix_sessid_post()?>
		<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
		<input type="hidden" name="id" value="biconnector">
		<input type="hidden" name="uninstall" value="Y">
		<input type="hidden" name="step" value="2">
		<?php CAdminMessage::ShowMessage(GetMessage('MOD_UNINST_WARN'))?>
		<p><?php echo GetMessage('MOD_UNINST_SAVE')?></p>
		<p>
			<input type="checkbox" name="save_tables" id="save_tables" value="Y" checked>
			<label for="save_tables"><?php echo GetMessage('MOD_UNINST_SAVE_TABLES')?></label>
		</p>
		<input type="submit" name="inst" value="<?php echo GetMessage('MOD_UNINST_DEL')?>">
	</form>

<?php endif; ?>
