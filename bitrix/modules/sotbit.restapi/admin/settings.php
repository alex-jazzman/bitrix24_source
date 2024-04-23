<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Sale\Internals\PersonTypeTable;
use Bitrix\Main\GroupTable;
use Bitrix\Main\Config\Option;
use Sotbit\RestAPI\Core\AdminHelper;
use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\Core\Helper;
use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager,
    Bitrix\Iblock,
    Bitrix\Catalog,
    Bitrix\Currency;

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

Loc::loadMessages(__FILE__);
global $APPLICATION;
$moduleId = \SotbitRestAPI::MODULE_ID;
$request = Application::getInstance()->getContext()->getRequest();
$siteID = $request->getQuery('site');


if($APPLICATION->GetGroupRight("main") < "R") {
    $APPLICATION->AuthForm(Loc::getMessage("ACCESS_DENIED"));
}
require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_admin.php');


/**
 * Check depends
 */
$supportModule = Loader::includeModule('support');
$iblockModule = Loader::includeModule('iblock');
$catalogModule = Loader::includeModule('catalog');
$saleModule = Loader::includeModule('sale');
$b2bmobileModule = Loader::includeModule('sotbit.b2bmobile');




/*if(!Loader::includeModule('iblock')) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_IBLOCK_MODULE"));
}
if(!Loader::includeModule('catalog')) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_CATALOG_MODULE"));
}*/

if(PHP_VERSION_ID < 70200) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_PHP_VERSION"));
}

$routesMap = include __DIR__.'/_routes_map.php';

// include catalog settings
if($iblockModule && $catalogModule && $saleModule) {
    include __DIR__.'/_data.php';
}


/*
 * USER GROUPS
 */

$userGroups["REFERENCE_ID"][] = "";
$userGroups["REFERENCE"][] = Loc::getMessage($moduleId.'_EMPTY');
$result = \CGroup::GetList($by = 'id', $order = 'ASC', ['ACTIVE' => 'Y', 'ANONYMOUS' => 'N'], 'Y');
while($group = $result->fetch()) {
    $userGroups['REFERENCE_ID'][] = $group['ID'];
    $userGroups['REFERENCE'][] = '['.$group['ID'].'] '.$group['NAME'].' ('.$group['USERS'].')';
}

/**
 * TABS
 */
$arTabs = [];

// TABS - main
$arTabs[] = [
    'DIV'   => 'edit1',
    'TAB'   => Loc::getMessage($moduleId.'_TAB_MAIN'),
    'ICON'  => '',
    'TITLE' => Loc::getMessage($moduleId.'_TAB_MAIN'),
    'SORT'  => '10',
];

// TABS - auth
$arTabs[] = [
    'DIV'   => 'edit2',
    'TAB'   => Loc::getMessage($moduleId.'_TAB_AUTH'),
    'ICON'  => '',
    'TITLE' => Loc::getMessage($moduleId.'_TAB_AUTH'),
    'SORT'  => '10',
];

// TABS - config data
if($iblockModule && $catalogModule && $saleModule) {
    $b2bmobileWarning = $b2bmobileModule ? ['WARNING_TEXT' => Loc::getMessage($moduleId.'_TAB_CONFIG_WARNING_TEXT')] : [];
    $arTabs[] = array_merge([
        'DIV'   => 'edit3',
        'TAB'   => Loc::getMessage($moduleId.'_TAB_CONFIG'),
        'ICON'  => '',
        'TITLE' => Loc::getMessage($moduleId.'_TAB_CONFIG'),
        'SORT'  => '10',

    ], $b2bmobileWarning);
}

// TABS - routes map
$arTabs[] = [
    'DIV'   => 'edit4',
    'TAB'   => Loc::getMessage($moduleId.'_TAB_ROUTE'),
    'ICON'  => '',
    'TITLE' => Loc::getMessage($moduleId.'_TAB_ROUTE'),
    'SORT'  => '10',
];


/**
 * GROUPS
 */
$arGroups = [];
$tabNum = 1;

// GROUPS - main
$arGroups = array_merge($arGroups, [
    'OPTION_GROUP_MAIN' => [
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_MAIN'),
        'TAB'   => $tabNum,
    ]
]);
$tabNum++;

