<?

namespace MyWebstor\Hms\Receive;

use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\TextField;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\Object\Receive\BaseReceive;
use MyWebstor\Hms\ReceiveTable;

Loc::loadMessages(__FILE__);

class BaseReceiveTable extends DataManager {
    public static function getTableName() {
        return 'hms_receive_base';
    }

    public static function getObjectClass() {
        return BaseReceive::class;
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_BASE_RECEIVE_ENTITY_ID_FIELD')),
            'DIAGNOSIS' => (new TextField('DIAGNOSIS'))
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_BASE_RECEIVE_ENTITY_DIAGNOSIS_FIELD')),
            'REPORT' => (new TextField('REPORT'))
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_BASE_RECEIVE_ENTITY_REPORT_FIELD')),
            'RECOMMENDATION' => (new TextField('RECOMMENDATION'))
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_BASE_RECEIVE_ENTITY_RECOMMENDATION_FIELD')),

            'RECEIVE' => (new ReferenceField(
                'RECEIVE',
                ReceiveTable::class,
                Join::on('this.ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_RECEIVE_BASE_RECEIVE_ENTITY_RECEIVE_FIELD')),
        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }
}
