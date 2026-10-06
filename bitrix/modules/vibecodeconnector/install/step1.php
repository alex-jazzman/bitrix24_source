<?php

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
global $APPLICATION;

if ($ex = $APPLICATION->GetException())
{
	CAdminMessage::ShowMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => $ex->GetString(),
		'HTML' => true,
	]);
}

?>
<form action="<?= htmlspecialcharsbx($APPLICATION->GetCurPage()) ?>" method="POST" name="form1">
	<div class="adm-info-message-wrap">
		<div class="adm-info-message">
			<div class="adm-info-message-title"><?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_HEADING')) ?></div>
			<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_WARNING')) ?>
		</div>
	</div>

	<p>
		<label>
			<input type="checkbox" name="beta_accept" value="Y" checked>
			<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_ACCEPT')) ?>
		</label>
	</p>

	<?= bitrix_sessid_post() ?>
	<input type="hidden" name="lang" value="<?= htmlspecialcharsbx(LANGUAGE_ID) ?>">
	<input type="hidden" name="id" value="vibecodeconnector">
	<input type="hidden" name="install" value="Y">
	<input type="hidden" name="step" value="2">
	<input type="submit" name="inst" value="<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_SUBMIT')) ?>">
</form>
