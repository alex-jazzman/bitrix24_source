<?

namespace MyWebstor\Hms;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\EnumField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\ORM\Fields\ArrayField;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class SpecializationTable extends DataManager {
    public static function getTableName() {
        return 'hms_specialization';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_SPECIALIZATION_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_SPECIALIZATION_ENTITY_XML_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_SPECIALIZATION_ENTITY_TITLE_FIELD')),
            'RECEIVE_TYPE' => (new EnumField('RECEIVE_TYPE'))
                ->configureValues(array_keys(\MyWebstorHmsHelper::getReceiveTypes()))
                ->configureDefaultValue("base")
                ->configureTitle(Loc::getMessage('HMS_SPECIALIZATION_ENTITY_RECEIVE_TYPE_FIELD')),
            'SERVICES' => (new ArrayField('SERVICES'))
                ->configureSerializationPhp()
                ->configureDefaultValue(function () {
                    return array();
                })
                ->configureTitle(Loc::getMessage('HMS_SPECIALIZATION_ENTITY_SERVICES_FIELD'))
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
