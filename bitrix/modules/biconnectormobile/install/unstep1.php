<?php

/** @var CMain $APPLICATION */

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loc::loadMessages(__FILE__);
?>
<form action="<?= $APPLICATION->GetCurPage() ?>">
	<?= bitrix_sessid_post() ?>
	<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
	<input type="hidden" name="id" value="biconnectormobile">
	<input type="hidden" name="uninstall" value="Y">
	<input type="hidden" name="step" value="2">
	<?php CAdminMessage::showMessage(GetMessage('MOD_UNINST_WARN')) ?>
	<p><?= Loc::getMessage('BICONNECTORMOBILE_UNINSTALL_DESCRIPTION') ?></p>
	<input type="submit" name="inst" value="<?= GetMessage('MOD_UNINST_DEL') ?>">
</form>
