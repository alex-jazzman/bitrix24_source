<?php

use Bitrix\Main\Localization\Loc;

if (!check_bitrix_sessid()) {
    return false;
}

Loc::loadMessages(__FILE__);
$moduleId = strtolower(basename(dirname(__DIR__)));
?>
<form action="<?=$APPLICATION->GetCurPage()?>">
    <?=bitrix_sessid_post()?>
    <input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
    <input type="hidden" name="id" value="<?=$moduleId?>">
    <input type="hidden" name="uninstall" value="Y">
    <input type="hidden" name="step" value="2">

    <?=CAdminMessage::ShowMessage(Loc::getMessage('MOD_UNINST_WARN'))?>
    <input type="submit" name="" value="<?=Loc::getMessage('MOD_UNINST_DEL')?>">
</form>
