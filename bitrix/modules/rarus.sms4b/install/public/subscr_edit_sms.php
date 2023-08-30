<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

$GLOBALS['APPLICATION']->IncludeComponent('rarus.sms4b:subscribe.edit', '.default', [
        'SHOW_HIDDEN' => 'Y',
        'SHOW_POST_FORM' => 'N',
        'SHOW_SMS_FORM' => 'Y',
        'SHOW_RUBS' => [],
        'CACHE_TYPE' => 'A',
        'CACHE_TIME' => '3600',
        'ALLOW_ANONYMOUS' => 'Y',
        'SHOW_AUTH_LINKS' => 'Y',
        'TEMPLATE_ID' => '',
        'SET_TITLE' => 'Y'
    ]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
