<?

namespace MyWebstor\Hms\Schedule;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DatetimeField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Entity\TextField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\ArrayField;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\OfficeTable;

Loc::loadMessages(__FILE__);

class WorktimeTable extends DataManager {
    public static function getTableName() {
        return 'hms_schedule_worktime';
    }

    public static function getMap() {
        return array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_ID_FIELD')),
            'SCHEDULE_ID' => (new IntegerField('SCHEDULE_ID'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_SCHEDULE_ID_FIELD')),
            'DOCTOR_ID' => (new IntegerField('DOCTOR_ID'))
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_DOCTOR_ID_FIELD')),
            'OFFICE_ID' => (new IntegerField('OFFICE_ID'))
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_OFFICE_ID_FIELD')),
            'WORKTIME_FROM' => (new DatetimeField('WORKTIME_FROM'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_WORKTIME_FROM_FIELD')),
            'WORKTIME_TO' => (new DatetimeField('WORKTIME_TO'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_WORKTIME_TO_FIELD')),
            'COLOR' => (new StringField('COLOR'))
                ->configureSize(7)
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_COLOR_FIELD')),
            'DESCRIPTION' => (new StringField('DESCRIPTION'))
                ->configureSize(255)
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_DESCRIPTION_FIELD')),
            'BREAKS' => (new ArrayField('BREAKS'))
                ->configureSerializationPhp()
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_BREAKS_FIELD')),

            'SCHEDULE' => (new ReferenceField(
                'SCHEDULE',
                ScheduleTable::class,
                Join::on('this.SCHEDULE_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_SCHEDULE_FIELD')),
            'DOCTOR' => (new ReferenceField(
                'DOCTOR',
                DoctorTable::class,
                Join::on('this.DOCTOR_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_DOCTOR_FIELD')),
            'OFFICE' => (new ReferenceField(
                'OFFICE',
                OfficeTable::class,
                Join::on('this.OFFICE_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_WORKTIME_ENTITY_OFFICE_FIELD'))
        );
    }
}
