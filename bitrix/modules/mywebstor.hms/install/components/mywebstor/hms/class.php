<?

use Bitrix\Main;
use Bitrix\Main\Application;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\SystemException;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsComponent extends \CBitrixComponent {
    public function executeComponent() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        try {
            $this->includeModules();
            $this->checkAccess();
            $templatePage = $this->initTemplatePage();

            $APPLICATION->SetTitle(Loc::getMessage("HMS_" . strtoupper($templatePage) . "_TITLE"));

            $this->includeComponentTemplate($templatePage);
            return true;
        } catch (\Exception $e) {
            ShowError($e->getMessage());
            return false;
        }
    }

    protected function includeModules() {
        $modules = array("mywebstor.hms");
        foreach ($modules as $module)
            if (!Main\Loader::includeModule($module))
                throw new SystemException("Module \"$module\" not found");
    }

    protected function checkAccess() {
        if (!\MyWebstorHmsHelper::checkModuleAccess())
            throw new SystemException("Access denied");
    }

    protected function initTemplatePage() {
        $this->arParams["defaultUrlTemplates"] = array(
            "index" => "index.php",
            "reception" => "reception/",
            "config" => "config/",
            "status" => "config/status/",
            "clinic" => "config/clinic/",
            "clinic_list" => "config/clinic/list/",
            "clinic_details" => "config/clinic/details/#CLINIC_ID#/",
            "office" => "config/office/",
            "office_list" => "config/office/list/",
            "office_details" => "config/office/details/#OFFICE_ID#/",
            "doctor" => "config/doctor/",
            "doctor_list" => "config/doctor/list/",
            "doctor_details" => "config/doctor/details/#DOCTOR_ID#/",
            "schedule" => "config/schedule/",
            "schedule_list" => "config/schedule/list/",
            "schedule_details" => "config/schedule/details/#SCHEDULE_ID#/",
            "shift_work" => "config/shift_work/",
            "shift_work_list" => "config/shift_work/list/",
            "shift_work_details" => "config/shift_work/details/#SHIFT_WORK_ID#/",
            "filling_method" => "config/filling_method/",
            "filling_method_list" => "config/filling_method/list/",
            "filling_method_details" => "config/filling_method/details/#FILLING_METHOD_ID#/",
            "appointment" => "reception/appointment/",
            "appointment_list" => "reception/appointment/list/",
            "appointment_details" => "reception/appointment/details/#APPOINTMENT_ID#/",
            "specialization" => "config/specialization/",
            "specialization_list" => "config/specialization/list/",
            "specialization_details" => "config/specialization/details/#SPECIALIZATION_ID#/",
            "vhi_type" => "config/vhi/type/",
            "vhi_type_list" => "config/vhi/type/list/",
            "vhi_type_details" => "config/vhi/type/details/#VHI_TYPE_ID#/",
            "vhi_service_type" => "config/vhi/service_type/",
            "vhi_service_type_list" => "config/vhi/service_type/list/",
            "vhi_service_type_details" => "config/vhi/service_type/details/#VHI_SERVICE_TYPE_ID#/",
            "vhi_details" => "config/vhi/details/#VHI_ID#/",
            "docgen_templates" => "documents/templates/"
        );
        $this->arParams["templatesReferences"] = array(
            "index" => "reception",
            "status" => "config",
            "clinic" => "config",
            "clinic_list" => "config",
            "office" => "config",
            "office_list" => "config",
            "doctor" => "config",
            "doctor_list" => "config",
            "schedule" => "config",
            "schedule_list" => "config",
            "shift_work" => "config",
            "shift_work_list" => "config",
            "filling_method" => "config",
            "filling_method_list" => "config",
            "appointment" => "appointment_list",
            "specialization" => "config",
            "specialization_list" => "config",
            "vhi_type" => "config",
            "vhi_type_list" => "config",
            "vhi_service_type" => "config",
            "vhi_service_type_list" => "config",
        );
        if (!$this->isIFrame())
            $this->arParams["templatesReferences"] = array_merge($this->arParams["templatesReferences"], array(
                "clinic_details" => "config",
                "office_details" => "config",
                "doctor_details" => "config",
                "schedule_details" => "config",
                "shift_work_details" => "config",
                "filling_method_details" => "config",
                "specialization_details" => "config",
                "vhi_type_details" => "config",
                "vhi_service_type_details" => "config",
                "appointment_details" => "reception"
            ));
        $this->arParams["variables"] = array();

        $event = new Event("mywebstor.hms", "onHmsInitTemplatePage", array(
            "COMPONENT" => $this,
        ));
        $event->send();
        foreach ($event->getResults() as $eventResult) {
            if ($eventResult->getType() !== EventResult::SUCCESS) continue;

            $parameters = $eventResult->getParameters();

            $this->arResult["COMPONENT_NAME"] = $parameters["COMPONENT_NAME"];
            $this->arResult["COMPONENT_TEMPLATE"] = $parameters["COMPONENT_TEMPLATE"];
            $this->arResult["COMPONENT_PARAMS"] = $parameters["COMPONENT_PARAMS"];
            $this->arResult["IS_MENU_SHOW"] = (bool)$parameters["IS_MENU_SHOW"];

            $this->arResult["TEMPLATE_PAGE"] = "external";

            return "external";
        }

        $templatePage = \CComponentEngine::ParseComponentPath(
            "/hms/",
            $this->arParams["defaultUrlTemplates"],
            $this->arParams["variables"]
        );
        if ($templatePage === "index")
            $templatePage = $this->getUserFirstPage();

        foreach ($this->arParams["variables"] as $key => $value)
            $this->arResult[$key] = $value;

        $this->arResult["TEMPLATE_PAGE"] = $templatePage;

        return $this->arParams["templatesReferences"][$templatePage] ?: $templatePage;
    }

    protected function getUserFirstPage() {
        $userMenuOptions = \CUserOptions::GetOption("ui", "hms_menu");
        if (
            !$userMenuOptions
            || !($firstPageLink = $userMenuOptions["firstPageLink"])
        ) return "index";

        $templatePage = CComponentEngine::ParseComponentPath(
            "/hms/",
            $this->arParams["defaultUrlTemplates"],
            $this->arParams["variables"],
            $firstPageLink . "index.php"
        );

        return $templatePage;
    }

    protected function isIFrame() {
        $request = Application::getInstance()->getContext()->getRequest()->getQueryList()->toArray();

        return array_key_exists("IFRAME", $request) && $request["IFRAME"] == "Y";
    }
}
