<?

namespace MyWebstor\Hms\Binding;

use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\Vhi\VhiServiceTypeTable;
use MyWebstor\Hms\Vhi\VhiTypeTable;

Loc::loadMessages(__FILE__);

class VhiTypeVhiServiceTypeTable extends DataManager {
    public static function getTableName() {
        return 'hms_vhi_type_vhi_service_type';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'VHI_TYPE_ID' => (new IntegerField('VHI_TYPE_ID'))
                ->configurePrimary()
                ->configureRequired(),
            'VHI_SERVICE_TYPE_ID' => (new IntegerField('VHI_SERVICE_TYPE_ID'))
                ->configurePrimary()
                ->configureRequired(),
            'ACTIVE' => (new BooleanField('ACTIVE'))
                ->configureRequired()
                ->configureValues('N', 'Y')
                ->configureDefaultValue(true),

            'VHI_TYPE' => (new ReferenceField(
                'VHI_TYPE',
                VhiTypeTable::class,
                Join::on('this.VHI_TYPE_ID', 'ref.ID')
            )),
            'VHI_SERVICE_TYPE' => (new ReferenceField(
                'VHI_SERVICE_TYPE',
                VhiServiceTypeTable::class,
                Join::on('this.VHI_SERVICE_TYPE_ID', 'ref.ID')
            )),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
