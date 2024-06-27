<?

namespace MyWebstor\Hms\Vhi;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\ArrayField;

Loc::loadMessages(__FILE__);

class VhiServiceTypeTable extends DataManager {
    public static function getTableName() {
        return 'hms_vhi_service_type';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_VHI_SERVICE_TYPE_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_VHI_SERVICE_TYPE_ENTITY_XML_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_SERVICE_TYPE_ENTITY_TITLE_FIELD')),
            'SERVICES' => (new ArrayField('SERVICES'))
                ->configureSerializationPhp()
                ->configureDefaultValue(function () {
                    return array();
                })
                ->configureTitle(Loc::getMessage('HMS_VHI_SERVICE_TYPE_ENTITY_SERVICES_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
