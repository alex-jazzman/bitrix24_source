<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Tables;

use Bitrix\Main\Entity;

class IncomingTable extends Entity\DataManager
{
    const ID = 'id';
    const GUID = 'guid';
    const DESTINATION = 'destination';
    const TEXT = 'text';
    const ENCODING = 'encoding';
    const TOTAL = 'total';
    const PART = 'part';
    const MOMENT = 'moment';
    const TIME = 'time';
    const SOURCE = 'source';

    public static function getTableName()
    {
        return 'sms4b_incoming';
    }

    public static function getMap()
    {
        return [
            new Entity\IntegerField(self::ID, [
                'primary'      => true,
                'autocomplete' => true,
            ]),
            new Entity\StringField(self::GUID),
            new Entity\StringField(self::DESTINATION),
            new Entity\StringField(self::TEXT),
            new Entity\IntegerField(self::ENCODING),
            new Entity\IntegerField(self::TOTAL),
            new Entity\IntegerField(self::PART),
            new Entity\StringField(self::MOMENT),
            new Entity\StringField(self::TIME),
            new Entity\StringField(self::SOURCE),
        ];
    }
}