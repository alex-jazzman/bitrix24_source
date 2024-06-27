<?

namespace MyWebstor\Hms\Vhi;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\Relations\CascadePolicy;
use Bitrix\Main\ORM\Fields\Relations\ManyToMany;
use Bitrix\Main\ORM\Fields\Relations\OneToMany;
use MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable;

Loc::loadMessages(__FILE__);

class VhiTypeTable extends DataManager {
    public static function getTableName() {
        return 'hms_vhi_type';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_VHI_TYPE_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_VHI_TYPE_ENTITY_XML_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureTitle(Loc::getMessage('HMS_VHI_TYPE_ENTITY_TITLE_FIELD')),

            'SERVICE_TYPE' => (new OneToMany(
                'SERVICE_TYPE',
                VhiTypeVhiServiceTypeTable::class,
                'VHI_TYPE'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureCascadeSavePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_VHI_TYPE_ENTITY_SERVICE_TYPE_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
