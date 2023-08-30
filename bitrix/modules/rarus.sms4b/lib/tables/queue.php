<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Tables;

use Bitrix\Main\Entity;

class QueueTable extends Entity\DataManager
{

    const ID = 'id';
    const SENDING_ID = 'sendingId';
    const GUID = 'guid';
    const GROUP_ID = 'groupId';
    const SENDER = 'sender';
    const DESTINATION = 'destination';
    const TEXT = 'text';
    const ENCODING = 'encoding';
    const DATE_START = 'startSend';
    const DATE_ACTUAL = 'finishSend';
    const ALLOWED_DELIVERY_INTERVAL = 'allowedDeliveryInterval';
    const SENDING_SOURCE = 'sendingSource';
    const RESULT = 'result';
    const STATUS_IN_QUEUE = 'statusInQueue';

    /**
     * @return string
     */
    public static function getTableName()
    {
        return 'sms4b_sendings_queue';
    }

    public static function getMap()
    {
        return [
            new Entity\IntegerField(self::ID, [
                'primary' => true,
                'autocomplete' => true,
            ]),
            new Entity\IntegerField(self::SENDING_ID),
            new Entity\StringField(self::GUID),
            new Entity\IntegerField(self::GROUP_ID),
            new Entity\StringField(self::SENDER),
            new Entity\StringField(self::DESTINATION),
            new Entity\StringField(self::TEXT),
            new Entity\IntegerField(self::ENCODING),
            new Entity\DatetimeField(self::DATE_START),
            new Entity\DatetimeField(self::DATE_ACTUAL),
            new Entity\StringField(self::ALLOWED_DELIVERY_INTERVAL),
            new Entity\StringField(self::SENDING_SOURCE),
            new Entity\StringField(self::RESULT),
            new Entity\IntegerField(self::STATUS_IN_QUEUE),
        ];
    }


}