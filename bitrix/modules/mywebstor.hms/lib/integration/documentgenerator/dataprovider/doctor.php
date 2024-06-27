<?

namespace MyWebstor\Hms\Integration\DocumentGenerator\DataProvider;

use Bitrix\DocumentGenerator\DataProvider\ArrayDataProvider;
use Bitrix\DocumentGenerator\DataProvider\EntityDataProvider;
use Bitrix\DocumentGenerator\DataProvider\User;
use Bitrix\DocumentGenerator\DataProviderManager;
use Bitrix\DocumentGenerator\Nameable;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\DoctorTable;

Loc::loadMessages(__FILE__);

class Doctor extends EntityDataProvider implements Nameable {
    protected $specializations;

    protected function getTableClass() {
        return DoctorTable::class;
    }

    public static function getLangName() {
        return Loc::getMessage("HMS_DOCGEN_DATAPROVIDER_DOCTOR_TITLE");
    }

    public function getFields() {
        if ($this->fields === null) {
            parent::getFields();

            $this->fields["USER"] = array(
                "TITLE" => DoctorTable::getMap("USER")->getTitle(),
                "PROVIDER" => User::class,
                "VALUE" => array($this, "getSource"),
            );

            $this->fields["OFFICE"] = array(
                "TITLE" => DoctorTable::getMap("OFFICE")->getTitle(),
                "PROVIDER" => Office::class,
                "VALUE" => array($this, "getOfficeId"),
            );

            $this->fields["SPECIALIZATION"] = array(
                "TITLE" => DoctorTable::getMap("SPECIALIZATION")->getTitle(),
                "PROVIDER" => ArrayDataProvider::class,
                "OPTIONS" => array(
                    "ITEM_PROVIDER" => Specialization::class,
                    "ITEM_NAME" => "SPECIALIZATION",
                    "ITEM_TITLE" => DoctorTable::getMap("SPECIALIZATION")->getTitle(),
                ),
                "VALUE" => array($this, "getSpecializations"),
            );
        }
        return $this->fields;
    }

    public function hasAccess($userId) {
        return true;
    }

    protected function getHiddenFields() {
        return array(
            "XML_ID",
            "OFFICE_ID",
            "IS_CONTINUOUS_SCHEME",
            "USER_TITLE",
            "USER_INITIALS",
            "USER",
            "OFFICE",
            "SPECIALIZATION",
        );
    }

    protected function getOfficeId() {
        return $this->data["OFFICE_ID"] ?: null;
    }

    protected function getSpecializations() {
        if ($this->specializations !== null) return $this->specializations;

        $this->specializations = array();
        if (($doctorID = $this->source) <= 0) return $this->specializations;

        $doctorObject = DoctorTable::getById($doctorID)->fetchObject();
        if (!$doctorObject) return $this->specializations;

        $dataProviderManager = DataProviderManager::getInstance();
        foreach ($doctorObject->fillSpecialization() as $specializationObject) {
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
