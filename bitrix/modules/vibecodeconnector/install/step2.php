<?php

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settingsUrl = '/bitrix/admin/settings.php?lang=' . LANGUAGE_ID . '&mid=vibecodeconnector&mid_menu=1';
?>
<?php CAdminMessage::ShowNote(Loc::getMessage('VIBECODECONNECTOR_INSTALL_DONE_TEXT')); ?>

<p><?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_INSTALL_DONE_NEXT')) ?></p>

<p>
	<a href="<?= htmlspecialcharsbx($settingsUrl) ?>"><?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_INSTALL_DONE_SETTINGS_LINK')) ?></a>
</p>
