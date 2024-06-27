<?

use Bitrix\Calendar\Internals\EventTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\Date;
use Bitrix\Main\Web\Uri;
use MyWebstor\Hms\ProductRowTable;
use MyWebstor\Hms\Receive\BaseReceiveTable;

Loc::loadMessages(__FILE__);

class MyWebstorHmsHelper {
    const HMS_RECEIVE_TYPE_BASE = "base";

    /**
     * @return array<string, array{code: string, name: string, componentName: string, dataManager: string, disableProductList: boolean}>|array{code: string, name: string, componentName: string, dataManager: string, disableProductList: boolean}
     */
    public static function getReceiveTypes($receiveType = null) {
        $receiveTypes = array(
            static::HMS_RECEIVE_TYPE_BASE => array(
                "code" => static::HMS_RECEIVE_TYPE_BASE,
                "name" => Loc::getMessage("HMS_HELPER_RECEIVE_TYPES_BASE"),
                "componentName" => "mywebstor:hms.receive.type.base",
                'dataManager' => BaseReceiveTable::class,
                "disableProductList" => false,
            ),
        );

        $event = new Event("mywebstor.hms", "onGetReceiveTypes");
        $event->send();
        foreach ($event->getResults() as $eventResult) {
            if ($eventResult->getType() !== EventResult::SUCCESS) continue;

            $parameters = $eventResult->getParameters();
            if (!is_array($parameters)) continue;

            $receiveTypes = array_merge($receiveTypes, $parameters);
        }

        if (!$receiveType) return $receiveTypes;

        return $receiveTypes[$receiveType] ?: null;
    }

    public static function getDateMonthYear($date = null) {
        try {
            if (!$date) return "";

            if (!($date instanceof Date))
                $date = new Date($date);

            return static::getLocaleMonths()[$date->format("n")] . " " . $date->format("Y");
        } catch (\Exception $e) {
            return "";
        }
    }

    protected static function getLocaleMonths() {
        return array(
            1 => Loc::getMessage("HMS_HELPER_MONTH_1"),
            2 => Loc::getMessage("HMS_HELPER_MONTH_2"),
            3 => Loc::getMessage("HMS_HELPER_MONTH_3"),
            4 => Loc::getMessage("HMS_HELPER_MONTH_4"),
            5 => Loc::getMessage("HMS_HELPER_MONTH_5"),
            6 => Loc::getMessage("HMS_HELPER_MONTH_6"),
            7 => Loc::getMessage("HMS_HELPER_MONTH_7"),
            8 => Loc::getMessage("HMS_HELPER_MONTH_8"),
            9 => Loc::getMessage("HMS_HELPER_MONTH_9"),
            10 => Loc::getMessage("HMS_HELPER_MONTH_10"),
            11 => Loc::getMessage("HMS_HELPER_MONTH_11"),
            12 => Loc::getMessage("HMS_HELPER_MONTH_12")
        );
    }

    public static function getStatusEntityTypes() {
        return array(
            "HMS_APPOINTMENT_STATUS" => array(
                "ID" => "HMS_APPOINTMENT_STATUS",
                "NAME" => Loc::getMessage("HMS_HELPER_APPOINTMENT_STATUS_TITLE"),
                "SEMANTIC_INFO" => array(
                    "START_FIELD" => "NEW",
                    "FINAL_SUCCESS_FIELD" => "SUCCESS",
                    "FINAL_UNSUCCESS_FIELD" => "FAILURE",
                    "FINAL_SORT" => 0
                ),
            ),
            "HMS_DIVISION" => array(
                "ID" => "HMS_DIVISION",
                "NAME" => Loc::getMessage("HMS_HELPER_DIVISION_TITLE"),
            )
        );
    }

    public static function getDefaultStatuses($entityID) {
        switch ($entityID) {
            case "HMS_APPOINTMENT_STATUS":
                return array(
                    array(
                        "STATUS_ID" => "RESERVE",
                        "NAME" => Loc::getMessage("HMS_HELPER_APPOINTMENT_STATUS_RESERVE"),
                        "SORT" => 10,
                        "SYSTEM" => "Y",
                        "COLOR" => "#392fc1",
                        "SEMANTICS" => PhaseSemantics::PROCESS
                    ),
                    array(
                        "STATUS_ID" => "NEW",
                        "NAME" => Loc::getMessage("HMS_HELPER_APPOINTMENT_STATUS_NEW"),
                        "SORT" => 20,
                        "SYSTEM" => "Y",
                        "COLOR" => "#39a8ef",
                        "SEMANTICS" => PhaseSemantics::PROCESS
                    ),
                    array(
                        "STATUS_ID" => "SUCCESS",
                        "NAME" => Loc::getMessage("HMS_HELPER_APPOINTMENT_STATUS_SUCCESS"),
                        "SORT" => 30,
                        "SYSTEM" => "Y",
                        "COLOR" => "#00ff00",
                        "SEMANTICS" => PhaseSemantics::SUCCESS
                    ),
                    array(
                        "STATUS_ID" => "FAILURE",
                        "NAME" => Loc::getMessage("HMS_HELPER_APPOINTMENT_STATUS_FAILURE"),
                        "SORT" => 40,
                        "SYSTEM" => "Y",
                        "COLOR" => "#ff0000",
                        "SEMANTICS" => PhaseSemantics::FAILURE
                    ),
                );
            case "HMS_DIVISION":
                return array();
            default:
                return array();
        }
    }

