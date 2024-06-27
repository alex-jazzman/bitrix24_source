<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Crm\ContactTable;
use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use MyWebstor\Hms\AppointmentTable;

class AppointmentContactTable extends DataManager {
    public static function getTableName() {
        return 'hms_appointment_contact';
    }

    public static function getMap() {
        return array(
            (new IntegerField('APPOINTMENT_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),
            (new IntegerField('CONTACT_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),
            (new IntegerField('SORT'))
                ->configureDefaultValue(0),
            (new BooleanField('IS_PRIMARY'))
                ->configureValues('N', 'Y')
                ->configureDefaultValue(false),

            (new ReferenceField(
                'APPOINTMENT',
                AppointmentTable::class,
                Join::on('this.APPOINTMENT_ID', 'ref.ID')
            )),
            (new ReferenceField(
                'CONTACT',
                ContactTable::class,
                Join::on('this.CONTACT_ID', 'ref.ID')
            )),
        );
    }
}
