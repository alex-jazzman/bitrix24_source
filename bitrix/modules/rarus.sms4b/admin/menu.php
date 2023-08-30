<?php

use \Bitrix\Main\Localization\Loc;

Loc::loadLanguageFile(__FILE__);

if ($GLOBALS['APPLICATION']->GetGroupRight('rarus.sms4b') !== 'D') {
    $aMenu = [
        'parent_menu' => 'global_menu_services',
        'section'     => 'sms4b',
        'sort'        => 100,
        'text'        => Loc::getMessage('SMS4B_MAIN_MENU_MAIN'),
        'title'       => Loc::getMessage('SMS4B_MAIN_MENU_MAIN_TITLE'),
        'url'         => 'sms4b_index.php?lang=' . LANGUAGE_ID,
        'icon'        => 'sms4b_menu_icon',
        'page_icon'   => 'sms4b_page_icon',
        'items_id'    => 'menu_sms4b',
        'items'       => [
            [
                'text'     => Loc::getMessage('SMS4B_MAIN_SENDSMS'),
                'url'      => 'sms4b_sendsms.php?lang=' . LANGUAGE_ID,
                'title'    => Loc::getMessage('SMS4B_MAIN_SENDSMS_ALT'),
                'more_url' => []
            ],
            [
                'text'     => Loc::getMessage('SMS4B_MAIN_BALANCE'),
                'url'      => 'sms4b_balance.php?lang=' . LANGUAGE_ID,
                'title'    => Loc::getMessage('SMS4B_MAIN_BALANCE_ALT'),
                'more_url' => []
            ],
            [
                'text'     => Loc::getMessage('SMS4B_MAIN_SMS_LIST_OUT'),
                'url'      => 'sms4b_sms_out_list.php?lang=' . LANGUAGE_ID,
                'title'    => Loc::getMessage('SMS4B_MAIN_SMS_LIST_OUT_ALT'),
                'more_url' => []
            ],
            [
                'text'     => Loc::getMessage('SMS4B_MAIN_SMS_LIST_INC'),
                'url'      => 'sms4b_sms_inc_list.php?lang=' . LANGUAGE_ID,
                'title'    => Loc::getMessage('SMS4B_MAIN_SMS_LIST_INC_ALT'),
                'more_url' => []
            ]
        ]
    ];

    return $aMenu;
}
return false;
