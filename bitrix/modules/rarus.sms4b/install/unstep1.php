<?php
use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);
?>

<form action="<?= $GLOBALS['APPLICATION']->GetCurPage() ?>">
    <?= bitrix_sessid_post() ?>
    <input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
    <input type="hidden" name="id" value="rarus.sms4b">
    <input type="hidden" name="uninstall" value="Y">
    <input type="hidden" name="step" value="2">
    <?= CAdminMessage::ShowMessage(Loc::getMessage('SMS4B_MAIN_CAUTION_MESS')) ?>
    <p><?= Loc::getMessage('SMS4B_MAIN_UNINST_MESS_1') ?></p>
    <p><input type="checkbox" name="save_tables" id="save_tables" value="Y" checked><label
            for="save_tables"><?= Loc::getMessage('SMS4B_MAIN_UNINST_MESS_2') ?></label></p>
    <p><input type="checkbox" name="save_templates" id="save_templates" value="Y" checked><label
            for="save_templates"><?= Loc::getMessage('SMS4B_MAIN_UNINST_SAVE_TEMPLATE') ?></label></p>
    <p><input type="checkbox" name="SAVE_COMPONENTS" id="SAVE_COMPONENTS" value="Y"/><label
            for="SAVE_COMPONENTS"><?= Loc::getMessage('SMS4B_MAIN_UNINST_MESS_3') ?></label><br/>
        <font color="red"><?= Loc::getMessage('SMS4B_MAIN_CAUTION_MESS_1') ?></font></p>
    <p><input type="checkbox" name="SAVE_DEMO" id="SAVE_DEMO" value="Y"/><label
            for="SAVE_DEMO"><?= Loc::getMessage('SMS4B_MAIN_SAVE_DEMO_PART') ?></label><br/>
        <font color="red"><?= Loc::getMessage('SMS4B_MAIN_CAUTION_MESS_2') ?></font>
    </p>
    <p><input type="checkbox" name="SAVE_HELP" id="SAVE_HELP" value="Y"/><label
            for="SAVE_HELP"><?= Loc::getMessage('SMS4B_MAIN_SAVE_DOCS') ?></label></p>
    <input type="submit" name="inst" value="<?= Loc::getMessage('SMS4B_MAIN_UNINST_MOD') ?>">
</form>