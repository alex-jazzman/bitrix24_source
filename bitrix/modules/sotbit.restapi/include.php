<?php

declare(strict_types=1);

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Entity\DataManager;
use Sotbit\RestAPI\Core\Config;

Loc::loadMessages(__FILE__);
global $DB;

class SotbitRestAPI
{
    const MODULE_ID = "sotbit.restapi";
    const DEFAULT_PATH = "sotbit_restapi";
    static private $demo;

    /**
     * set demo
     */
    private static function setDemo()
    {
        self::$demo = Loader::includeSharewareModule(self::MODULE_ID);
    }

    /**
     * @return bool
     */
    public static function isDemoEnd()
    {
        if(is_null(self::$demo)) {
            self::setDemo();
        }

        return self::$demo === 0 || self::$demo === 3;
    }

    /**
     * @return int
     */
    public static function getDemo()
    {
        if(is_null(self::$demo)) {
            self::setDemo();
        }

        return self::$demo;
    }

    public static function isModuleActive(): bool
    {
        return Config::isModuleActive();
    }

    public static function isDebug(): bool
    {
        return Config::isDebug();
    }

    public static function isLog(): bool
    {
        return Config::isLog();
    }

    public static function getRouteMainPath(): string
    {
        return Config::getRouteMainPath();
    }
}

?>