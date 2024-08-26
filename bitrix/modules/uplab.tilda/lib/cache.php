<?php

namespace Uplab\Tilda;

use Bitrix\Main\Application;
use Bitrix\Main\Data\Cache as BitrixCache;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;

Loc::loadMessages(__FILE__);

class Cache
{
    protected static $cacheBaseDir = 'cache_tilda';

    /**
     * @param string $url
     * @param string $method
     * @return array
     */
    static function cache($url, $cacheId, $cacheDir, $noteInBase = false)
    {
        $cacheTime = 604800;// неделя

        $data = [];

        $cache = BitrixCache::createInstance();

        if ($cache->initCache($cacheTime, $cacheId, $cacheDir, self::$cacheBaseDir)) {
            $result = $cache->getVars();
            $data = $result['arrResponse'];
        } elseif ($cache->startDataCache($cacheTime, $cacheId, $cacheDir, [], self::$cacheBaseDir)) {
            // Запрос
            $content = Request::makeRequest($url);

            // Декодируем
            $data = json_decode($content, true);

            if (!$data || $data['status'] === 'ERROR') {
                if ($data['message']) {
                    Helper::notifyError($data['message']);
                }

                $cache->abortDataCache();
            }

            $cache->endDataCache(
                [
                    'arrResponse' => $data
                ]
            );

            // Записывает директорию кеша в базу
            if ($noteInBase) {
                CacheTable::addOrUpdate([
                    'TAG'  => $cacheId,
                    'NAME' => $data['result']['title'],
                    'DATE' => new DateTime(),
                ]);
            }
        }

        return ($data['status'] === 'FOUND' && $data['result']) ?
            $data['result'] :
            [];
    }

    static function clearAllCache()
    {
        $cache = BitrixCache::createInstance();
        $cache->cleanDir('', self::$cacheBaseDir);

        Application::getConnection()
            ->query('DELETE FROM ' . CacheTable::getTableName() . ';');
    }

    static function clearListCache()
    {
        $cache = BitrixCache::createInstance();
        $cache->cleanDir('getpageslist', self::$cacheBaseDir);
        $cache->cleanDir('getprojectslist', self::$cacheBaseDir);
    }

    static public function clearPageCache($tag)
    {
        $cache = BitrixCache::createInstance();
        $cache->cleanDir($tag, self::$cacheBaseDir);

        CacheTable::delete($tag);
    }
}
