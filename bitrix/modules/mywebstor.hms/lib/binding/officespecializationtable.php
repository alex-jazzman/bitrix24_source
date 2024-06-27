<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use MyWebstor\Hms\OfficeTable;
use MyWebstor\Hms\SpecializationTable;

class OfficeSpecializationTable extends DataManager {
    public static function getTableName() {
        return 'hms_office_specialization';
    }

    public static function getMap() {
        return array(
            (new IntegerField('OFFICE_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),
            (new IntegerField('SPECIALIZATION_ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0),

            (new ReferenceField(
                'OFFICE',
                OfficeTable::class,
                Join::on('this.OFFICE_ID', 'ref.ID')
            )),
            (new ReferenceField(
                'SPECIALIZATION',
                SpecializationTable::class,
                Join::on('this.SPECIALIZATION_ID', 'ref.ID')
            )),
        );
    }
}
