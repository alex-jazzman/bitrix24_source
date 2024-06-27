<?

namespace MyWebstor\Hms\Integration\DocumentGenerator\DataProvider;

use Bitrix\DocumentGenerator\DataProvider\EntityDataProvider;
use Bitrix\DocumentGenerator\DataProvider\User;
use Bitrix\DocumentGenerator\Nameable;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\SpecializationTable;

Loc::loadMessages(__FILE__);

class Specialization extends EntityDataProvider implements Nameable {
    protected function getTableClass() {
        return SpecializationTable::class;
    }

    public static function getLangName() {
        return Loc::getMessage("HMS_DOCGEN_DATAPROVIDER_SPECIALIZATION_TITLE");
    }

    public function getFields() {
        if ($this->fields === null) {
            parent::getFields();
        }
        return $this->fields;
    }

    public function hasAccess($userId) {
        return true;
    }

    protected function getHiddenFields() {
        return array(
            "XML_ID",
            "RECEIVE_TYPE",
            "SERVICES",
        );
    }
}
