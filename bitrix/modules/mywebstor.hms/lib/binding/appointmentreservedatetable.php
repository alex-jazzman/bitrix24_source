<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DatetimeField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use MyWebstor\Hms\AppointmentTable;

class AppointmentReserveDateTable extends DataManager {
    public static function getTableName() {
        return 'hms_appointment_reserve_date';
    }

    public static function getMap() {
        return array(
            (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete(),
            (new IntegerField('APPOINTMENT_ID'))
                ->configureRequired(),
            (new DatetimeField('DATE_FROM'))
                ->configureRequired(),
            (new DatetimeField('DATE_TO'))
                ->configureRequired(),

            (new ReferenceField(
                'APPOINTMENT',
                AppointmentTable::class,
                Join::on('this.APPOINTMENT_ID', 'ref.ID')
            ))
        );
    }
}
