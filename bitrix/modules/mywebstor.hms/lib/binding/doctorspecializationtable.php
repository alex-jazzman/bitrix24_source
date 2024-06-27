<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\SpecializationTable;

class DoctorSpecializationTable extends DataManager {
    public static function getTableName() {
        return 'hms_doctor_specialization';
    }

    public static function getMap() {
        return array(
            (new IntegerField('DOCTOR_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),
            (new IntegerField('SPECIALIZATION_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),

            (new ReferenceField(
                'DOCTOR',
                DoctorTable::class,
                Join::on('this.DOCTOR_ID', 'ref.ID')
            )),
            (new ReferenceField(
                'SPECIALIZATION',
                SpecializationTable::class,
                Join::on('this.SPECIALIZATION_ID', 'ref.ID')
            )),
        );
    }
}
