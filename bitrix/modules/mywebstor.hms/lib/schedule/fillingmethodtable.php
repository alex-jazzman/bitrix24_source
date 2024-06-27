<?

namespace MyWebstor\Hms\Schedule;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\EnumField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\ArrayField;

Loc::loadMessages(__FILE__);

class FillingMethodTable extends DataManager {
    public const FILLING_METHOD_TYPE_ONE_WEEK = 'W1';
    public const FILLING_METHOD_TYPE_TWO_WEEKS = 'W2';
    public const FILLING_METHOD_TYPE_PERIODS = 'PR';

    public static function getTypes($type = null) {
        $types = array(
            static::FILLING_METHOD_TYPE_ONE_WEEK => Loc::getMessage("HMS_FILLING_METHOD_TYPE_W1"),
            static::FILLING_METHOD_TYPE_TWO_WEEKS => Loc::getMessage("HMS_FILLING_METHOD_TYPE_W2"),
            static::FILLING_METHOD_TYPE_PERIODS => Loc::getMessage("HMS_FILLING_METHOD_TYPE_PR"),
        );
        if (!$type) return $types;

        return $types[$type] ?: null;
    }

    public static function getTableName() {
        return 'hms_filling_method';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_FILLING_METHOD_ENTITY_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureSize(255)
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_FILLING_METHOD_ENTITY_TITLE_FIELD')),
            'TYPE' => (new EnumField('TYPE'))
                ->configureRequired()
                ->configureValues(array(
                    static::FILLING_METHOD_TYPE_ONE_WEEK,
                    static::FILLING_METHOD_TYPE_TWO_WEEKS,
                    static::FILLING_METHOD_TYPE_PERIODS
                ))
                ->configureDefaultValue(static::FILLING_METHOD_TYPE_PERIODS)
                ->configureTitle(Loc::getMessage('HMS_FILLING_METHOD_ENTITY_TYPE_FIELD')),
            'SEGMENTS' => (new ArrayField('SEGMENTS'))
                ->configureSerializationPhp()
                ->configureTitle(Loc::getMessage('HMS_FILLING_METHOD_ENTITY_SEGMENTS_FIELD'))
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
