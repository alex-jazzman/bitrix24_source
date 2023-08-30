<?php
use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

$aMenuLinks = [
    [
        Loc::getMessage('SMS4B_MAIN_MENUE_1'),
        'subscribe_demo.php',
        [],
        [],
        ''
    ],
    [
        Loc::getMessage('SMS4B_MAIN_MENUE_2'),
        'subscr_edit.php',
        [],
        [],
        ''
    ],
    [
        Loc::getMessage('SMS4B_MAIN_MENUE_3'),
        'subscr_edit_sms.php',
        [],
        [],
        ''
    ]
];
