<?php
declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

/**
 * Class EventHandlers
 *
 * @package Sotbit\RestAPI
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 22.05.2020
 */
class EventHandlers
{

    /**
     * Init App
     */
    public static function onBeforeProlog()
    {
        $app = (new Core())->run();
    }

    /**
     * Add global menu
     *
     * @param $arGlobalMenu
     * @param $arModuleMenu
     */
    public static function onBuildGlobalMenuHandler(&$arGlobalMenu, &$arModuleMenu)
    {
        Menu::getAdminMenu($arGlobalMenu, $arModuleMenu);
    }
}

?>