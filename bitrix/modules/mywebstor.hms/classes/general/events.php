<?

use Bitrix\Crm\Service\Container;
use Bitrix\DocumentGenerator\Nameable;
use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Entity\EntityError;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\EventResult as ORMEventResult;
use MyWebstor\Hms\Integration\DocumentGenerator\DataProvider;

Loc::loadMessages(__FILE__);

class MyWebstorHmsEvents {
    const AGREEMENT_DYNAMIC_TYPE_CODE = "HMS_AGREEMENT";

    public static function PerfmonOnGetTableSchema() {
        return array(
            "main" => array(
                "b_user" => array(
                    "ID" => array(
                        "hms_doctor" => "ID",
                        "hms_schedule" => "ASSIGNED_BY_ID"
                    )
                )
            ),
            "crm" => array(
                "b_crm_company" => array(
                    "ID" => array(
                        "hms_clinic" => "COMPANY_ID"
                    )
                ),
                "b_crm_contact" => array(
                    "ID" => array(
                        "hms_appointment_contact" => "CONTACT_ID"
                    )
                )
            ),
            "mywebstor.hms" => array(
                "hms_clinic" => array(
                    "ID" => array(
                        "hms_office" => "CLINIC_ID",
                        "hms_schedule" => "CLINIC_ID",
                        "hms_appointment" => "CLINIC_ID"
                    )
                ),
                "hms_office" => array(
                    "ID" => array(
                        "hms_doctor" => "OFFICE_ID",
                        "hms_schedule_worktime" => "OFFICE_ID",
                        "hms_appointment" => "OFFICE_ID"
                    )
                ),
                "hms_doctor" => array(
                    "ID" => array(
                        "hms_schedule_worktime" => "DOCTOR_ID",
                        "hms_appointment" => "DOCTOR_ID"
                    )
                ),
                "hms_schedule" => array(
                    "ID" => array(
                        "hms_schedule_worktime" => "SCHEDULE_ID"
                    )
                ),
                "hms_appointment" => array(
                    "ID" => array(
                        "hms_appointment_contact" => "APPOINTMENT_ID"
                    )
                )
            )
        );
    }

    public static function addAnchors() {
        $exts = array(
            "mywebstor.hms.anchors"
        );
        $request = \Bitrix\Main\Application::getInstance()
            ->getContext()
            ->getRequest();

        if (
            !$request->isAdminSection()
            && $request->get("IFRAME") !== "Y"
        )
            \Bitrix\Main\Ui\Extension::load($exts);
    }

    public static function addEntityDetailsTabs(Event $event) {
        if (
            !Loader::includeModule("mywebstor.hms")
            || !\MyWebstorHmsHelper::checkModuleAccess()
        ) return;

        $inputParameters = $event->getParameters();
        $entityTypeID = $inputParameters["entityTypeID"];
        $entityID = $inputParameters["entityID"];
        $tabs = $inputParameters["tabs"];

        if ($entityID <= 0 || !$entityID) return;

        switch ($entityTypeID) {
            case \CCrmOwnerType::Lead:
            case \CCrmOwnerType::Deal:
                static::addLeadDealReceptionTab($entityTypeID, $entityID, $tabs);
                break;
            case \CCrmOwnerType::Contact:
                static::addContactVhiTab($entityTypeID, $entityID, $tabs);
                static::addContactAppointmentsTab($entityTypeID, $entityID, $tabs);
                break;
            default:
                return;
                break;
        }

        $tabsEvent = new Event(
            "mywebstor.hms",
            "onAddEntityDetailsTabs",
            array(
                "entityTypeID" => $entityTypeID,
                "entityID" => $entityID,
                "tabs" => &$tabs
            )
        );
        $tabsEvent->send();

        $result = new EventResult(
            EventResult::SUCCESS,
            array(
                "tabs" => $tabs
            )
        );
        $event->addResult($result);
        return;
    }

