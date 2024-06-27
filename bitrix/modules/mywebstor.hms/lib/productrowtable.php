<?

namespace MyWebstor\Hms;

use Bitrix\Crm\ProductRowTable as CrmProductRowTable;
use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\ArrayField;

Loc::loadMessages(__FILE__);

class ProductRowTable extends DataManager {
    public static function getTableName() {
        return 'hms_product_row';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_PRODUCT_ROW_ENTITY_ID_FIELD')),
            'IS_VHI' => (new BooleanField('IS_VHI'))
                ->configureValues('N', 'Y')
                ->configureDefaultValue(false)
                ->configureTitle(Loc::getMessage('HMS_PRODUCT_ROW_ENTITY_IS_VHI_FIELD')),
            'TEETH' => (new ArrayField('TEETH'))
                ->configureSerializationJson()
                ->configureDefaultValue(function () {
                    return array();
                })
                ->configureTitle(Loc::getMessage('HMS_PRODUCT_ROW_ENTITY_TEETH_FIELD')),

            'PRODUCT_ROW' => (new ReferenceField(
                'PRODUCT_ROW',
                CrmProductRowTable::class,
                Join::on('this.ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_PRODUCT_ROW_ENTITY_PRODUCT_ROW_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
