<?php
IncludeModuleLangFile(__FILE__);

global $APPLICATION;

if (!check_bitrix_sessid())
{
	return;
}

if ($exception = $APPLICATION->GetException())
{
	CAdminMessage::ShowMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => GetMessage('MAILMOBILE_MODULE_UNINSTALL_ERROR'),
		'DETAILS' => $exception->GetString(),
		'HTML' => true,
	]);
	?>
	<form action="<?= $APPLICATION->GetCurPage() ?>">
		<p>
			<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
			<input type="submit" name="" value="<?= GetMessage('MOD_BACK') ?>">
		</p>
	</form>
	<?php
}
else
{
	?>
	<form action="<?=$APPLICATION->GetCurPage()?>">
		<?=bitrix_sessid_post()?>
		<input type="hidden" name="lang" value="<?=LANG?>">
		<input type="hidden" name="id" value="mailmobile">
		<input type="hidden" name="uninstall" value="Y">
		<input type="hidden" name="step" value="2">

		<?php CAdminMessage::ShowMessage([
			'TYPE' => 'ERROR',
			'MESSAGE' => GetMessage('MAILMOBILE_MODULE_UNINSTALL_WARNING', ['#BR#' => '<br />']),
			'HTML' => true,
		])?>

		<input type="submit" name="inst" value="<?=GetMessage("MOD_UNINST_DEL")?>">
	</form>
	<?php
}
