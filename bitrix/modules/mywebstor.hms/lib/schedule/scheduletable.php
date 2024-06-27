<?

namespace MyWebstor\Hms\Schedule;

use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DateField;
use Bitrix\Main\Entity\DatetimeField;
use Bitrix\Main\Entity\EntityError;
use Bitrix\Main\Entity\EnumField;
use Bitrix\Main\Entity\EventResult;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Entity\TextField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Event;
use Bitrix\Main\ORM\Fields\ArrayField;
use Bitrix\Main\ORM\Fields\Relations\CascadePolicy;
use Bitrix\Main\ORM\Fields\Relations\OneToMany;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UserTable;
use MyWebstor\Hms\ClinicTable;

Loc::loadMessages(__FILE__);

class ScheduleTable extends DataManager {
    public const SCHEDULE_MODE_DOCTOR_TO_OFFICE = 'D';
    public const SCHEDULE_MODE_OFFICE_TO_DOCTOR = 'O';

    public static function getTableName() {
        return 'hms_schedule';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_XML_ID_FIELD')),
            'ACTIVE' => (new BooleanField('ACTIVE'))
                ->configureRequired()
                ->configureValues('N', 'Y')
                ->configureDefaultValue(false)
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_ACTIVE_FIELD')),
            'CLINIC_ID' => (new IntegerField('CLINIC_ID'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_CLINIC_ID_FIELD')),
            'MODE' => (new EnumField('MODE'))
                ->configureRequired()
                ->configureValues(array(
                    static::SCHEDULE_MODE_DOCTOR_TO_OFFICE,
                    static::SCHEDULE_MODE_OFFICE_TO_DOCTOR
                ))
                ->configureDefaultValue(static::SCHEDULE_MODE_DOCTOR_TO_OFFICE)
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_MODE_FIELD')),
            'DATE_CREATE' => (new DatetimeField('DATE_CREATE'))
                ->configureRequired()
                ->configureDefaultValue(function () {
                    return new DateTime();
                })
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_DATE_CREATE_FIELD')),
            'PARTICIPANTS' => (new ArrayField('PARTICIPANTS'))
                ->configureSerializationPhp()
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_PARTICIPANTS_FIELD')),
            'PLAN_DATE' => (new DateField('PLAN_DATE'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_PLAN_DATE_FIELD')),
            'NUMBER' => (new StringField('NUMBER'))
                ->configureRequired()
                ->configureSize(50)
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_NUMBER_FIELD')),
            'ASSIGNED_BY_ID' => (new IntegerField('ASSIGNED_BY_ID'))
                ->configureRequired()
                ->configureDefaultValue(function () {
                    /** @var \CUser $USER */
                    global $USER;
                    return $USER->GetID();
                })
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_ASSIGNED_BY_ID_FIELD')),
            'COMMENT' => (new StringField('COMMENT'))
                ->configureSize(255)
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_COMMENT_FIELD')),

            'CLINIC' => (new ReferenceField(
                'CLINIC',
                ClinicTable::class,
                Join::on('this.CLINIC_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_CLINIC_FIELD')),
            'ASSIGNED_BY' => (new ReferenceField(
                'ASSIGNED_BY',
                UserTable::class,
                Join::on('this.ASSIGNED_BY_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_ASSIGNED_BY_FIELD')),
            'ASSIGNED_BY_FULL_NAME' => (new ExpressionField(
                'ASSIGNED_BY_FULL_NAME',
                'CONCAT_WS(\' \', IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL))',
                array(
                    'ASSIGNED_BY.LAST_NAME',
                    'ASSIGNED_BY.LAST_NAME',
                    'ASSIGNED_BY.NAME',
                    'ASSIGNED_BY.NAME',
                    'ASSIGNED_BY.SECOND_NAME',
                    'ASSIGNED_BY.SECOND_NAME'
                )
            ))
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_ASSIGNED_BY_FULL_NAME_FIELD')),
            'WORKTIME' => (new OneToMany(
                'WORKTIME',
                WorktimeTable::class,
                'SCHEDULE'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_SCHEDULE_ENTITY_WORKTIME_FIELD'))
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }

    public static function onBeforeDelete(Event $event) {
        $parameters = $event->getParameters();
        $scheduleID = $parameters["primary"]["ID"];
        $schedule = static::getById($scheduleID)->fetch();
        if (!$schedule) return;

        if ($schedule["ACTIVE"] == "Y") {
            $result = new EventResult();
            $result->addError(new EntityError(Loc::getMessage("HMS_SCHEDULE_DELETE_ERROR_ACTIVE_SCHEDULE")));

            $event->addResult($result);
        }
    }
}