    protected static function addLeadDealReceptionTab($entityTypeID, $entityID, &$tabs) {
        $isLeadTabEnabled = Option::get("mywebstor.hms", "hms_lead_tab_enabled", "Y") == "Y";
        $isDealTabEnabled = Option::get("mywebstor.hms", "hms_deal_tab_enabled", "N") == "Y";

        if (
            ($entityTypeID == \CCrmOwnerType::Lead
                && !$isLeadTabEnabled)
            || ($entityTypeID == \CCrmOwnerType::Deal
                && !$isDealTabEnabled)
        ) return;

        $componentParams = array(
            "SOURCE_TYPE" => $entityTypeID,
            "SOURCE_ID" => $entityID
        );

        $tabs[] = array(
            "id" => "tab_hms_reception",
            "name" => Loc::getMessage("HMS_EVENTS_ENTITY_DETAILS_TAB_RECEPTION_NAME"),
            "loader" => array(
                "serviceUrl" => "/bitrix/components/mywebstor/hms.reception/lazyload.ajax.php?&site=" . SITE_ID . "&" . bitrix_sessid_get(),
                "componentData" => array(
                    "template" => "",
                    "signedParameters" => ParameterSigner::signParameters(
                        "mywebstor:hms.reception",
                        $componentParams
                    )
                )
            ),
        );
    }

    protected static function addContactVhiTab($entityTypeID, $entityID, &$tabs) {
        $componentParams = array(
            "CONTACT_ID" => $entityID
        );

        $tabs[] = array(
            "id" => "tab_hms_vhi_list",
            "name" => Loc::getMessage("HMS_EVENTS_ENTITY_DETAILS_TAB_VHI_LIST_NAME"),
            "loader" => array(
                "serviceUrl" => "/bitrix/components/mywebstor/hms.vhi.list/lazyload.ajax.php?&site=" . SITE_ID . "&" . bitrix_sessid_get(),
                "componentData" => array(
                    "template" => "",
                    "signedParameters" => ParameterSigner::signParameters(
                        "mywebstor:hms.vhi.list",
                        $componentParams
                    )
                )
            ),
        );
    }

    protected static function addContactAppointmentsTab($entityTypeID, $entityID, &$tabs) {
        $componentParams = array(
            "CONTACT_ID" => $entityID
        );

        $tabs[] = array(
            "id" => "tab_hms_appointment_list",
            "name" => Loc::getMessage("HMS_EVENTS_ENTITY_DETAILS_TAB_APPOINTMENT_LIST_NAME"),
            "loader" => array(
                "serviceUrl" => "/bitrix/components/mywebstor/hms.appointment.list/lazyload.ajax.php?&site=" . SITE_ID . "&" . bitrix_sessid_get(),
                "componentData" => array(
                    "template" => "",
                    "signedParameters" => ParameterSigner::signParameters(
                        "mywebstor:hms.appointment.list",
                        $componentParams
                    )
                )
            ),
        );
    }

    public static function addDynamicDeleteCheck($dynamicID) {
        $container = Container::getInstance();
        $dynamicTypeClass = $container->getDynamicTypeDataClass();

        $dynamicObject = $dynamicTypeClass::getById($dynamicID)->fetchObject();
        if (!$dynamicObject) return;

        if ($dynamicObject->getCode() === static::AGREEMENT_DYNAMIC_TYPE_CODE) {
            $result = new ORMEventResult();
            $result->addError(new EntityError(Loc::getMessage("HMS_EVENTS_ADD_DYNAMIC_DELETE_CHECK_ACCESS_DENIED")));

            return $result;
        }
    }

    public static function getDataProviders() {
        static $result;

        if ($result === null) {
            $providers = array(
                DataProvider\Appointment::class,
                DataProvider\Clinic::class,
                DataProvider\Doctor::class,
                DataProvider\Office::class,
                DataProvider\Specialization::class,
            );

            foreach ($providers as $provider) {
                /** @var Nameable $provider */
                $className = mb_strtolower($provider);
                $result[$className] = array(
                    "NAME" => $provider::getLangName(),
                    "CLASS" => $className,
                    "MODULE" => "mywebstor.hms"
                );
            }
        }

        return $result;
    }
}
