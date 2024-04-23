<?php
declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\ArgumentException;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\SystemException;
use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class Menu
 *
 * @package Sotbit\RestAPI\Core
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 19.06.2020
 */
class Menu
{
    /**
     * @param $arGlobalMenu
     * @param $arModuleMenu
     */
    public static function getAdminMenu(
        &$arGlobalMenu,
        &$arModuleMenu
    ) {
        $moduleInclude = false;
        try {
            $moduleInclude = Loader::includeModule('sotbit.restapi');
        } catch (LoaderException $e) {
            echo $e->getMessage();
        }

        /*$settings = [];
        $develop = [];
        $sites = Config::getInstance()->getSites();
        foreach ($sites as $lid => $name) {
            $settings[$lid] = [
                "text"  => ' ['.$lid.'] '.$name,
                "url"   => '/bitrix/admin/sotbit_restapi_settings.php?lang='
                    .LANGUAGE_ID.'&site='.$lid,
                "title" => ' ['.$lid.'] '.$name,
            ];
            $develop[$lid] = [
                "text"  => ' ['.$lid.'] '.$name,
                "url"   => '/bitrix/admin/sotbit_origami_develop.php?lang='
                    .LANGUAGE_ID.'&site='.$lid,
                "title" => ' ['.$lid.'] '.$name,
            ];
        }*/

        if (!isset($arGlobalMenu['global_menu_sotbit'])) {
            $arGlobalMenu['global_menu_sotbit'] = [
                'menu_id'   => 'sotbit',
                'text'      => l::get('CORE_GLOBAL_MENU'),
                'title'     => l::get('CORE_GLOBAL_MENU'),
                'sort'      => 1000,
                'items_id'  => 'global_menu_sotbit_items',
                "icon"      => "",
                "page_icon" => "",
            ];
        }

        $menu = [];
        if ($moduleInclude) {
            if ($GLOBALS['APPLICATION']->GetGroupRight(\SotbitRestAPI::MODULE_ID)
                >= 'R'
            ) {
                $menu = [
                    "section"   => "sotbit_restapi",
                    "menu_id"   => "sotbit_restapi",
                    "sort"      => 1000,
                    'id'        => 'restapi',
                    "text"      => l::get('CORE_GLOBAL_MENU_RESTAPI'
                    ),
                    "title"     => l::get('CORE_GLOBAL_MENU_RESTAPI'
                    ),
                    "icon"      => "sotbit_restapi_menu_icon",
                    "page_icon" => "",
                    "items_id"  => "global_menu_sotbit_restapi",
                    "items"     => [

                        // Docs
                        /*[
                            'text'      => l::get('CORE_DOCS'),
                            'title'     => l::get('CORE_DOCS'),
                            /*'url'       => '/bitrix/admin/sotbit_restapi_auth.php?lang='
                                .LANGUAGE_ID.'&site='.$lid,*//*
                            'url'       => '/bitrix/admin/sotbit_restapi_auth.php?lang='
                                .LANGUAGE_ID,
                            'sort'      => 10,
                            'icon'      => '',
                            'page_icon' => '',
                            'items_id'  => "develop",
                            'items'     => [],

                        ],*/

                        // Logs
                        [
                            'text'      => l::get('CORE_LOGS'),
                            'title'     => l::get('CORE_LOGS'),
                            /*'url'       => '/bitrix/admin/sotbit_restapi_logs.php?lang='
                                .LANGUAGE_ID.'&site='.$lid,*/
                            'url'       => '/bitrix/admin/sotbit_restapi_logs.php?lang='
                                .LANGUAGE_ID,
                            'sort'      => 10,
                            'icon'      => '',
                            'page_icon' => '',
                            "items_id"  => "logs",
                            'items'     => [],
                        ],

                        // Settings
                        [
                            'text'      => l::get('CORE_SETTINGS'),
                            'title'     => l::get('CORE_SETTINGS'),
                            'sort'      => 20,
                            'icon'      => '',
                            'page_icon' => '',
                            "items_id"  => "settings",
                            //'items'     => $settings,
                            'url'       => '/bitrix/admin/sotbit_restapi_settings.php?lang='
                                .LANGUAGE_ID
                        ],
                    ],
                ];
            }
        }
        $arGlobalMenu['global_menu_sotbit']['items']['sotbit.restapi'] = $menu;
    }
}
?>