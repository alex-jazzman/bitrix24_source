<?

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsMenuComponent extends \CBitrixComponent {
    public function executeComponent() {
        try {
            $this->prepareResult();

            $this->includeComponentTemplate();
            return true;
        } catch (\Exception $e) {
            ShowError($e->getMessage());
            return false;
        }
    }

    protected function prepareResult() {
        $pageID = $this->arParams["ID"];

        $items = array(
            array(
                "ID" => "reception",
                "MENU_ID" => array("reception"),
                "NAME" => Loc::getMessage("HMS_MENU_RECEPTION_NAME"),
                "TEXT" => Loc::getMessage("HMS_MENU_RECEPTION_TEXT"),
                "TITLE" => Loc::getMessage("HMS_MENU_RECEPTION_TITLE"),
                "URL" => "/hms/reception/",
                "COUNTER" => false,
                "IS_DISABLED" => false,
                "IS_ACTIVE" => false,
            ),
            array(
                "ID" => "appointment_list",
                "MENU_ID" => array("appointment", "appointment_list"),
                "NAME" => Loc::getMessage("HMS_MENU_APPOINTMENT_LIST_NAME"),
                "TEXT" => Loc::getMessage("HMS_MENU_APPOINTMENT_LIST_TEXT"),
                "TITLE" => Loc::getMessage("HMS_MENU_APPOINTMENT_LIST_TITLE"),
                "URL" => "/hms/reception/appointment/",
                "COUNTER" => false,
                "IS_DISABLED" => false,
                "IS_ACTIVE" => false,
            ),
            array(
                "ID" => "config",
                "MENU_ID" => array("config"),
                "NAME" => Loc::getMessage("HMS_MENU_CONFIG_NAME"),
                "TEXT" => Loc::getMessage("HMS_MENU_CONFIG_TEXT"),
                "TITLE" => Loc::getMessage("HMS_MENU_CONFIG_TITLE"),
                "COUNTER" => false,
                "IS_DISABLED" => false,
                "IS_ACTIVE" => false,
                "ITEMS" => array(
                    array(
                        "ID" => "vhi_group",
                        "MENU_ID" => array("vhi_group"),
                        "NAME" => Loc::getMessage("HMS_MENU_VHI_GROUP_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_VHI_GROUP_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_VHI_GROUP_TITLE"),
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false,
                        "ITEMS" => array(
                            array(
                                "ID" => "vhi_type_list",
                                "MENU_ID" => array("vhi_type", "vhi_type_list", "vhi_type_details"),
                                "NAME" => Loc::getMessage("HMS_MENU_VHI_TYPE_LIST_NAME"),
                                "TEXT" => Loc::getMessage("HMS_MENU_VHI_TYPE_LIST_TEXT"),
                                "TITLE" => Loc::getMessage("HMS_MENU_VHI_TYPE_LIST_TITLE"),
                                "URL" => "/hms/config/vhi/type/",
                                "COUNTER" => false,
                                "IS_DISABLED" => false,
                                "IS_ACTIVE" => false,
                            ),
                            array(
                                "ID" => "vhi_service_type_list",
                                "MENU_ID" => array("vhi_service_type", "vhi_service_type_list", "vhi_service_type_details"),
                                "NAME" => Loc::getMessage("HMS_MENU_VHI_SERVICE_TYPE_LIST_NAME"),
                                "TEXT" => Loc::getMessage("HMS_MENU_VHI_SERVICE_TYPE_LIST_TEXT"),
                                "TITLE" => Loc::getMessage("HMS_MENU_VHI_SERVICE_TYPE_LIST_TITLE"),
                                "URL" => "/hms/config/vhi/service_type/",
                                "COUNTER" => false,
                                "IS_DISABLED" => false,
                                "IS_ACTIVE" => false,
                            ),
                        )
                    ),
                    array(
                        "ID" => "schedule_group",
                        "MENU_ID" => array("schedule_group"),
                        "NAME" => Loc::getMessage("HMS_MENU_SCHEDULE_GROUP_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_SCHEDULE_GROUP_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_SCHEDULE_GROUP_TITLE"),
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false,
                        "ITEMS" => array(
                            array(
                                "ID" => "schedule_list",
                                "MENU_ID" => array("schedule", "schedule_list", "schedule_details"),
                                "NAME" => Loc::getMessage("HMS_MENU_SCHEDULE_LIST_NAME"),
                                "TEXT" => Loc::getMessage("HMS_MENU_SCHEDULE_LIST_TEXT"),
                                "TITLE" => Loc::getMessage("HMS_MENU_SCHEDULE_LIST_TITLE"),
                                "URL" => "/hms/config/schedule/",
                                "COUNTER" => false,
                                "IS_DISABLED" => false,
                                "IS_ACTIVE" => false,
                            ),
                            array(
                                "ID" => "shift_work_list",
                                "MENU_ID" => array("shift_work", "shift_work_list", "shift_work_details"),
                                "NAME" => Loc::getMessage("HMS_MENU_SHIFT_WORK_LIST_NAME"),
                                "TEXT" => Loc::getMessage("HMS_MENU_SHIFT_WORK_LIST_TEXT"),
                                "TITLE" => Loc::getMessage("HMS_MENU_SHIFT_WORK_LIST_TITLE"),
                                "URL" => "/hms/config/shift_work/",
                                "COUNTER" => false,
                                "IS_DISABLED" => false,
                                "IS_ACTIVE" => false
                            ),
                            array(
                                "ID" => "filling_method_list",
                                "MENU_ID" => array("filling_method", "filling_method_list", "filling_method_details"),
                                "NAME" => Loc::getMessage("HMS_MENU_FILLING_METHOD_LIST_NAME"),
                                "TEXT" => Loc::getMessage("HMS_MENU_FILLING_METHOD_LIST_TEXT"),
                                "TITLE" => Loc::getMessage("HMS_MENU_FILLING_METHOD_LIST_TITLE"),
                                "URL" => "/hms/config/filling_method/",
                                "COUNTER" => false,
                                "IS_DISABLED" => false,
                                "IS_ACTIVE" => false
                            ),
                        )
                    ),
                    array(
                        "ID" => "doctor_list",
                        "MENU_ID" => array("doctor", "doctor_list"),
                        "NAME" => Loc::getMessage("HMS_MENU_DOCTOR_LIST_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_DOCTOR_LIST_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_DOCTOR_LIST_TITLE"),
                        "URL" => "/hms/config/doctor/",
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false
                    ),
                    array(
                        "ID" => "office_list",
                        "MENU_ID" => array("office", "office_list"),
                        "NAME" => Loc::getMessage("HMS_MENU_OFFICE_LIST_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_OFFICE_LIST_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_OFFICE_LIST_TITLE"),
                        "URL" => "/hms/config/office/",
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false
                    ),

                    array(
                        "ID" => "clinic_list",
                        "MENU_ID" => array("clinic", "clinic_list"),
                        "NAME" => Loc::getMessage("HMS_MENU_CLINIC_LIST_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_CLINIC_LIST_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_CLINIC_LIST_TITLE"),
                        "URL" => "/hms/config/clinic/",
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false
                    ),
                    array(
                        "ID" => "specialization_list",
                        "MENU_ID" => array("specialization", "specialization_list"),
                        "NAME" => Loc::getMessage("HMS_MENU_SPECIALIZATION_LIST_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_SPECIALIZATION_LIST_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_SPECIALIZATION_LIST_TITLE"),
                        "URL" => "/hms/config/specialization/",
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false
                    ),
                    array(
                        "ID" => "status",
                        "MENU_ID" => array("status"),
                        "NAME" => Loc::getMessage("HMS_MENU_STATUS_NAME"),
                        "TEXT" => Loc::getMessage("HMS_MENU_STATUS_TEXT"),
                        "TITLE" => Loc::getMessage("HMS_MENU_STATUS_TITLE"),
                        "URL" => "/hms/config/status/",
                        "COUNTER" => false,
                        "IS_DISABLED" => false,
                        "IS_ACTIVE" => false
                    ),
                ),
            ),
        );

        foreach ($items as $item) {
            if (in_array($pageID, $item["MENU_ID"])) $item["IS_ACTIVE"] = true;
            if (
                isset($item["ITEMS"])
                && is_array($item["ITEMS"])
            )
                foreach ($item["ITEMS"] as $sub1ItemKey => $sub1Item) {
                    if (in_array($pageID, $sub1Item["MENU_ID"])) {
                        $sub1Item["IS_ACTIVE"] = true;
                        $item["IS_ACTIVE"] = true;
                    }

                    if (
                        isset($sub1Item["ITEMS"])
                        && is_array($sub1Item["ITEMS"])
                    ) {
                        foreach ($sub1Item["ITEMS"] as $sub2ItemKey => $sub2Item) {
                            if (in_array($pageID, $sub2Item["MENU_ID"]))
                                $sub2Item["IS_ACTIVE"] =
                                    $sub1Item["IS_ACTIVE"] =
                                    $item["IS_ACTIVE"] = true;

                            $sub1Item["ITEMS"][$sub2ItemKey] = $sub2Item;
                        }
                    }

                    $item["ITEMS"][$sub1ItemKey] = $sub1Item;
                }

            $this->arResult["ITEMS"][] = $item;
        }
    }
}
