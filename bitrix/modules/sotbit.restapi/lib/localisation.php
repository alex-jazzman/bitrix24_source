<?php

declare(strict_types=1);

namespace Sotbit\RestAPI;

use Bitrix\Main\Localization\Loc;
use Sotbit\RestAPI\Core;

Loc::loadMessages(__FILE__);

class Localisation
{
    public static function get($code, $replace = null, $language = null): string
    {
        return (string)Loc::getMessage(\SotbitRestAPI::MODULE_ID.'_'.$code, $replace, $language);
    }

    public static function set()
    {
        return false;
    }
}