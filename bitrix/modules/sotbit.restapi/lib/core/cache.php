<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\Application;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Exception;

/**
 * Class Cache
 *
 * @package Sotbit\RestAPI\Core
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 21.03.2023
 */
class Cache
{

    private static $instance;
    private static $cache;

    public function get($id, $ttl = 86400, $dir = false)
    {
        return static::$cache->initCache($ttl, $id, $dir) ? static::$cache->getVars() : false;
    }

    public function set($data): void
    {
        if (static::$cache->startDataCache()) {
            static::$cache->endDataCache($data);
        }
    }

    public function clear($dir): bool
    {
        BXClearCache(true, $dir);
    }

    public static function getInstance()
    {
        if (static::$instance === null) {
            static::$instance = new static();
            static::$cache = \Bitrix\Main\Data\Cache::createInstance();
        }
        return static::$instance;
    }

    private function __construct()
    {
    }

    private function __clone()
    {
    }

    public function __wakeup()
    {
    }
}