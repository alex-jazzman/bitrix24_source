<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;

Loc::loadLanguageFile(__FILE__);

$arActivityDescription = [
    'NAME' => Loc::getMessage('SMS4B_ROBOT_NAME'),
    'DESCRIPTION' => Loc::getMessage('SMS4B_ROBOT_DESC'),
    'TYPE' => ['robot_activity'],
    'CLASS' => 'Sms4bRobotSendSms',
    'JSCLASS' => 'BizProcActivity',
    'CATEGORY' => [
        'ID' => 'rest',
        'OWN_ID' => 'sms4b',
        'OWN_NAME' => Loc::getMessage('SMS4B_ROBOT_CATEGORY_NAME')
    ],
    'FILTER' => [
        'INCLUDE' => [
            ['crm', 'CCrmDocumentDeal'],
            ['crm', 'CCrmDocumentLead']
        ],
    ],
    'ROBOT_SETTINGS' => [
        'IS_AUTO' => true
    ]
];
