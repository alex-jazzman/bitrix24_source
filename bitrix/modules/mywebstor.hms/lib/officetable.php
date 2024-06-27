<?

namespace MyWebstor\Hms;

use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\Relations\ManyToMany;
use MyWebstor\Hms\Binding\OfficeSpecializationTable;

Loc::loadMessages(__FILE__);

class OfficeTable extends DataManager {
    public static function getTableName() {
        return 'hms_office';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_XML_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_TITLE_FIELD')),
            'CLINIC_ID' => (new IntegerField('CLINIC_ID'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_CLINIC_ID_FIELD')),
            'IS_CONTINUOUS_SCHEME' => (new BooleanField('IS_CONTINUOUS_SCHEME'))
                ->configureValues('N', 'Y')
                ->configureDefaultValue(false)
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_IS_CONTINUOUS_SCHEME_FIELD')),

            'CLINIC' => (new ReferenceField(
                'CLINIC',
                ClinicTable::class,
                Join::on('this.CLINIC_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_CLINIC_FIELD')),
            'SPECIALIZATION' => (new ManyToMany(
                'SPECIALIZATION',
                SpecializationTable::class
            ))
                ->configureTableName(OfficeSpecializationTable::getTableName())
                ->configureLocalPrimary('ID', 'OFFICE_ID')
                ->configureLocalReference('OFFICE')
                ->configureRemotePrimary('ID', 'SPECIALIZATION_ID')
                ->configureRemoteReference('SPECIALIZATION')
                ->configureJoinType(Join::TYPE_LEFT)
                ->configureTitle(Loc::getMessage('HMS_OFFICE_ENTITY_SPECIALIZATION_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
