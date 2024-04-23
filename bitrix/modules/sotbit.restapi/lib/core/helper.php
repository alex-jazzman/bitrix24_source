<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\Type;
use Bitrix\Main\Text\Encoding;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Sotbit\RestAPI\Config\Config;

class Helper
{
    /**
     * @return string
     */
    public static function generateSecretKey(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff)
        );
    }

    /**
     * @param  string  $file
     *
     * @return false
     */
    public static function checkCustomFile(string $file)
    {
        if(is_dir(SR_APP_CUSTOM_PATH) && is_file(SR_APP_CUSTOM_PATH.$file)) {
            return realpath(SR_APP_CUSTOM_PATH.$file);
        }

        return false;
    }

    /**
     * @param  array  $arr
     *
     * @return array
     */
    public static function arrayValueRecursive(array $arr)
    {
        $val = [];
        array_walk_recursive(
            $arr,
            static function($v, $k) use (&$val) {
                if(!empty($v)) {
                    $val[] = $v;
                }
            }
        );

        return count($val) > 1 ? $val : array_pop($val);
    }

    /**
     * Convert date to string format
     *
     * @param $date
     *
     * @return array
     */
    public static function convertDate($date): string
    {
        if(method_exists($date, 'toString')) {
            return $date->toString();
        }

        return $date->format("H:i:s Y.m.d");
    }

    /**
     * Convert date to string format in array
     *
     * @param $array
     *
     * @return array
     */
    public static function convertOutputArray($array)
    {
        if(!empty($array) && is_array($array)) {
            array_walk_recursive(
                $array,
                function(&$v) {
                    if($v instanceof Type\Date || $v instanceof Type\DateTime) {
                        $v = self::convertDate($v);
                    } elseif(is_string($v)) {
                        $v = trim($v);
                    }
                }
            );
        }

        return $array ? : [];
    }

    /**
     * @param $text
     *
     * @return array|bool|\SplFixedArray|string
     */
    public static function convertEncodingToSite($text)
    {
        if($text && strtoupper(SITE_CHARSET) !== 'UTF-8') {
            $text = Encoding::convertEncoding($text, 'UTF-8', SITE_CHARSET);
        }

        return $text;
    }

    /**
     * @param $text
     *
     * @return array|bool|\SplFixedArray|string
     */
    public static function convertEncodingToUtf8($text)
    {
        if($text && strtoupper(SITE_CHARSET) !== 'UTF-8') {
            $text = Encoding::convertEncoding($text, SITE_CHARSET, 'UTF-8');
        }

        return $text;
    }

    /**
     * Output error
     *
     * @param  string  $string
     *
     * @return string
     */
    public static function error(string $string): string
    {
        return '
            <div class="adm-info-message-wrap adm-info-message-red">
                <div class="adm-info-message">
                    <div class="adm-info-message-title">'.$string.'</div>
                    <div class="adm-info-message-icon"></div>
                </div>
            </div>';
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

    public static function getIblockIds($type)
    {
        $return = [];
        $iType = Config::getInstance()->get('CATALOG_TYPE');
        try {
            Loader::includeModule('iblock');
        } catch (LoaderException $e) {
            echo $e->getMessage();
        }

        $rs = \Bitrix\Iblock\IblockTable::getList(
            [
                'select' => [
                    'ID',
                    'NAME',
                ],
                'filter' => [
                    'ACTIVE' => 'Y',
                    'IBLOCK_TYPE_ID' => $iType,
                ],
            ]
        );
        while ($iId = $rs->fetch()) {
            $return[$iId['ID']] = '['.$iId['ID'].'] '.$iId['NAME'];
        }

        return $return;
    }

    public static function getIblockTypes()
    {
        $return = [];
        try {
            Loader::includeModule('iblock');
        } catch (LoaderException $e) {
            echo $e->getMessage();
        }

        $rs = \Bitrix\Iblock\TypeTable::getList(
            [
                'select' => [
                    'ID',
                    'LANG_MESSAGE.NAME',
                ],
                'filter' => [
                    'LANG_MESSAGE.LANGUAGE_ID' => LANGUAGE_ID,
                ],
            ]
        );
        while ($iType = $rs->fetch()) {
            $return[$iType['ID']] = '['.$iType['ID'].'] '.$iType['IBLOCK_TYPE_LANG_MESSAGE_NAME'];
        }

        return $return;
    }

    public static function isJson($string): bool
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }


    public static function getIdFromLoginUser($login)
    {
        $query = \CUser::GetByLogin($login)->fetch();
        return $query ? $query['ID'] : null;
    }
    public static function getUserGroups(int $userId): array
    {
        $return = [];
        $result = \Bitrix\Main\UserGroupTable::getList(
            [
                'filter' => [
                    'USER_ID'      => $userId,
                    'GROUP.ACTIVE' => 'Y',
                ],
                'select' => ['GROUP_ID']
            ]
        );

        while($arGroup = $result->fetch()) {
            $return[] = $arGroup['GROUP_ID'];
        }

        return $return;
    }

    public static function multisortArrayKey(&$array): void
    {
        if(is_array($array)) {
            foreach ($array as &$value) {
                if (is_array($value)) {
                    static::multisortArrayKey($value, SORT_NATURAL);
                }
            }
            ksort($array);
        }
    }
}