// GROUPS - auth
$arGroups = array_merge($arGroups, [
    'OPTION_GROUP_AUTH' => [
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_AUTH'),
        'TAB'   => $tabNum,
    ],
    'OPTION_GROUP_PERMISSIONS' => [
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_PERMISSIONS'),
        'TAB'   => $tabNum,
    ],
]);
$tabNum++;

// GROUPS - config data
if($iblockModule && $catalogModule && $saleModule) {
    $arGroups = array_merge($arGroups, [
        'OPTION_GROUP_CONFIG_CATALOG_ACTIVE'         => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_ACTIVE'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_CONNECT'        => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_CONNECT'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_SETTING'        => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_SETTING'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_PRICES' => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_PRICES'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_DATA'   => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_DATA'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_VIEW'   => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_VIEW'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_BASKET' => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_BASKET'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_SEARCH' => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_SEARCH'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_LIST'   => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_LIST'),
            'TAB'   => $tabNum,
        ],
        'OPTION_GROUP_CONFIG_CATALOG_DETAIL' => [
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_CONFIG_CATALOG_DETAIL'),
            'TAB'   => $tabNum,
        ]
    ]);
    $tabNum++;
}

// GROUPS - route map
$arGroups[] = [
    'OPTION_GROUP_ROUTE' => [
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_GROUP_ROUTE'),
        'TAB'   => $tabNum,
    ],
];
$tabNum++;


/**
 * OPTIONS
 */
$arOptions = [];

// OPTIONS - main
$arOptions += [
    'ACTIVE' => [
        'GROUP' => 'OPTION_GROUP_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_ACTIVE'),
        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_ACTIVE_HELP'),
        'TYPE'  => 'CHECKBOX',
        'SORT'  => '10',
    ],
    'DEBUG'  => [
        'GROUP' => 'OPTION_GROUP_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_DEBUG'),
        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_DEBUG_HELP'),
        'TYPE'  => 'CHECKBOX',
        'SORT'  => '20',
    ],
    'LOG'    => [
        'GROUP' => 'OPTION_GROUP_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_LOG'),
        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_LOG_HELP'),
        'TYPE'  => 'CHECKBOX',
        'SORT'  => '20',
    ],
    'URL'    => [
        'GROUP' => 'OPTION_GROUP_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_URL'),
        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_URL_HELP'),
        'NOTES' => Loc::getMessage($moduleId.'_OPTION_URL_NOTES'),
        'TYPE'  => 'STRING',
        'SORT'  => '30',
    ]
];


// OPTIONS - auth
$arOptions = array_merge($arOptions, [
    'SECRET_KEY'   => [
        'GROUP'      => 'OPTION_GROUP_AUTH',
        'TITLE'      => Loc::getMessage($moduleId.'_OPTION_SECRET_KEY'),
        'NOTES'       => Loc::getMessage($moduleId.'_OPTION_SECRET_KEY_HELP'),
        'TYPE'       => 'STRING',
        'SORT'       => '10',
        'SIZE'       => 40,
        'AFTER_TEXT' => '<button id="generateKey"></button>',
    ],
    'TOKEN_EXPIRE' => [
        'GROUP'      => 'OPTION_GROUP_AUTH',
        'TITLE'      => Loc::getMessage($moduleId.'_OPTION_TOKEN_EXPIRE'),
        'NOTES'       => Loc::getMessage($moduleId.'_OPTION_TOKEN_EXPIRE_HELP'),
        'TYPE'       => 'STRING',
        'SORT'       => '20',
        'DEFAULT'    => Config::getInstance()->getTokenExpire(),
        'AFTER_TEXT' => Loc::getMessage($moduleId.'_OPTION_AFTER_TEXT_SEC'),
    ],
    'USER_PERMISSION_GROUP' => [
        'GROUP'  => 'OPTION_GROUP_PERMISSIONS',
        'TITLE'  => Loc::getMessage($moduleId.'_OPTION_USER_GROUP'),
        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_USER_GROUP_HELP'),
        'TYPE'   => 'MSELECT',
        'SORT'   => '30',
        'VALUES' => $userGroups,
    ],
]);

