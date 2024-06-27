<?

use Bitrix\Main;
use Bitrix\Main\Errorable;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\SystemException;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsConfigComponent extends \CBitrixComponent {
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
            $templatePage = $this->initTemplatePage();

            $APPLICATION->SetTitle(Loc::getMessage("HMS_" . strtoupper($templatePage) . "_TITLE"));

            $this->includeComponentTemplate($templatePage);
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

    protected function initTemplatePage() {
        $this->arParams["defaultUrlTemplates"] = array(
            "template" => "index.php",
            "index" => "config/",
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
            "specialization" => "config/specialization/",
            "specialization_list" => "config/specialization/list/",
            "specialization_details" => "config/specialization/details/#SPECIALIZATION_ID#/",
            "vhi_type" => "config/vhi/type/",
            "vhi_type_list" => "config/vhi/type/list/",
            "vhi_type_details" => "config/vhi/type/details/#VHI_TYPE_ID#/",
            "vhi_service_type" => "config/vhi/service_type/",
            "vhi_service_type_list" => "config/vhi/service_type/list/",
            "vhi_service_type_details" => "config/vhi/service_type/details/#VHI_SERVICE_TYPE_ID#/",
        );
        $this->arParams["variables"] = array();
        $templatesReferences = array(
            "index" => "reception",
            "doctor" => "doctor_list",
            "clinic" => "clinic_list",
            "clinic_details" => "clinic_list",
            "office" => "office_list",
            "office_details" => "office_list",
            "doctor" => "doctor_list",
            "doctor_details" => "doctor_list",
            "schedule" => "schedule_list",
            "schedule_details" => "schedule_list",
            "shift_work" => "shift_work_list",
            "shift_work_details" => "shift_work_list",
            "filling_method" => "filling_method_list",
            "filling_method_details" => "filling_method_list",
            "specialization" => "specialization_list",
            "specialization_details" => "specialization_list",
            "vhi_type" => "vhi_type_list",
            "vhi_type_details" => "vhi_type_list",
            "vhi_service_type" => "vhi_service_type_list",
            "vhi_service_type_details" => "vhi_service_type_list",
        );

        $templatePage = CComponentEngine::ParseComponentPath(
            "/hms/",
            $this->arParams["defaultUrlTemplates"],
            $this->arParams["variables"]
        );
        if (in_array($templatePage, array("index", "template")))
            $templatePage = $this->getUserFirstPage();

        foreach ($this->arParams["variables"] as $key => $value)
            $this->arResult[$key] = $value;

        $this->arResult["TEMPLATE_PAGE"] = $templatePage;

        return $templatesReferences[$templatePage] ?: $templatePage;
    }

    protected function getUserFirstPage() {
        $userMenuOptions = \CUserOptions::GetOption("ui", "hms_menu");
        if (
            !$userMenuOptions
            || !($firstPageLink = $userMenuOptions["firstPageLink"])
        ) return "clinic_list";

        $templatePage = CComponentEngine::ParseComponentPath(
            "/hms/",
            $this->arParams["defaultUrlTemplates"],
            $this->arParams["variables"],
            $firstPageLink . "index.php"
        );

        return $templatePage ?: "clinic_list";
    }
}
