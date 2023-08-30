<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

$GLOBALS['APPLICATION']->IncludeComponent('rarus.sms4b:subscribe.edit', '.default', [
        'SHOW_HIDDEN' => 'N',
        'SHOW_POST_FORM' => 'Y',
        'SHOW_SMS_FORM' => 'N',
        'SHOW_RUBS' => [
            0 => '5',
            1 => '7',
            2 => '3',
            3 => '6',
            4 => '4',
            5 => '1',
            6 => '8',
            7 => '2'
        ],
        'CACHE_TYPE' => 'A',
        'CACHE_TIME' => '3600',
        'ALLOW_ANONYMOUS' => 'Y',
        'SHOW_AUTH_LINKS' => 'N',
        'TEMPLATE_ID' => '',
        'SET_TITLE' => 'Y'
    ]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