// OPTIONS - config data
if($iblockModule && $catalogModule && $saleModule) {
    $arOptions = array_merge($arOptions, [
        'CATALOG_ACTIVE' => [
            'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_ACTIVE',
            'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ACTIVE'),
            'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ACTIVE_HELP'),
            'TYPE'  => 'CHECKBOX',
            'SORT'  => '10',
        ],
        'CATALOG_TYPE'   => [
            'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_CONNECT',
            'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_TYPE'),
            'NOTES'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_TYPE_HELP'),
            'TYPE'    => 'SELECT',
            'SORT'    => '20',
            'VALUES'  => $catalogSettings['IBLOCK_TYPE_SELECT'],
            'REFRESH' => 'Y',
        ]
    ]);

    // Catalog IBLOCK ID
    if($catalogSettings['IBLOCK_TYPE']) {
        $arOptions = array_merge(
            $arOptions,
            [
                'CATALOG_ID' => [
                    'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_CONNECT',
                    'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ID'),
                    'NOTES'    => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ID_HELP'),
                    'TYPE'    => 'SELECT',
                    'SORT'    => '30',
                    'REFRESH' => 'Y',
                    'VALUES'  => $catalogSettings['IBLOCK_ID_SELECT'],
                ],
            ]
        );
    }

    if($catalogSettings['IBLOCK_ID']) {
        //$catalogSettings = [];


        /**
         * Источник данных
         *
         * Недоступные товары    HIDE_NOT_AVAILABLE
         * Недоступные торговые предложения    HIDE_NOT_AVAILABLE_OFFERS
         *
         * Внешний вид
         * Дополнительная картинка основного товара    ADD_PICT_PROP
         * Свойство меток товара    LABEL_PROP
         * Дополнительные картинки предложения    OFFER_ADD_PICT_PROP
         * Свойства для отбора предложений    OFFER_TREE_PROPS
         * Показывать процент скидки    SHOW_DISCOUNT_PERCENT
         * Показывать старую цену    SHOW_OLD_PRICE
         * Показывать остаток товара    SHOW_MAX_QUANTITY
         * Сообщение об отсутствии товара    MESS_NOT_AVAILABLE
         *
         * Цены
         * Тип цены    PRICE_CODE
         * Использовать вывод цен с диапазонами    USE_PRICE_COUNT
         * Выводить цены для количества    SHOW_PRICE_COUNT
         * Включать НДС в цену    PRICE_VAT_INCLUDE
         * Отображать значение НДС    PRICE_VAT_SHOW_VALUE
         * Показывать цены в одной валюте    CONVERT_CURRENCY
         *
         *
         *
         * Добавление в корзину
         *
         * Добавлять в корзину свойства товаров и предложений    ADD_PROPERTIES_TO_BASKET
         *
         * Настройки поиска
         *
         * Количество результатов на странице    SEARCH_PAGE_RESULT_COUNT
         * Искать без учета морфологии (при отсутствии результата поиска)    RESTART
         * Отключить обработку слов как логических операторов    NO_WORD_LOGIC
         * Включить автоопределение раскладки клавиатуры    USE_LANGUAGE_GUESS
         * Искать только в активных по дате документах    CHECK_DATES
         * Использовать сортировку результатов по релевантности    SEARCH_USE_SEARCH_RESULT_ORDER
         *
         *
         * Настройки списка
         *
         * Количество элементов на странице    PAGE_ELEMENT_COUNT
         * По какому полю сортируем товары в разделе    ELEMENT_SORT_FIELD
         * Порядок сортировки товаров в разделе    ELEMENT_SORT_ORDER
         * Поле для второй сортировки товаров в разделе    ELEMENT_SORT_FIELD2
         * Порядок второй сортировки товаров в разделе    ELEMENT_SORT_ORDER2
         * Свойства    LIST_PROPERTY_CODE
         * Поля предложений    LIST_OFFERS_FIELD_CODE
         * Свойства предложений    LIST_OFFERS_PROPERTY_CODE
         *
         *
         * Настройки детального просмотра
         *
         * Свойства    DETAIL_PROPERTY_CODE
         * Показывать деактивированные товары    SHOW_DEACTIVATED
         * Отображать описание для каждого торгового предложения    SHOW_SKU_DESCRIPTION
         * Поля предложений    DETAIL_OFFERS_FIELD_CODE
         * Свойства предложений    DETAIL_OFFERS_PROPERTY_CODE
         * Включить рейтинг товара    DETAIL_USE_VOTE_RATING
         *
         */



        $arOptions = array_merge(
            $arOptions,
            [
                /**
                 * PRICES
                 */
                'CATALOG_PRICE_CODE'                     => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRICE_CODE'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRICE_CODE_HELP'),
                    'TYPE'   => 'MSELECT',
                    'SORT'   => '900',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['PRICE']),
                        'REFERENCE'    => array_values($catalogSettings['PRICE']),
                    ],
                ],
                /*'CATALOG_USE_PRICE_COUNT'                => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_USE_PRICE_COUNT'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_USE_PRICE_COUNT_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '910',
                ],
                'CATALOG_SHOW_PRICE_COUNT'               => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_PRICE_COUNT'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_PRICE_COUNT_HELP'),
                    'TYPE'   => 'INT',
                    'SORT'   => '920',
                    'DEFAULT' => 1,
                ],
                'CATALOG_PRICE_VAT_INCLUDE'              => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRICE_VAT_INCLUDE'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRICE_VAT_INCLUDE_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '930',
                    'DEFAULT' => 'Y'
                ],
                'CATALOG_PRICE_VAT_SHOW_VALUE'           => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRICE_VAT_SHOW_VALUE'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRICE_VAT_SHOW_VALUE_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '940',
                    'DEFAULT' => 'N',
                ],*/
                'CATALOG_CONVERT_CURRENCY'               => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '950',
                    'DEFAULT' => 'N',
                    'REFRESH' => 'Y',
                ],


                /**
                 * DATA
                 */
                'CATALOG_HIDE_NOT_AVAILABLE' => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_DATA',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1000',
                    'VALUES' => [
                        'REFERENCE_ID' => ['Y', 'L', 'N'],
                        'REFERENCE'    => [
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_1'),
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_2'),
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_3'),
                        ],
                    ],
                ],

                'CATALOG_HIDE_NOT_AVAILABLE_OFFERS' => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_DATA',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1010',
                    'VALUES' => [
                        'REFERENCE_ID' => ['Y', /*'L',*/ 'N'],
                        'REFERENCE'    => [
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_1'),
                            /*Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS_1'),*/
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS_2'),
                        ],
                    ],
                ],

                /*'CATALOG_SHOW_DEACTIVATED'               => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_DATA',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_DEACTIVATED'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_DEACTIVATED_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1015',
                    "DEFAULT" => "N"
                ],*/


                /**
                 * VIEW
                 */
                'CATALOG_ADD_PICT_PROP'             => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ADD_PICT_PROP'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ADD_PICT_PROP_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1020',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['FILE_PROP_LIST']),
                        'REFERENCE'    => array_values($catalogSettings['FILE_PROP_LIST']),
                    ],
                ],

                /*'CATALOG_LABEL_PROP' => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LABEL_PROP'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LABEL_PROP_HELP'),
                    'TYPE'   => 'MSELECT',
                    'SORT'   => '1030',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['LIST_PROP_LIST']),
                        'REFERENCE'    => array_values($catalogSettings['LIST_PROP_LIST']),
                    ],
                ],*/

                'CATALOG_SHOW_DISCOUNT_PERCENT'          => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_DISCOUNT_PERCENT'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_DISCOUNT_PERCENT_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1060',
                ],
                'CATALOG_SHOW_OLD_PRICE'                 => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_OLD_PRICE'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_OLD_PRICE_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1070',
                ],
                'CATALOG_SHOW_MAX_QUANTITY'              => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1080',
                    'VALUES' => [
                        'REFERENCE_ID' => ['Y', 'M', 'N'],
                        'REFERENCE'    => [
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_Y'),
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_M'),
                            Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_N'),
                        ],
                    ],
                    'REFRESH' => 'Y',
                    'DEFAULT' => 'N',
                ],
                /*            'CATALOG_MESS_NOT_AVAILABLE'             => [
                                'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                                'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_MESS_NOT_AVAILABLE'),
                                'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_MESS_NOT_AVAILABLE_HELP'),
                                'TYPE'  => 'STRING',
                                'SORT'  => '1090',
                                'VALUE' => '',
                            ],*/



                /**
                 * SEARCH
                 */
                'CATALOG_SEARCH_RESTART'                        => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_SEARCH',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SEARCH_RESTART'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SEARCH_RESTART_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1180',
                ],
                'CATALOG_NO_WORD_LOGIC'                  => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_SEARCH',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_NO_WORD_LOGIC'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_NO_WORD_LOGIC_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1190',
                ],
                'CATALOG_USE_LANGUAGE_GUESS'             => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_SEARCH',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_USE_LANGUAGE_GUESS'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_USE_LANGUAGE_GUESS_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1200',
                ],

                /**
                 * LIST
                 */
                'CATALOG_PAGE_ELEMENT_COUNT'             => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PAGE_ELEMENT_COUNT'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PAGE_ELEMENT_COUNT_HELP'),
                    'TYPE'   => 'INT',
                    'SORT'   => '1230',
                    'DEFAULT' => '30',
                ],
                'CATALOG_ELEMENT_SORT_FIELD'             => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1240',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['SORT']),
                        'REFERENCE'    => array_values($catalogSettings['SORT']),
                    ],
                ],
                'CATALOG_ELEMENT_SORT_ORDER'             => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1250',
                    "DEFAULT" => "asc",
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['ASC_DESC']),
                        'REFERENCE'    => array_values($catalogSettings['ASC_DESC']),
                    ],
                ],
                'CATALOG_ELEMENT_SORT_FIELD2'            => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD2'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD2_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1260',
                    "DEFAULT" => "id",
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['SORT']),
                        'REFERENCE'    => array_values($catalogSettings['SORT']),
                    ],
                ],
                'CATALOG_ELEMENT_SORT_ORDER2'            => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER2'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER2_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1270',
                    "DEFAULT" => "desc",
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['ASC_DESC']),
                        'REFERENCE'    => array_values($catalogSettings['ASC_DESC']),
                    ],
                ],
                /*'CATALOG_LIST_OFFERS_FIELD_CODE'         => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE_HELP'),
                    'TYPE'   => 'MSELECT',
                    'SORT'   => '1290',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys(\CIBlockParameters::GetFieldCode($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE', "LIST_SETTINGS")['VALUES']),
                        'REFERENCE'    => array_values(\CIBlockParameters::GetFieldCode($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE', "LIST_SETTINGS")['VALUES']),
                    ],
                ],*/
                /*'CATALOG_LIST_OFFERS_PROPERTY_CODE'      => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_PROPERTY_CODE'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_PROPERTY_CODE_HELP'),
                    'TYPE'   => 'SELECT',
                    'SORT'   => '1300',
                    'VALUES' => [],
                ],*/

                /**
                 * DETAIL
                 */
                /*'CATALOG_SHOW_SKU_DESCRIPTION'           => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_DETAIL',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_SKU_DESCRIPTION'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_SKU_DESCRIPTION_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1330',
                ],*/
                /*'CATALOG_DETAIL_OFFERS_FIELD_CODE'       => [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_DETAIL',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_FIELD_CODE'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_FIELD_CODE_HELP'),
                    'TYPE'   => 'MSELECT',
                    'SORT'   => '1340',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys(\CIBlockParameters::GetFieldCode($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE', "LIST_SETTINGS")['VALUES']),
                        'REFERENCE'    => array_values(\CIBlockParameters::GetFieldCode($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE', "LIST_SETTINGS")['VALUES']),
                    ],
                ],*/

                /*'CATALOG_DETAIL_USE_VOTE_RATING'         => [
                    'GROUP' => 'OPTION_GROUP_CONFIG_CATALOG_DETAIL',
                    'TITLE' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_USE_VOTE_RATING'),
                    'NOTES' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_USE_VOTE_RATING_HELP'),
                    'TYPE'  => 'CHECKBOX',
                    'SORT'  => '1360',
                    'DEFAULT' => 'N',
                ],*/
            ]
        );


        if ($catalogSettings['CATALOG_CONVERT_CURRENCY'] === 'Y')
        {
            $currencyList = Currency\CurrencyManager::getCurrencyList();
            $arOptions['CATALOG_CONVERT_CURRENCY_ID'] =
                [
                    'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_PRICES',
                    'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY_ID'),
                    'TYPE'    => 'SELECT',
                    'SORT'    => '1155',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($currencyList),
                        'REFERENCE'    => array_values($currencyList)
                    ],
                    'DEFAULT' => Currency\CurrencyManager::getBaseCurrency(),

                ];
        }

        if ($catalogSettings['CATALOG_SHOW_MAX_QUANTITY'] === 'M')
        {
            /*$arOptions['CATALOG_SHOW_MAX_QUANTITY_TEXT'] =
                [
                    'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT'),
                    'TYPE'    => 'STRING',
                    'SORT'    => '1081',
                    'VALUE'   => $catalogSettings['CATALOG_SHOW_MAX_QUANTITY_TEXT'] ?? '',
                    'DEFAULT' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT_DEFAULT'),

                ];*/

            $arOptions['CATALOG_SHOW_MAX_QUANTITY_INT'] =
                [
                    'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_INT'),
                    'TYPE'    => 'INT',
                    'SORT'    => '1082',
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_INT_HELP'),
                    'VALUE' => $catalogSettings['CATALOG_SHOW_MAX_QUANTITY_INT'] ?? '',
                    'DEFAULT' => '10',

                ];

            $arOptions['CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX'] =
                [
                    'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX'),
                    'TYPE'    => 'STRING',
                    'SORT'    => '1083',
                    'VALUE' => $catalogSettings['CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX'] ?? '',
                    'DEFAULT' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_MANY'),

                ];

            $arOptions['CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN'] =
                [
                    'GROUP'   => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                    'TITLE'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN'),
                    'TYPE'    => 'STRING',
                    'SORT'    => '1084',
                    'VALUE' => $catalogSettings['CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN'] ?? '',
                    'DEFAULT' => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_MINI'),

                ];
        }

        if (!$catalogSettings['USE_PROPERTY_FEATURES'])
        {
            $arOptions = array_merge(
                $arOptions,
                [
                    /*'CATALOG_LIST_OFFERS_PROPERTY_CODE'      => [
                        'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                        'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_PROPERTY_CODE'),
                        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_OFFERS_PROPERTY_CODE_HELP'),
                        'TYPE'   => 'MSELECT',
                        'SORT'   => '1305',
                        'VALUES' => [
                            'REFERENCE_ID' => array_keys($catalogSettings['PROPERTY_OFFERS']),
                            'REFERENCE'    => array_values($catalogSettings['PROPERTY_OFFERS']),
                        ],
                    ],*/
                    'CATALOG_DETAIL_OFFERS_PROPERTY_CODE'      => [
                        'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_DETAIL',
                        'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_PROPERTY_CODE'),
                        'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_PROPERTY_CODE_HELP'),
                        'TYPE'   => 'MSELECT',
                        'SORT'   => '1345',
                        'VALUES' => [
                            'REFERENCE_ID' => array_keys($catalogSettings['PROPERTY_OFFERS']),
                            'REFERENCE'    => array_values($catalogSettings['PROPERTY_OFFERS']),
                        ],
                    ],
                ]
            );
        }

        if (!$catalogSettings['USE_PROPERTY_FEATURES']) {
            $arOptions['CATALOG_LIST_PROPERTY_CODE'] = [
                'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_LIST',
                'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_PROPERTY_CODE'),
                'NOTES'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_LIST_PROPERTY_CODE_HELP'),
                'TYPE'   => 'MSELECT',
                'SORT'   => '1280',
                'VALUES' => [
                    'REFERENCE_ID' => array_keys($catalogSettings['PROPERTY_LNS']),
                    'REFERENCE'    => array_values($catalogSettings['PROPERTY_LNS']),
                ],
            ];

            $arOptions['CATALOG_DETAIL_PROPERTY_CODE'] = [
                'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_DETAIL',
                'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_PROPERTY_CODE'),
                'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_DETAIL_PROPERTY_CODE_HELP'),
                'TYPE'   => 'MSELECT',
                'SORT'   => '1310',
                'VALUES' => [
                    'REFERENCE_ID' => array_keys($catalogSettings['PROPERTY_LNS']),
                    'REFERENCE'    => array_values($catalogSettings['PROPERTY_LNS']),
                ],
            ];

            /**
             * BASKET
             */
            $arOptions['CATALOG_ADD_PROPERTIES_TO_BASKET'] = [
                'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_BASKET',
                'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ADD_PROPERTIES_TO_BASKET'),
                'NOTES'   => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_ADD_PROPERTIES_TO_BASKET_HELP'),
                'TYPE'   => 'CHECKBOX',
                'SORT'   => '1160',
                'DEFAULT' => 'Y',
                'REFRESH' => 'Y'
            ];

            if ($catalogSettings['CATALOG_ADD_PROPERTIES_TO_BASKET'] === 'Y') {
                $arOptions['CATALOG_PRODUCT_CART_PROPERTIES'] = [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_BASKET',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRODUCT_CART_PROPERTIES'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_PRODUCT_CART_PROPERTIES_HELP'),
                    'TYPE'   => 'MSELECT',
                    'SORT'   => '1170',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['PROPERTY_X']),
                        'REFERENCE'    => array_values($catalogSettings['PROPERTY_X']),
                    ],
                    "DEFAULT" => ""
                ];

                $arOptions['CATALOG_OFFERS_CART_PROPERTIES'] = [
                    'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_BASKET',
                    'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_OFFERS_CART_PROPERTIES'),
                    'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_OFFERS_CART_PROPERTIES_HELP'),
                    'TYPE'   => 'MSELECT',
                    'SORT'   => '1180',
                    'VALUES' => [
                        'REFERENCE_ID' => array_keys($catalogSettings['PROPERTY_OFFERS_WITHOUT_FILE']),
                        'REFERENCE'    => array_values($catalogSettings['PROPERTY_OFFERS_WITHOUT_FILE']),
                    ],
                ];
            }
        }

    }

    if($catalogSettings['IBLOCK_SKU']) {
        $arOptions['CATALOG_OFFER_ADD_PICT_PROP'] = [
            'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
            'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_OFFER_ADD_PICT_PROP'),
            'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_OFFER_ADD_PICT_PROP_HELP'),
            'TYPE'   => 'SELECT',
            'SORT'   => '1025',
            //'DEFAULT' => '-',
            'VALUES' => [
                'REFERENCE_ID' => array_keys($catalogSettings['FILE_OFFER_PROP_LIST']),
                'REFERENCE'    => array_values($catalogSettings['FILE_OFFER_PROP_LIST']),
            ],
        ];

        if (!$catalogSettings['USE_PROPERTY_FEATURES']) {
            $arOptions['CATALOG_OFFER_TREE_PROPS'] = [
                'GROUP'  => 'OPTION_GROUP_CONFIG_CATALOG_VIEW',
                'TITLE'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_OFFER_TREE_PROPS'),
                'NOTES'  => Loc::getMessage($moduleId.'_OPTION_CONFIG_CATALOG_OFFER_TREE_PROPS_HELP'),
                'TYPE'   => 'MSELECT',
                'SORT'   => '1050',
                'VALUES' => [
                    'REFERENCE_ID' => array_keys($catalogSettings['TREE_OFFER_PROP_LIST']),
                    'REFERENCE'    => array_values($catalogSettings['TREE_OFFER_PROP_LIST']),
                ],

            ];
        }
    }

}

