<?

namespace MyWebstor\Hms\Integration\DocumentGenerator\DataProvider;

use Bitrix\Crm\Integration\DocumentGenerator\DataProvider\Contact;
use Bitrix\DocumentGenerator\DataProvider\ArrayDataProvider;
use Bitrix\DocumentGenerator\DataProvider\EntityDataProvider;
use Bitrix\DocumentGenerator\DataProvider\User;
use Bitrix\DocumentGenerator\DataProviderManager;
use Bitrix\DocumentGenerator\Nameable;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\AppointmentTable;

Loc::loadMessages(__FILE__);

class Appointment extends EntityDataProvider implements Nameable {
    protected function getTableClass() {
        return AppointmentTable::class;
    }

    public static function getLangName() {
        return Loc::getMessage("HMS_DOCGEN_DATAPROVIDER_APPOINTMENT_TITLE");
    }

    public function getFields() {
        if ($this->fields === null) {
            parent::getFields();
            // CLINIC
            $this->fields["CLINIC"] = array(
                "TITLE" => AppointmentTable::getMap("CLINIC")->getTitle(),
                "PROVIDER" => Clinic::class,
                "VALUE" => array($this, "getClinicId"),
            );
            // DOCTOR
            $this->fields["DOCTOR"] = array(
                "TITLE" => AppointmentTable::getMap("DOCTOR")->getTitle(),
                "PROVIDER" => Doctor::class,
                "VALUE" => array($this, "getDoctorId"),
            );
            // OFFICE
            $this->fields["OFFICE"] = array(
                "TITLE" => AppointmentTable::getMap("OFFICE")->getTitle(),
                "PROVIDER" => Office::class,
                "VALUE" => array($this, "getOfficeId"),
            );
            // SPECIALIZATION
            $this->fields["SPECIALIZATION"] = array(
                "TITLE" => AppointmentTable::getMap("SPECIALIZATION")->getTitle(),
                "PROVIDER" => Specialization::class,
                "VALUE" => array($this, "getSpecializationId"),
            );
            // STATUS
            $this->fields["STATUS"] = array(
                "TITLE" => AppointmentTable::getMap("STATUS")->getTitle(),
                "VALUE" => array($this, "getStatusName"),
            );
            // CONTACT
            $this->fields["CONTACT"] = array(
                "TITLE" => AppointmentTable::getMap("CONTACT")->getTitle(),
                "PROVIDER" => Contact::class,
                "VALUE" => array($this, "getContactId"),
                "OPTIONS" => array(
                    "DISABLE_MY_COMPANY" => true,
                    "isLightMode" => true,
                ),
            );
            // ASSIGNED_BY
            $this->fields["ASSIGNED_BY"] = array(
                "TITLE" => AppointmentTable::getMap("ASSIGNED_BY")->getTitle(),
                "PROVIDER" => User::class,
                "VALUE" => array($this, "getAssignedById"),
            );
        }

        return $this->fields;
    }

    protected function getClinicId() {
        return $this->data["CLINIC_ID"] ?: null;
    }

    protected function getDoctorId() {
        return $this->data["DOCTOR_ID"] ?: null;
    }

    protected function getOfficeId() {
        return $this->data["OFFICE_ID"] ?: null;
    }

    protected function getSpecializationId() {
        return $this->data["SPECIALIZATION_ID"] ?: null;
    }

    protected function getStatusName() {
        return $this->data["STATUS_NAME"] ?: null;
    }

    protected function getContactId() {
        return $this->data["CONTACT_ID"] ?: null;
    }

    protected function getAssignedById() {
        return $this->data["ASSIGNED_BY_ID"] ?: null;
    }

    protected function getGetListParameters() {
        $result = parent::getGetListParameters();

        $result["select"] = array(
            "*",
            "STATUS_NAME" => "STATUS.NAME",
            "CONTACT_ID",
        );

        return $result;
    }

    public function hasAccess($userId) {
        return true;
    }

    protected function getHiddenFields() {
        return array(
            "XML_ID",
            "RESERVE_XML_ID",
            "REAL_STATUS_ID",
            "SOURCE_TYPE",
            "SOURCE_ID",
            "CLINIC_ID",
            "DOCTOR_ID",
            "OFFICE_ID",
            "SPECIALIZATION_ID",
            "ASSIGNED_BY_ID",
            "STATUS_ID",
            "CLINIC",
            "DOCTOR",
            "OFFICE",
            "SPECIALIZATION",
            "STATUS",
            "CONTACT_ID",
            "CONTACT",
            "ASSIGNED_BY",
            "CONTACT_BINDINGS",
            "PRODUCT_ROWS",
            "RESERVE_DOCTOR",
            "RESERVE_OFFICE",
            "RESERVE_SPECIALIZATION",
            "RESERVE_DATE",
            "RECEIVE",
            "DEALS",
        );
    }
}
