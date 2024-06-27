<?

namespace MyWebstor\Hms;

use Bitrix\Crm\CompanyTable;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class ClinicTable extends DataManager {
    public static function getTableName() {
        return 'hms_clinic';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_CLINIC_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_CLINIC_ENTITY_XML_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_CLINIC_ENTITY_TITLE_FIELD')),
            'COMPANY_ID' => (new IntegerField('COMPANY_ID'))
                ->configureDefaultValue(null)
                ->configureTitle(Loc::getMessage('HMS_CLINIC_ENTITY_COMPANY_ID_FIELD')),

            'COMPANY' => (new ReferenceField(
                'COMPANY',
                CompanyTable::class,
                Join::on('this.COMPANY_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_CLINIC_ENTITY_COMPANY_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
