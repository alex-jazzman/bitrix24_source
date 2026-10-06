<?php

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
global $APPLICATION;

if ($exception = $APPLICATION->GetException())
{
	CAdminMessage::showMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_ERROR'),
		'DETAILS' => $exception->GetString(),
		'HTML' => true,
	]);
	?>
	<form action="<?= htmlspecialcharsbx($APPLICATION->GetCurPage()) ?>">
		<input type="hidden" name="lang" value="<?= htmlspecialcharsbx(LANGUAGE_ID) ?>">
		<input type="submit" name="" value="<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_BACK')) ?>">
	</form>
	<?php
}
