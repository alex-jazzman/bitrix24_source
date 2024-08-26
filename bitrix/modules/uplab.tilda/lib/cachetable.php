<?php

namespace Uplab\Tilda;

use Bitrix\Main\Entity;

class CacheTable extends Entity\DataManager
{
    /**
     * @return string
     */
    public static function getTableName()
    {
        return 'tilda_pages_cache';
    }

    /**
     * @return array
     * @throws \Bitrix\Main\SystemException
     */
    public static function getMap()
    {
        return [
            (new Entity\StringField('TAG'))
                ->configurePrimary()
                ->configureSize(32),
            (new Entity\StringField('NAME'))
                ->configureSize(255)
                ->configureNullable(),
            (new Entity\DatetimeField('DATE'))
                ->configureNullable(),
        ];
    }

    public static function addOrUpdate($data)
    {
        if (!$data['TAG']) {
            return false;
        }

        $row = self::getByPrimary($data['TAG'])->fetch();

        if ($row) {
            CacheTable::update(
                $data['TAG'],
                $data
            );
        } else {
            CacheTable::add($data);
        }

        return true;
    }
}
