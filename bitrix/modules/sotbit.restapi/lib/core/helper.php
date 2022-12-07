<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\Type;
use Bitrix\Main\Text\Encoding;


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
        if(is_dir(SR_CONFIG_CUSTOM_PATH) && is_file(SR_CONFIG_CUSTOM_PATH.$file)) {
            return realpath(SR_CONFIG_CUSTOM_PATH.$file);
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
        return $date->format("Y-m-d H:i:s");
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
                    if($v instanceof Type\DateTime || $v instanceof Type\Date) {
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

}