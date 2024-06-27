<?

namespace MyWebstor\HMS\Schedule;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Entity\TextField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\ArrayField;

Loc::loadMessages(__FILE__);

class ShiftWorkTable extends DataManager {
    public static function getTableName() {
        return 'hms_shift_work';
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureTitle(Loc::getMessage('HMS_SHIFT_WORK_ENTITY_ID_FIELD')),
            'TITLE' => (new StringField('TITLE'))
                ->configureSize(255)
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_SHIFT_WORK_ENTITY_TITLE_FIELD')),
            'WORKTIMES' => (new ArrayField('WORKTIMES'))
                ->configureSerializationPhp()
                ->configureTitle(Loc::getMessage('HMS_SHIFT_WORK_ENTITY_WORKTIMES_FIELD'))
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
