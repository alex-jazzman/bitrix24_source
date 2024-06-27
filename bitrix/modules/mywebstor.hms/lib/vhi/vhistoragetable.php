<?

namespace MyWebstor\Hms\Vhi;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DateField;
use Bitrix\Main\Entity\EnumField;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

class VhiStorageTable extends DataManager {
    public static function getTableName() {
        return 'hms_vhi_storage';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_ID_FIELD')),
            'VHI_TYPE_ID' => (new IntegerField('VHI_TYPE_ID'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_VHI_TYPE_ID_FIELD')),
            'NUMBER' => (new StringField('NUMBER'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_NUMBER_FIELD')),
            'LAST_NAME' => (new StringField('LAST_NAME'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_LAST_NAME_FIELD')),
            'NAME' => (new StringField('NAME'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_NAME_FIELD')),
            'SECOND_NAME' => (new StringField('SECOND_NAME'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_SECOND_NAME_FIELD')),
            'BIRTHDATE' => (new DateField('BIRTHDATE'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_BIRTHDATE_FIELD')),
            'DATE_START' => (new DateField('DATE_START'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_DATE_START_FIELD')),
            'DATE_END' => (new DateField('DATE_END'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_DATE_END_FIELD')),
            'GENDER' => (new EnumField('GENDER'))
                ->configureValues(array(
                    'M',
                    'F'
                ))
                ->configureDefaultValue('M')
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_GENDER_FIELD')),
            'ADDRESS' => (new StringField('ADDRESS'))
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_ADDRESS_FIELD')),
            'PHONE' => (new StringField('PHONE'))
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_PHONE_FIELD')),

            'CONTACT_TITLE' => (new ExpressionField(
                'CONTACT_TITLE',
                'CONCAT_WS(" ", IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL))',
                array(
                    'LAST_NAME',
                    'LAST_NAME',
                    'NAME',
                    'NAME',
                    'SECOND_NAME',
                    'SECOND_NAME',
                )
            ))
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_CONTACT_TITLE_FIELD')),
            'VHI_TYPE' => (new ReferenceField(
                'VHI_TYPE',
                VhiTypeTable::class,
                Join::on('this.VHI_TYPE_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_VHI_STORAGE_ENTITY_VHI_TYPE_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
