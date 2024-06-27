<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Crm\DealTable;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use MyWebstor\Hms\AppointmentTable;

class AppointmentDealTable extends DataManager {
    public static function getTableName() {
        return 'hms_appointment_deal';
    }

    public static function getMap() {
        return array(
            (new IntegerField('APPOINTMENT_ID'))
                ->configurePrimary()
                ->configureRequired(),
            (new IntegerField('DEAL_ID'))
                ->configurePrimary()
                ->configureRequired(),

            (new ReferenceField(
                'APPOINTMENT',
                AppointmentTable::class,
                Join::on('this.APPOINTMENT_ID', 'ref.ID')
            )),
            (new ReferenceField(
                'DEAL',
                DealTable::class,
                Join::on('this.DEAL_ID', 'ref.ID')
            )),
        );
    }
}
