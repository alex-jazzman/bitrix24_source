<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

$GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_TITLE'));
?>

    <?=Loc::getMessage('SMS4B_MAIN_INDEX_MENU_1')?>

    <div style="margin:10px">
        <table cellpadding="5" border=0>
            <tr>
                <td><a href="subscribe_demo.php"><?=Loc::getMessage('SMS4B_MAIN_INDEX_MENU_2')?></a></td>
            </tr>
            <tr>
                <td><a href="subscr_edit.php"><?=Loc::getMessage('SMS4B_MAIN_INDEX_MENU_3')?></a></td>
            </tr>
            <tr>
                <td><a href="subscr_edit_sms.php"><?=Loc::getMessage('SMS4B_MAIN_INDEX_MENU_4')?></a></td>
            </tr>
            <tr>
                <td><a href="corportal.php"><?=Loc::getMessage('SMS4B_MAIN_INDEX_MENU_6')?></a></td>
            </tr>
            <tr>
                <td><a href="contact.php"><?=Loc::getMessage('SMS4B_MAIN_INDEX_MENU_7')?></a></td>
            </tr>
        </table>
    </div>
<?php require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