    public static function getTextColor($color) {
        $r = ord(pack("H*", mb_substr($color, 1, 2)));
        $g = ord(pack("H*", mb_substr($color, 3, 2)));
        $b = ord(pack("H*", mb_substr($color, 5, 2)));
        $y = 0.21 * $r + 0.72 * $g + 0.07 * $b;

        return $y < 145 ? '#ffffff' : '#545c69';
    }

    public static function getAbsencesWithoutTimezone($params = array()) {
        $absences = \CIntranetUtils::GetAbsenceData($params, BX_INTRANET_ABSENCE_ALL);
        foreach ($absences as $userID => $userAbsences) {
            foreach ($userAbsences as $userAbsenceKey => $userAbsence) {
                if ($userAbsence["ENTRY_TYPE"] != BX_INTRANET_ABSENCE_PERSONAL) continue;

                $event = EventTable::getById($userAbsence["ID"])->fetch();
                if (!$event) continue;

                $userAbsence["DATE_FROM"] = $event["DATE_FROM"]->format('d.m.Y H:i');
                $userAbsence["DATE_TO"] = $event["DATE_TO"]->format('d.m.Y H:i');

                $userAbsences[$userAbsenceKey] = $userAbsence;
            }

            $absences[$userID] = $userAbsences;
        }

        return $absences;
    }

    public static function fillProductRows($productRows = array()) {
        $productRowsID = array_map(function ($row) {
            return $row["ID"];
        }, $productRows);

        $hmsProductRowsQuery = ProductRowTable::query();
        $hmsProductRowsQuery
            ->whereIn("ID", $productRowsID)
            ->setSelect(array("*"));
        $hmsProductRowsCollection = $hmsProductRowsQuery->fetchCollection();

        foreach ($productRows as $productRowKey => $productRow) {
            $productRow["IS_VHI"] = ProductRowTable::getMap("IS_VHI")->getDefaultValue();
            $productRow["TEETH"] = ProductRowTable::getMap("TEETH")->getDefaultValue();

            $hmsProductRowObject = $hmsProductRowsCollection->getByPrimary($productRow["ID"]);
            if (isset($hmsProductRowObject)) {
                $productRow["IS_VHI"] = $hmsProductRowObject->getIsVhi();
                $productRow["TEETH"] = $hmsProductRowObject->getTeeth();
            }

            $productRows[$productRowKey] = $productRow;
        }

        return $productRows;
    }

    public static function checkModuleAccess() {
        /**
         * @var \CUser $USER
         */
        global $USER;

        try {
            if (
                Loader::includeModule("mywebstor.hms_integration")
                && \MyWebstorHMSIntegrationHelper::checkHeaderToken()
            ) return true;
        } catch (\Exception $e) {
        }

        $access = unserialize(Option::get("mywebstor.hms", "hms_rights", serialize(array())));
        if (!$access || !$USER->CanAccess($access)) return false;

        return true;
    }

    public static function getDocumentButtonParameters($className, $value) {
        $templateListPath = "/hms/documents/templates/";
        $templateListUrl = new Uri($templateListPath);
        if ($className) $templateListUrl->addParams(["entityTypeId" => $className]);

        $params = array(
            "provider" => $className,
            "moduleId" => "mywebstor.hms",
            "value" => $value,
            "sliderWidth" => 1060,
            "templateListUrl" => $templateListUrl->getLocator(),
            "className" => "hms-btn-dropdown-document",
            "menuClassName" => "document-toolbar-menu",
            "templatesText" => Loc::getMessage("HMS_HELPER_DOCGEN_ADD_NEW_TEMPLATE"),
            "documentsText" => Loc::getMessage("HMS_HELPER_DOCGEN_DOCUMENTS_LIST"),
        );
        $componentPath = \CComponentEngine::makeComponentPath("mywebstor:hms.document.view");
        if (!empty($componentPath)) {
            $documentUrl = new Uri(getLocalPath("components" . $componentPath . "/slider.php"));
            $documentUrl->addParams(["providerClassName" => $className,]);
            $params["documentUrl"] = $documentUrl->getUri();
        }

        return $params;
    }
}
