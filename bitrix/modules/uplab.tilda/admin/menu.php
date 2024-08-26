<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;

global $APPLICATION;

Loader::includeModule("uplab.tilda");

CJSCore::Init('jquery');
Asset::getInstance()->addJs("/bitrix/js/uplab.tilda/script.js");

$aMenu = [
    "parent_menu" => "global_menu_content",
    "section"     => "Uplab",
    "sort"        => 50,
    "text"        => Loc::getMessage("uplab.tilda_MENU_TITLE"),
    "icon"        => "blog_menu_icon",
    "page_icon"   => "util_page_icon",
    "items_id"    => "uplab_tilda",
    "items"       => [
        [
            "text" => Loc::getMessage('uplab.tilda_PAGES'),
            "url"  => "/bitrix/admin/uplab.tilda_cache_table.php",
        ],
        [
            "text" => Loc::getMessage('uplab.tilda_CLEAR_CACHE_LIST_MENU_TITLE'),
            "url"  => "javascript:uTildaClearCacheList('" . Loc::getMessage("uplab.tilda_CLEAR_CACHE_LIST_CONFIRM") . "');",
        ],
        [
            "text" => Loc::getMessage('uplab.tilda_CLEAR_CACHE_MENU_TITLE'),
            "url"  => "javascript:uTildaClearCache('" . Loc::getMessage("uplab.tilda_CLEAR_CACHE_CONFIRM") . "');",
        ],
    ],
];

return $aMenu;
