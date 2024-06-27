<?

namespace MyWebstor\Hms\Integration\DocumentGenerator\DataProvider;

use Bitrix\Crm\Integration\DocumentGenerator\DataProvider\Company;
use Bitrix\DocumentGenerator\DataProvider\EntityDataProvider;
use Bitrix\DocumentGenerator\Nameable;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\ClinicTable;

Loc::loadMessages(__FILE__);

class Clinic extends EntityDataProvider implements Nameable {
    protected function getTableClass() {
        return ClinicTable::class;
    }

    public static function getLangName() {
        return Loc::getMessage("HMS_DOCGEN_DATAPROVIDER_CLINIC_TITLE");
    }

    public function getFields() {
        if ($this->fields === null) {
            parent::getFields();

            $this->fields["COMPANY"] = array(
                "TITLE" => ClinicTable::getMap("COMPANY")->getTitle(),
                "PROVIDER" => Company::class,
                "VALUE" => array($this, "getCompanyId"),
                "OPTIONS" => array(
                    "DISABLE_MY_COMPANY" => true,
                    "isLightMode" => true,
                ),
            );
        }

        return $this->fields;
    }

    protected function getCompanyId() {
        return $this->data["COMPANY_ID"] ?: null;
    }

    public function hasAccess($userId) {
        return true;
    }

    protected function getHiddenFields() {
        return array(
            "XML_ID",
            "COMPANY_ID",
            "COMPANY",
        );
    }
}
