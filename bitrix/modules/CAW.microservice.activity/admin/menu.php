<?php

use Bitrix\Main\Localization\Loc;

Loc::loadLanguageFile(__FILE__);

$aMenu = array(
    'parent_menu' => 'global_menu_settings',
    'sort' => 150,
    'text' => "CAW Настройки микросервис согласования",
    'title' => "CAW Настройки микросервис согласования",
    'icon' => 'sale_menu_icon_statistic',
    'page_icon' => 'sale_menu_icon_statistic',
    'items_id' => 'menu_CAW',
    'items' => array(
        array(
            'text' => "CAW Настройки микросервис согласования",
            'title' => "CAW Настройки микросервис согласования",
            'url' => '/bitrix/admin/CAWSettings.php?lang=' . LANGUAGE_ID,
        ),
    )
);

return  $aMenu;