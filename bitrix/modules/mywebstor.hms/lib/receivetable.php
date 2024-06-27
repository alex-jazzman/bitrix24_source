<?

namespace MyWebstor\Hms;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DatetimeField;
use Bitrix\Main\Entity\EnumField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\Relations\OneToMany;
use Bitrix\Main\Type\DateTime;
use MyWebstor\Hms\Binding\ReceiveDealTable;
use MyWebstor\Hms\Receive\BaseReceiveTable;
use MyWebstor\Hms\Object\Receive;

Loc::loadMessages(__FILE__);

class ReceiveTable extends DataManager {
    public static function getReceiveTypes($type = null) {
        $types = \MyWebstorHmsHelper::getReceiveTypes();
        if (!$type) return $types;

        return $types[$type] ?: null;
    }

    public static function getTableName() {
        return 'hms_receive';
    }

    public static function getObjectClass() {
        return Receive::class;
    }

    public static function getMap() {
        return array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_ENTITY_ID_FIELD')),
            'TYPE' => (new EnumField('TYPE'))
                ->configureValues(array_keys(static::getReceiveTypes()))
                ->configureDefaultValue("base")
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_ENTITY_TYPE_FIELD')),
            'DATE_START' => (new DatetimeField('DATE_START'))
                ->configureRequired()
                ->configureDefaultValue(function () {
                    return new DateTime();
                })
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_ENTITY_DATE_START_FIELD')),
            'DATE_END' => (new DatetimeField('DATE_END'))
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_ENTITY_DATE_END_FIELD')),

            'APPOINTMENT' => (new ReferenceField(
                'APPOINTMENT',
                AppointmentTable::class,
                Join::on('this.ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_ENTITY_APPOINTMENT_FIELD')),
        );
    }
}