// OPTIONS - route map
$arOptions = array_merge($arOptions, [
    'ROUTE_MAP' => [
        'GROUP'      => 'OPTION_GROUP_ROUTE',
        'TYPE'       => 'CUSTOM',
        'SORT'       => '30',
        'VALUE'      => $routesMap
    ],
]);


/*
if(SotbitRestAPI::getDemo() == 2) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_DEMO"));
}

if(SotbitRestAPI::getDemo() == 3 || SotbitRestAPI::getDemo() == 0) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_DEMO_END"));
    require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");

    return false;
}*/


/**
 * PERMISSIONS
 */
if($APPLICATION->GetGroupRight($moduleId) != "D") {
    $showRightsTab = true;
    $opt = new AdminHelper($moduleId, $arTabs, $arGroups, $arOptions, $showRightsTab);

    $opt->ShowHTML();
}

$APPLICATION->SetTitle(Loc::getMessage($moduleId.'_TITLE_SETTINGS'));


/**
 * FRONTEND
 */
?>
<script>
    document.addEventListener("DOMContentLoaded", function () {
        let event = new Event("input");

        const blockKey = document.querySelector("input[name='SECRET_KEY']").parentNode,
            inputKey = document.querySelector("input[name='SECRET_KEY']"),
            btn = document.getElementById("generateKey"),
            btnToken = document.querySelector("input[name='TOKEN_EXPIRE']"),
            btnTokenResult = document.getElementById("tokenExpireResult"),
            btnYear = document.getElementById("tokenExpireYear"),
            btnMonth = document.getElementById("tokenExpireMonth"),
            btnWeek = document.getElementById("tokenExpireWeek"),
            btnDay = document.getElementById("tokenExpireDay"),
            countYear = 60 * 60 * 24 * 365,
            countMounth = 60 * 60 * 24 * 31,
            countWeek = 60 * 60 * 24 * 7,
            countDay = 60 * 60 * 24,
            y1 = "<?=Loc::getMessage($moduleId.'_YEAR_1')?>",
            y2 = "<?=Loc::getMessage($moduleId.'_YEAR_2')?>",
            y3 = "<?=Loc::getMessage($moduleId.'_YEAR_3')?>",
            m1 = "<?=Loc::getMessage($moduleId.'_MONTH_1')?>",
            m2 = "<?=Loc::getMessage($moduleId.'_MONTH_2')?>",
            m3 = "<?=Loc::getMessage($moduleId.'_MONTH_3')?>",
            d1 = "<?=Loc::getMessage($moduleId.'_DAY_1')?>",
            d2 = "<?=Loc::getMessage($moduleId.'_DAY_2')?>",
            d3 = "<?=Loc::getMessage($moduleId.'_DAY_3')?>";


        blockKey.style.display = "flex";
        btn.textContent = "<?=Loc::getMessage($moduleId.'_BUTTON_GENERATION_LABEL')?>";
        btn.classList.add("generate-key-btn");
        blockKey.append(btn);

        btn.addEventListener("click", function (e) {
            e.preventDefault();
            inputKey.value = generateKey();
        });
        recalculate(btnToken, btnYear, countYear);
        recalculate(btnToken, btnMonth, countMounth);
        recalculate(btnToken, btnWeek, countWeek);
        recalculate(btnToken, btnDay, countDay);

        btnTokenResult.textContent = result(btnToken.value);
        btnToken.addEventListener("input", function () {
            btnTokenResult.textContent = result(this.value);
        });

        function recalculate(i, e, s) {
            e.addEventListener("click", function (e) {
                e.preventDefault();
                i.value = +(i.value) + s;
                i.dispatchEvent(event);
            });
        }

        function result(sec) {
            var message = '',
                days = 0,
                months = 0,
                years = 0;


            years = Math.floor(sec / countYear);
            sec -= years * countYear;


            months = Math.floor(sec / countMounth);
            sec -= months * countMounth;

            days = Math.floor(sec / countDay);
            sec -= days * countDay;


            if (years >= 1) {
                message += years + ' ' + declOfNum(years, [y1, y2, y3]) + " ";
            }
            if (months >= 1) {
                message += months + ' ' + declOfNum(months, [m1, m2, m3]) + " ";
            }
            if (days >= 1) {
                message += days + ' ' + declOfNum(days, [d1, d2, d3]) + " ";
            }

            if (message) {
                message = '(' + message.trim() + ')';
            }

            return message;
        }

        function declOfNum(n, titles) {
            return titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
        }

        function generateKey() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

    });


</script>
<style>
    .generate-key-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 26px;
        padding: 5px;
        margin-left: 10px;
    }
    input.select_button {
        margin: 0px !important;
    }

    .adm-workarea select.refresh {
        width: 80% !important;
    }

    .adm-workarea select {
        width: 100% !important;
    }

    .adm-workarea input[type="number"] {
        width: 98% !important;
    }
</style>


<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");