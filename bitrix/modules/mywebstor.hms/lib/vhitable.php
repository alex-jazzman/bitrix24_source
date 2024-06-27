<?

namespace MyWebstor\Hms;

use Bitrix\Crm\ContactTable;
use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DateField;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\Vhi\VhiStorageTable;
use MyWebstor\Hms\Vhi\VhiTypeTable;

Loc::loadMessages(__FILE__);

class VhiTable extends DataManager {
    public static function getTableName() {
        return 'hms_vhi';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_XML_ID_FIELD')),
            'CONTACT_ID' => (new IntegerField('CONTACT_ID'))
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_CONTACT_ID_FIELD')),
            'VHI_STORAGE_ID' => (new IntegerField('VHI_STORAGE_ID'))
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_VHI_STORAGE_ID_FIELD')),
            'VHI_TYPE_ID' => (new IntegerField('VHI_TYPE_ID'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_VHI_TYPE_ID_FIELD')),
            'ACTIVE' => (new BooleanField('ACTIVE'))
                ->configureRequired()
                ->configureValues('N', 'Y')
                ->configureDefaultValue(true)
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_ACTIVE_FIELD')),
            'NUMBER' => (new StringField('NUMBER'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_NUMBER_FIELD')),
            'DATE_START' => (new DateField('DATE_START'))
                ->configureDefaultValue(null)
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_DATE_START_FIELD')),
            'DATE_END' => (new DateField('DATE_END'))
                ->configureDefaultValue(null)
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_DATE_END_FIELD')),

            'IS_ACTIVE' => (new ExpressionField(
                'IS_ACTIVE',
                '(CASE
                    WHEN %s = \'N\'
                    OR (
                        %s IS NOT NULL
                        AND %s > CURRENT_DATE()
                    )
                    OR (
                        %s IS NOT NULL
                        AND %s < CURRENT_DATE()
                    ) THEN \'N\'
                    ELSE \'Y\'
                END)',
                array(
                    'ACTIVE',
                    'DATE_START',
                    'DATE_START',
                    'DATE_END',
                    'DATE_END',
                )
            ))
                ->configureValueField(
                    (new BooleanField('IS_ACTIVE'))
                        ->configureValues('N', 'Y')
                )
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_IS_ACTIVE_FIELD')),
            'VHI_STORAGE' => (new ReferenceField(
                'VHI_STORAGE',
                VhiStorageTable::class,
                Join::on('this.VHI_STORAGE', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_VHI_STORAGE_FIELD')),
            'VHI_TYPE' => (new ReferenceField(
                'VHI_TYPE',
                VhiTypeTable::class,
                Join::on('this.VHI_TYPE_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_VHI_TYPE_FIELD')),
            'CONTACT' => (new ReferenceField(
                'CONTACT',
                ContactTable::class,
                Join::on('this.CONTACT_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_VHI_ENTITY_CONTACT_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
