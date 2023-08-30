<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Tables;

use Bitrix\Main\Entity;

class MessagesTable extends Entity\DataManager
{
    const ID = 'messageId';
    const SENDING_ID = 'sendingId';
    const STATUS = 'status';
    const DESTINATION = 'destination';
    const TEXT = 'text';
    const GUID = 'guid';
    const ENCODING = 'encoding';
    const LAST_MODIFIED = 'lastModified';
    const RESULT = 'result';
    const ENTITY_ID = 'entityId';

    public static function getTableName()
    {
        return 'sms4b_sending_message';
    }

    public static function getMap()
    {
        return [
            new Entity\IntegerField(self::ID, [
                'primary'      => true,
                'autocomplete' => true,
            ]),
            new Entity\IntegerField(self::SENDING_ID),
            new Entity\IntegerField(self::STATUS),
            new Entity\StringField(self::DESTINATION),
            new Entity\StringField(self::TEXT),
            new Entity\StringField(self::GUID),
            new Entity\IntegerField(self::ENCODING),
            new Entity\DatetimeField(self::LAST_MODIFIED),
            new Entity\StringField(self::RESULT),
            new Entity\IntegerField(self::ENTITY_ID),
        ];
    }


}