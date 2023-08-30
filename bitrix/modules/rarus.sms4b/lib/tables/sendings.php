<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Tables;

use Bitrix\Main\Entity;

class SendingsTable extends Entity\DataManager
{
    const ID = 'id';
    const SENDER = 'sender';
    const SOURCE_ID = 'sourceId';
    const DATE_START_FOR_USER = 'startSendForUser';
    const DATE_START = 'startSend';
    const DATE_ACTUAL = 'finishSend';
    const ALLOWED_DELIVERY_INTERVAL = 'allowedDeliveryInterval';
    const MAIL_EVENT = 'mailEvent';

    const MESSAGE_ID = 'messageId';
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
        return 'sms4b_sendings';
    }

    public static function getMap()
    {
        return [
            new Entity\IntegerField(self::ID, [
                'primary'      => true,
                'autocomplete' => true,
            ]),
            new Entity\StringField(self::SENDER),
            new Entity\IntegerField(self::SOURCE_ID),
            new Entity\DatetimeField(self::DATE_START_FOR_USER),
            new Entity\DatetimeField(self::DATE_START),
            new Entity\DatetimeField(self::DATE_ACTUAL),
            new Entity\StringField(self::MAIL_EVENT),
            new Entity\StringField(self::ALLOWED_DELIVERY_INTERVAL),

            new Entity\ReferenceField(
                'MESSAGES',
                'Rarus\Sms4b\Tables\MessagesTable',
                ['=this.' . self::ID => 'ref.' . MessagesTable::SENDING_ID],
                ['join_type' => 'LEFT']
            ),
        ];
    }

}