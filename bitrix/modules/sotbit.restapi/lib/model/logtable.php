<?php

namespace Sotbit\RestAPI\Model;

use Bitrix\Main,
    Bitrix\Main\Localization\Loc,
    Bitrix\Main\Entity;

/**
 * Class DeviceTokenTable
 *
 * @package Sotbit\B2bMobile\Model
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 23.12.2020
 */
class LogTable extends Entity\DataManager
{
    /**
     *
     * @return string
     */
    public static function getTableName()
    {
        return 'sotbit_restapi_log';
    }

    /**
     *
     * @return array
     */
    public static function getMap()
    {
        return [
            new Entity\IntegerField (
                'ID', [
                'primary'      => true,
                'autocomplete' => true,
            ]
            ),
            new Entity\DatetimeField(
                'DATE', [
                'default_value' => new Main\Type\Datetime(),
                'title'         => Loc::getMessage(self::getTableName().'_DATE'),
            ]
            ),
            new Entity\StringField (
                'REQUEST_METHOD', [
                'title' => Loc::getMessage(self::getTableName().'_REQUEST_METHOD'),
            ]
            ),
            new Entity\StringField (
                'REQUEST_PATH', [
                'title' => Loc::getMessage(self::getTableName().'_REQUEST_PATH'),
            ]
            ),
            new Entity\IntegerField (
                'USER_ID', [
                'title' => Loc::getMessage(self::getTableName().'_USER_ID'),
            ]
            ),
            new Entity\StringField (
                'RESPONSE_HTTP_CODE', [
                'title' => Loc::getMessage(self::getTableName().'_RESPONSE_HTTP_CODE'),
            ]
            ),
            new Entity\StringField (
                'IP', [
                'title' => Loc::getMessage(self::getTableName().'_IP'),
            ]
            ),

        ];
    }
}

?>