<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Sale\Internals\PersonTypeTable;
use Bitrix\Main\GroupTable;
use Bitrix\Main\Config\Option;
use Sotbit\RestAPI\Core\AdminHelper;
use Sotbit\RestAPI\Core\Config;
use Sotbit\RestAPI\Core\Helper;
use Bitrix\Main\Application;
use Bitrix\Main\Loader;

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

Loc::loadMessages(__FILE__);
global $APPLICATION;

if($APPLICATION->GetGroupRight("main") < "R") {
    $APPLICATION->AuthForm(Loc::getMessage("ACCESS_DENIED"));
}
require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_admin.php');


$moduleId = SotbitRestAPI::MODULE_ID;
$request = Application::getInstance()->getContext()->getRequest();
$siteID = $request->getQuery('site');

$arTabs = [
    [
        'DIV'   => 'edit1',
        'TAB'   => Loc::getMessage($moduleId.'_TAB_MAIN'),
        'ICON'  => '',
        'TITLE' => Loc::getMessage($moduleId.'_TAB_MAIN'),
        'SORT'  => '10',
    ],

    [
        'DIV'   => 'edit2',
        'TAB'   => Loc::getMessage($moduleId.'_TAB_AUTH'),
        'ICON'  => '',
        'TITLE' => Loc::getMessage($moduleId.'_TAB_AUTH'),
        'SORT'  => '10',
    ],
];

$arGroups = [
    'OPTION_MAIN' => [
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_MAIN'),
        'TAB'   => 1,
    ],
    'OPTION_AUTH' => [
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_AUTH'),
        'TAB'   => 2,
    ],
];

$arOptions = [
    'ACTIVE' => [
        'GROUP' => 'OPTION_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_ACTIVE'),
        'HELP'  => Loc::getMessage($moduleId.'_OPTION_ACTIVE_HELP'),
        'TYPE'  => 'CHECKBOX',
        'SORT'  => '10',
    ],
    'DEBUG'  => [
        'GROUP' => 'OPTION_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_DEBUG'),
        'HELP'  => Loc::getMessage($moduleId.'_OPTION_DEBUG_HELP'),
        'TYPE'  => 'CHECKBOX',
        'SORT'  => '20',
    ],
    'LOG'    => [
        'GROUP' => 'OPTION_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_LOG'),
        'HELP'  => Loc::getMessage($moduleId.'_OPTION_LOG_HELP'),
        'TYPE'  => 'CHECKBOX',
        'SORT'  => '20',
    ],
    'URL'    => [
        'GROUP' => 'OPTION_MAIN',
        'TITLE' => Loc::getMessage($moduleId.'_OPTION_URL'),
        'HELP'  => Loc::getMessage($moduleId.'_OPTION_URL_HELP'),
        'NOTES' => Loc::getMessage($moduleId.'_OPTION_URL_NOTES'),
        'TYPE'  => 'STRING',
        'SORT'  => '30',
    ],


    'SECRET_KEY'   => [
        'GROUP'      => 'OPTION_AUTH',
        'TITLE'      => Loc::getMessage($moduleId.'_OPTION_SECRET_KEY'),
        'HELP'       => Loc::getMessage($moduleId.'_OPTION_SECRET_KEY_HELP'),
        'TYPE'       => 'STRING',
        'SORT'       => '10',
        'SIZE'       => 40,
        'AFTER_TEXT' => '<button id="generateKey"></button>',
    ],
    'TOKEN_EXPIRE' => [
        'GROUP'      => 'OPTION_AUTH',
        'TITLE'      => Loc::getMessage($moduleId.'_OPTION_TOKEN_EXPIRE'),
        'HELP'       => Loc::getMessage($moduleId.'_OPTION_TOKEN_EXPIRE_HELP'),
        'TYPE'       => 'STRING',
        'SORT'       => '20',
        'DEFAULT'    => Config::getTokenExpire(),
        'AFTER_TEXT' => Loc::getMessage($moduleId.'_OPTION_AFTER_TEXT_SEC'),
    ],
];


if(!Loader::includeModule('support')) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_SUPPORT_MODULE"));
}

if(PHP_VERSION_ID < 70200) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_PHP_VERSION"));
}

if(SotbitRestAPI::getDemo() == 2) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_DEMO"));
}

if(SotbitRestAPI::getDemo() == 3 || SotbitRestAPI::getDemo() == 0) {
    echo Helper::error(Loc::getMessage($moduleId."_ERROR_DEMO_END"));
    require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");

    return false;
}


if($APPLICATION->GetGroupRight($moduleId) != "D") {
    $showRightsTab = false;
    $opt = new AdminHelper($moduleId, $arTabs, $arGroups, $arOptions, $showRightsTab);

    $opt->ShowHTML();
}

$APPLICATION->SetTitle(Loc::getMessage($moduleId.'_TITLE_SETTINGS'));
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

    .sotbit_restapi_help:hover::after {
        content: attr(data-help);
        display: block;
        padding: 10px;
        white-space: pre-wrap;
        position: absolute;
        top: 130%;
        left: 0;
        width: max-content;
        max-width: 300px;
        text-align: left;
        background: linear-gradient(to bottom, rgba(227, 233, 234, .95), rgba(198, 210, 213, .95));
        border: 1px solid #a2a6ad;
        z-index: 1;
    }

    .sotbit_restapi_help {
        position: relative;
    }
</style>


<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>



