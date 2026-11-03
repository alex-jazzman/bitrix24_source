<?php

/** @var CMain $APPLICATION */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!check_bitrix_sessid())
{
	return;
}

$exception = $APPLICATION->GetException();
if ($exception)
{
	CAdminMessage::showMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => GetMessage('MOD_INST_ERR'),
		'DETAILS' => $exception->GetString(),
		'HTML' => true,
	]);
}
else
{
	CAdminMessage::showNote(GetMessage('MOD_INST_OK'));
}
?>
<form action="<?= $APPLICATION->GetCurPage() ?>">
	<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
	<input type="submit" value="<?= GetMessage('MOD_BACK') ?>">
</form>
