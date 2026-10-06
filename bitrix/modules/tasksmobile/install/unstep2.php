<?php
	global $APPLICATION;

	if(!check_bitrix_sessid())
	{
		return;
	}

	if ($exception = $APPLICATION->GetException())
	{
		CAdminMessage::ShowMessage([
			'TYPE' => 'ERROR',
			'MESSAGE' => GetMessage('MOD_UNINST_ERR'),
			'DETAILS' => $exception->GetString(),
			'HTML' => true,
		]);
	}
	else
	{
		CAdminMessage::ShowNote(GetMessage('MOD_UNINST_OK'));
	}
?>

<form action="<?=$APPLICATION->GetCurPage()?>">
	<input type="hidden" name="lang" value="<?=LANG?>">
	<input type="submit" name="" value="<?=GetMessage('MOD_BACK')?>">
<form>
