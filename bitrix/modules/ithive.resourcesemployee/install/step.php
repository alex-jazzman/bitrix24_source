<?php

use Bitrix\Main\Localization\Loc;

if (!check_bitrix_sessid()) {
    return false;
}
Loc::loadMessages(__FILE__);

if ($ex = $APPLICATION->GetException()) {
    echo CAdminMessage::ShowMessage([
        'TYPE' => 'ERROR',
        'MESSAGE' => Loc::getMessage('ITHIVE_RESOURCESEMPLOYEE_INSTALL_ERROR'),
        'DETAILS' => $ex->GetString(),
        'HTML' => true,
    ]);
} else {
	echo CAdminMessage::showMessage([
		"TYPE" => "OK",
		"MESSAGE" => Loc::getMessage("ITHIVE_RESOURCESEMPLOYEE_SUCCESS"),
		"HTML" => true]);
}
?>

<form action="<?=$APPLICATION->GetCurPage()?>">
    <input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
    <input type="submit" name="" value="<?=Loc::getMessage('MOD_BACK')?>">
</form>