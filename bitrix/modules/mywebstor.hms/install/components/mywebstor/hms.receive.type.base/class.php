<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Crm\Format\TextHelper;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Error;
use Bitrix\Main\Errorable;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\Object\Receive;
use MyWebstor\Hms\OfficeTable;
use MyWebstor\Hms\Receive\BaseReceiveTable;

Loc::loadMessages(__FILE__);

class HmsReceiveTypeBaseComponent extends \CBitrixComponent implements Controllerable, Errorable {
    /** @var Receive|null */
    protected $receiveObject;

    /** @var ErrorCollection */
    protected $errorCollection;

    public function configureActions() {
        return array();
    }

    protected function listKeysSignedParameters() {
        return array(
            "ID",
        );
    }

    public function onPrepareComponentParams($arParams) {
        $this->errorCollection = new ErrorCollection();

        return $arParams;
    }

    public function getErrors() {
        return $this->errorCollection->toArray();
    }

    public function getErrorByCode($code) {
        return $this->errorCollection->getErrorByCode($code);
    }

    public function returnError($message) {
        $this->errorCollection->setError(
            new Error($message)
        );

        return false;
    }

    public function executeComponent() {
        try {
            $this->includeModules();

            $this->receiveObject = $this->arParams["RECEIVE"];
            $this->prepareResult();

            $this->includeComponentTemplate();
        } catch (\Exception $e) {
            ShowError($e->getMessage());
            return false;
        }
    }

    protected function includeModules() {
        $modules = array("mywebstor.hms");
        foreach ($modules as $module)
            if (!Loader::includeModule($module))
                throw new SystemException("Module \"$module\" not found");
    }

    protected function prepareResult() {
        if (!$this->receiveObject)
            ShowError("Receive not found");

        $this->arResult["ID"] = $this->receiveObject->getId();
        $this->arResult["ENTITY_TYPE_NAME"] = "BASE_RECEIVE";
        $this->arResult["GUID"] = "HMS_BASE_RECEIVE_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_CONFIG_OPTIONS"] = $this->prepareEntityConfigOptions();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
        $this->arResult["INITIAL_MODE"] = "edit";
    }

    protected function prepareEntityFields() {
        return array(
            "DIAGNOSIS" => array(
                "entity" => "base-receive",
                "name" => "DIAGNOSIS",
                "originalName" => "DIAGNOSIS",
                "title" => BaseReceiveTable::getMap("DIAGNOSIS")->getTitle(),
                "type" => "bb",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "REPORT" => array(
                "entity" => "base-receive",
                "name" => "REPORT",
                "originalName" => "REPORT",
                "title" => BaseReceiveTable::getMap("REPORT")->getTitle(),
                "type" => "bb",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "RECOMMENDATION" => array(
                "entity" => "base-receive",
                "name" => "RECOMMENDATION",
                "originalName" => "RECOMMENDATION",
                "title" => BaseReceiveTable::getMap("RECOMMENDATION")->getTitle(),
                "type" => "bb",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
        );
    }

    protected function prepareEntityConfig() {
        return array(
            array(
                "name" => "left",
                "type" => "column",
                "data" => array(
                    "width" => 100
                ),
                "elements" => array(
                    array(
                        "name" => "main",
                        "title" => Loc::getMessage("HMS_BASE_RECEIVE_ENTITY_SECTION_MAIN"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                            "enableToggling" => false
                        ),
                        "elements" => array(
                            array(
                                "name" => "DIAGNOSIS"
                            ),
                            array(
                                "name" => "REPORT"
                            ),
                            array(
                                "name" => "RECOMMENDATION"
                            ),
                        )
                    ),
                )
            )
        );
    }

    protected function prepareEntityConfigOptions() {
        return array(
            "enableQuickEdit" => "N"
        );
    }

    protected function prepareEntityData() {
        $receiveObject = $this->receiveObject;
        $result = array();
        $baseReceiveObject = $receiveObject->getTypedReceiveObject(false);
        if (!$baseReceiveObject) return $result;

        $baseReceive = $baseReceiveObject->collectValues(
            Values::ALL,
            FieldTypeMask::FLAT,
            true
        );

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $baseReceive[$entityKey];
            switch ($entityKey) {
                case "DIAGNOSIS":
                case "REPORT":
                case "RECOMMENDATION":
                    $result[$entityKey . "_HTML"] = TextHelper::convertBbCodeToHtml($result[$entityKey]);
                    break;
            }
        }

        $this->arResult["READ_ONLY"] = (bool)$receiveObject->getDateEnd();

        return $result;
    }

    protected function prepareAjaxData() {
        return array(
            "COMPONENT_NAME" => $this->getName(),
            "ACTION_NAME" => "save",
            "SIGNED_PARAMETERS" => $this->getSignedParameters(),
        );
    }
}
