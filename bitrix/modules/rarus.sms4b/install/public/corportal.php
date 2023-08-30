<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

$GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_TITLE'));
?>

<?php
if(IsModuleInstalled('crm')) {
    $APPLICATION->IncludeComponent('rarus.sms4b:sendSmsPublic', '.default', [
        'ALLOW_SEND_ANY_NUM' => 'N',
        'SET_TITLE' => 'Y'
    ],
        false
    );
} else {
    echo '<div style="color: red;">' . Loc::getMessage('SMS4B_MAIN_CRM_NOT_INSTALL') . '</div>';
}
?>

<?php require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'); ?>