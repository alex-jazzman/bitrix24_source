<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);
?>
    <h2><?=Loc::getMessage('SMS4B_MAIN_TITLE_2')?></h2>
<?php $APPLICATION->IncludeComponent('rarus.sms4b:subscribe.index', '.default', [
        'SHOW_COUNT' => 'N',
        'SHOW_HIDDEN' => 'Y',
        'SHOW_POST_FORM' => 'Y',
        'SHOW_SMS_FORM' => 'N',
        'SHOW_RUBS' => [],
        'PAGE' => '#SITE_DIR#sms4b_demo/subscr_edit.php',
        'CACHE_TYPE' => 'A',
        'CACHE_TIME' => '3600',
        'SET_TITLE' => 'Y'
    ]
); ?>
    <hr/>
    <h2><?=Loc::getMessage('SMS4B_MAIN_TITLE_3')?></h2>
<?php $APPLICATION->IncludeComponent('rarus.sms4b:subscribe.index', '.default', [
        'SHOW_COUNT' => 'Y',
        'SHOW_HIDDEN' => 'Y',
        'SHOW_POST_FORM' => 'N',
        'SHOW_SMS_FORM' => 'Y',
        'SHOW_RUBS' => [],
        'PAGE' => '#SITE_DIR#sms4b_demo/subscr_edit_sms.php',
        'CACHE_TYPE' => 'A',
        'CACHE_TIME' => '3600',
        'SET_TITLE' => 'N'
    ]
); ?>
<?php require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
