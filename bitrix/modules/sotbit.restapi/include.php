<?php

declare(strict_types=1);

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Entity\DataManager;
use Sotbit\RestAPI\Config\Config;

Loc::loadMessages(__FILE__);
global $DB;

class SotbitRestAPI
{
    public const MODULE_ID = "sotbit.restapi";
    public const DEFAULT_PATH = "sotbit_restapi";
    public const B2BMOBILE_MODULE_ID = "sotbit.b2bmobile";

    public static function isModuleActive(): bool
    {
        return Config::getInstance()->isModuleActive();
    }

    public static function isDebug(): bool
    {
        return Config::getInstance()->isDebug();
    }

    public static function isLog(): bool
    {
        return Config::getInstance()->isLog();
    }

    public static function getRouteMainPath(): string
    {
        return Config::getInstance()->getRouteMainPath();
    }
}

?>