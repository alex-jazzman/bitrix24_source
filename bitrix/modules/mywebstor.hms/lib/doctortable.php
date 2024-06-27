<?

namespace MyWebstor\Hms;

use Bitrix\Main\Entity\BooleanField;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\EnumField;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\Relations\ManyToMany;
use Bitrix\Main\UserTable;
use MyWebstor\Hms\Binding\DoctorSpecializationTable;

Loc::loadMessages(__FILE__);

class DoctorTable extends DataManager {
    public static function getTableName() {
        return 'hms_doctor';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_XML_ID_FIELD')),
            'OFFICE_ID' => (new IntegerField('OFFICE_ID'))
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_OFFICE_ID_FIELD')),
            'IS_CONTINUOUS_SCHEME' => (new BooleanField('IS_CONTINUOUS_SCHEME'))
                ->configureValues('N', 'Y')
                ->configureDefaultValue(false)
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_IS_CONTINUOUS_SCHEME_FIELD')),

            'USER_TITLE' => (new ExpressionField(
                'USER_TITLE',
                'CONCAT_WS(" ", IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL))',
                array(
                    'USER.LAST_NAME',
                    'USER.LAST_NAME',
                    'USER.NAME',
                    'USER.NAME',
                    'USER.SECOND_NAME',
                    'USER.SECOND_NAME',
                )
            ))
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_USER_TITLE_FIELD')),
            'USER_INITIALS' => (new ExpressionField(
                'USER_INITIALS',
                'CONCAT_WS(" ", IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), CONCAT(UPPER(LEFT(%s, 1)), "."), NULL), IF(LENGTH(%s), CONCAT(UPPER(LEFT(%s, 1)), "."), NULL))',
                array(
                    'USER.LAST_NAME',
                    'USER.LAST_NAME',
                    'USER.NAME',
                    'USER.NAME',
                    'USER.SECOND_NAME',
                    'USER.SECOND_NAME',
                )
            ))
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_USER_TITLE_FIELD')),
            'USER' => (new ReferenceField(
                'USER',
                UserTable::class,
                Join::on("this.ID", "ref.ID")
            ))
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_USER_FIELD')),
            'OFFICE' => (new ReferenceField(
                'OFFICE',
                OfficeTable::class,
                Join::on('this.OFFICE_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_OFFICE_FIELD')),
            'SPECIALIZATION' => (new ManyToMany(
                'SPECIALIZATION',
                SpecializationTable::class
            ))
                ->configureTableName(DoctorSpecializationTable::getTableName())
                ->configureLocalPrimary('ID', 'DOCTOR_ID')
                ->configureLocalReference('DOCTOR')
                ->configureRemotePrimary('ID', 'SPECIALIZATION_ID')
                ->configureRemoteReference('SPECIALIZATION')
                ->configureJoinType(Join::TYPE_LEFT)
                ->configureTitle(Loc::getMessage('HMS_DOCTOR_ENTITY_SPECIALIZATION_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
