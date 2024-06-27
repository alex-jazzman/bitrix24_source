<?php
if (!check_bitrix_sessid())
{
	return;
}
/** @var CMain $APPLICATION */
if ($ex = $APPLICATION->GetException())
{
	echo CAdminMessage::ShowMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => GetMessage('MOD_INST_ERR'),
		'DETAILS' => $ex->GetString(),
		'HTML' => true,
	]);
}
else
{
	echo CAdminMessage::ShowNote(GetMessage('MOD_INST_OK'));
}
?>
<form action="<?php echo $APPLICATION->GetCurPage()?>">
	<input type="hidden" name="lang" value="<?php echo LANGUAGE_ID?>">
	<input type="submit" name="" value="<?php echo GetMessage('MOD_BACK')?>">
<form>
