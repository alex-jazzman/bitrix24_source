<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\SiteTable;
use Bitrix\Main\Config\Option;

class Config
{
    const TOKEN_EXPIRE = 7 * 24 * 60 * 60;

    /**
     * @param  string  $name
     *
     * @return string
     */
    public static function get($name /*, $site = ''*/)
    {
        return Option::get(\SotbitRestAPI::MODULE_ID, $name, "" /*, (!empty($site) ? $site : SITE_ID)*/);
    }

    /**
     * @param  string  $name
     * @param  string  $value
     */
    public static function set($name, $value /*, $site = ''*/)
    {
        return Option::set(\SotbitRestAPI::MODULE_ID, $name, $value /*, (!empty($site) ? $site : SITE_ID)*/);
    }

    /**
     * @return string
     */
    public static function getRouteMainPath(): string
    {
        $url = self::get('URL');
        if(empty($url)) {
            $url = \SotbitRestAPI::DEFAULT_PATH;
        }

        return '/'.trim($url, '/');
    }

    /**
     * @return bool
     */
    public static function isModuleActive(): bool
    {
        return self::get('ACTIVE') === 'Y' && PHP_VERSION_ID > 70200;
    }

    /**
     * @return string
     */
    public static function getSecretKey(): string
    {
        $secretKey = self::get('SECRET_KEY');
        if(empty($secretKey)) {
            $secretKey = Helper::generateSecretKey();
            self::set('SECRET_KEY', $secretKey);
        }

        return $secretKey;
    }

    /**
     * @return string
     */
    public static function getTokenExpire(): int
    {
        $tokenExpire = (int)self::get('TOKEN_EXPIRE');
        if(empty($tokenExpire)) {
            $tokenExpire = self::TOKEN_EXPIRE;
            self::set('TOKEN_EXPIRE', $tokenExpire);
        }

        return $tokenExpire;
    }

    /**
     * @return array
     */
    public static function getSites()
    {
        $sites = [];
        try {
            $rs = SiteTable::getList(
                [
                    'select' => [
                        'SITE_NAME',
                        'LID',
                    ],
                    'filter' => ['ACTIVE' => 'Y'],
                ]
            );
            while($site = $rs->fetch()) {
                $sites[$site['LID']] = $site['SITE_NAME'];
            }
        } catch(ObjectPropertyException $e) {
            $e->getMessage();
        } catch(ArgumentException $e) {
            $e->getMessage();
        } catch(SystemException $e) {
            $e->getMessage();
        }
        try {
            if(!is_array($sites) || count($sites) == 0) {
                throw new SystemException("Cannot get sites");
            }
        } catch(SystemException $exception) {
            echo $exception->getMessage();
        }

        return $sites;
    }

    public static function isDebug()
    {
        return self::get('DEBUG') === 'Y';
    }

    public static function isLog()
    {
        return self::get('LOG') === 'Y';
    }

}