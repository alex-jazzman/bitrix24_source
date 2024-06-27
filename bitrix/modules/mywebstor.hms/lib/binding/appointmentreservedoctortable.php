<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use MyWebstor\Hms\AppointmentTable;
use MyWebstor\Hms\DoctorTable;

class AppointmentReserveDoctorTable extends DataManager {
    public static function getTableName() {
        return 'hms_appointment_reserve_doctor';
    }

    public static function getMap() {
        return array(
            (new IntegerField('APPOINTMENT_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),
            (new IntegerField('DOCTOR_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),

            (new ReferenceField(
                'APPOINTMENT',
                AppointmentTable::class,
                Join::on('this.APPOINTMENT_ID', 'ref.ID')
            )),
            (new ReferenceField(
                'DOCTOR',
                DoctorTable::class,
                Join::on('this.DOCTOR_ID', 'ref.ID')
            ))
        );
    }
}
