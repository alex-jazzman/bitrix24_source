<?

namespace MyWebstor\Hms\Integration\DocumentGenerator\DataProvider;

use Bitrix\DocumentGenerator\DataProvider\ArrayDataProvider;
use Bitrix\DocumentGenerator\DataProvider\EntityDataProvider;
use Bitrix\DocumentGenerator\DataProviderManager;
use Bitrix\DocumentGenerator\Nameable;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\AppointmentTable;
use MyWebstor\Hms\OfficeTable;

Loc::loadMessages(__FILE__);

class Office extends EntityDataProvider implements Nameable {
    protected $specializations;

    protected function getTableClass() {
        return OfficeTable::class;
    }

    public static function getLangName() {
        return Loc::getMessage("HMS_DOCGEN_DATAPROVIDER_OFFICE_TITLE");
    }

    public function getFields() {
        if ($this->fields === null) {
            parent::getFields();

            $this->fields["CLINIC"] = array(
                "TITLE" => OfficeTable::getMap("CLINIC")->getTitle(),
                "PROVIDER" => Clinic::class,
                "VALUE" => array($this, "getClinicId"),
            );

            $this->fields["SPECIALIZATION"] = array(
                "TITLE" => OfficeTable::getMap("SPECIALIZATION")->getTitle(),
                "PROVIDER" => ArrayDataProvider::class,
                "OPTIONS" => array(
                    "ITEM_PROVIDER" => Specialization::class,
                    "ITEM_NAME" => "SPECIALIZATION",
                    "ITEM_TITLE" => AppointmentTable::getMap("SPECIALIZATION")->getTitle(),
                ),
                "VALUE" => array($this, "getSpecializations"),
            );
        }

        return $this->fields;
    }

    protected function getClinicId() {
        return $this->data["CLINIC_ID"] ?: null;
    }

    public function hasAccess($userId) {
        return true;
    }

    protected function getHiddenFields() {
        return array(
            "XML_ID",
            "CLINIC_ID",
            "IS_CONTINUOUS_SCHEME",
            "CLINIC",
            "SPECIALIZATION",
        );
    }

    protected function getSpecializations() {
        if ($this->specializations !== null) return $this->specializations;

        $this->specializations = array();
        if (($officeID = $this->source) <= 0) return $this->specializations;

        $officeObject = OfficeTable::getById($officeID)->fetchObject();
        if (!$officeObject) return $this->specializations;

        $dataProviderManager = DataProviderManager::getInstance();
        foreach ($officeObject->fillSpecialization() as $specializationObject) {
            $this->specializations[] = $dataProviderManager->getDataProvider(
                Specialization::class,
                $specializationObject->getId(),
                array(),
                $this
            );
        }

        return $this->specializations;
    }
}
