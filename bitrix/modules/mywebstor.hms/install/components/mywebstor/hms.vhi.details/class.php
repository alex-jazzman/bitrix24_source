<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Crm\ContactTable;
use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Error;
use Bitrix\Main\Errorable;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use Bitrix\Main\Web\Json;
use MyWebstor\Hms\Vhi\VhiStorageTable;
use MyWebstor\Hms\VhiTable;

Loc::loadMessages(__FILE__);

class HmsVhiDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
    /** @var ErrorCollection */
    protected $errorCollection;
    protected $contactID;

    protected function listKeysSignedParameters() {
        return array(
            "ID"
        );
    }

    public function configureActions() {
        return array();
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

    public function saveAction($data, $signedParameters) {
        $this->includeModules();
        $data = array_filter($data ?: array(), function ($key) {
            return !empty($key);
        }, ARRAY_FILTER_USE_KEY);
        $signedParameters = ParameterSigner::unsignParameters($this->getName(), $signedParameters);
        $vhiID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if (!$vhiID || $vhiID <= 0) {
            $vhiObject = VhiTable::createObject();
            $vhiObject->setId(0);
        } else {
            $vhiObject = VhiTable::getById($vhiID)->fetchObject();
            if (!$vhiObject)
                return $this->returnError("Vhi not found");
        }

        foreach ($vhiObject->entity->getScalarFields() as $scalarField) {
            if ($scalarField->isAutocomplete() || !array_key_exists($scalarField->getColumnName(), $data)) continue;

            switch ($scalarField->getColumnName()) {
                default:
                    $vhiObject->set($scalarField->getColumnName(), $data[$scalarField->getColumnName()]);
                    break;
            }
        }

        $number = $vhiObject->getNumber();
        $vhiObject->unsetNumber();
        $vhiObject->setNumber($number);

        $saveResult = $vhiObject->save();
        if (!$saveResult->isSuccess()) {
            return $this->returnError(join(", <br>", $saveResult->getErrorMessages()));
        } else {
            if (!$vhiID || $vhiID <= 0)
                $result["ENTITY_ID"] = $vhiID = $saveResult->getPrimary()["ID"];

            $result["REDIRECT_URL"] = "/hms/config/vhi/details/$vhiID/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";
        }

        $this->arParams["ID"] = $vhiID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function toggleActiveAction($vhiID) {
        $this->includeModules();

        if (!$vhiID)
            return $this->returnError("VHI_ID not found");

        $vhiObject = VhiTable::getById($vhiID)->fetchObject();
        if (!$vhiObject)
            return $this->returnError("VHI not found");

        $vhiObject->setActive(!$vhiObject->getActive());
        $saveResult = $vhiObject->save();
        if (!$saveResult->isSuccess())
            return $this->returnError(join(", ", $saveResult->getErrorMessages()));

        return true;
    }

    public function deleteAction($vhiID) {
        $this->includeModules();

        if (!$vhiID)
            return $this->returnError("VHI_ID not found");

        $vhiObject = VhiTable::getById($vhiID)->fetchObject();
        if (!$vhiObject)
            return $this->returnError("VHI not found");

        $deleteResult = $vhiObject->delete();
        if (!$deleteResult->isSuccess())
            return $this->returnError(join(", ", $deleteResult->getErrorMessages()));

        return true;
    }

    public function addFromStorageAction($vhiStorageID, $contactID) {
        $this->includeModules();

        if (!$vhiStorageID)
            return $this->returnError("VHI_STORAGE_ID not found");
        if (!$contactID)
            return $this->returnError("CONTACT_ID not found");

        $vhiStorageObject = VhiStorageTable::getById($vhiStorageID)->fetchObject();
        if (!$vhiStorageObject)
            return $this->returnError("VHI_STORAGE not found");
        $contactObject = ContactTable::getById($contactID)->fetchObject();
        if (!$contactObject)
            return $this->returnError("CONTACT not found");

        $vhiObject = VhiTable::createObject(array(
            "CONTACT_ID" => $contactObject->getId(),
            "VHI_TYPE_ID" => $vhiStorageObject->getVhiTypeId(),
            "NUMBER" => $vhiStorageObject->getNumber(),
            "DATE_START" => $vhiStorageObject->getDateStart(),
            "DATE_END" => $vhiStorageObject->getDateEnd(),
        ));

        $saveResult = $vhiObject->save();
        if (!$saveResult->isSuccess())
            return $this->returnError(join(", ", $saveResult->getErrorMessages()));

        return true;
    }

    public function executeComponent() {
        try {
            $this->includeModules();
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
        $this->arResult["ID"] = $this->arParams["ID"];
        $this->arResult["IS_NEW"] = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $this->checkContactID();
        $this->arResult["ENTITY_TYPE_NAME"] = "VHI";
        $this->arResult["GUID"] = "HMS_VHI_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_CONFIG_OPTIONS"] = $this->prepareEntityConfigOptions();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function checkContactID() {
        $isNew = $this->arResult["IS_NEW"];
        if (!$isNew) return;

        $contactID = $this->request->getQueryList()->get("CONTACT_ID");
        if (!$contactID || $contactID < 0)
            throw new SystemException("CONTACT_ID not found");

        $this->contactID = $contactID;
    }

    protected function prepareEntityFields() {
        $isNew = $this->arResult["IS_NEW"];
        return array_filter(array(
            "ID" => !$isNew ? array(
                "entity" => "vhi",
                "name" => "ID",
                "originalName" => "ID",
                "title" => VhiTable::getMap("ID")->getTitle(),
                "type" => "number",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            "CONTACT_ID" => array(
                "entity" => "vhi",
                "name" => "CONTACT_ID",
                "originalName" => "CONTACT_ID",
                "title" => VhiTable::getMap("CONTACT")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "contact",
                    "tagSelectorID" => "CONTACT_ID",
                ),
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ),
            "VHI_TYPE_ID" => array(
                "entity" => "vhi",
                "name" => "VHI_TYPE_ID",
                "originalName" => "VHI_TYPE_ID",
                "title" => VhiTable::getMap("VHI_TYPE")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-vhi-type",
                    "tagSelectorID" => "VHI_TYPE_ID",
                ),
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "NUMBER" => array(
                "entity" => "vhi",
                "name" => "NUMBER",
                "originalName" => "NUMBER",
                "title" => VhiTable::getMap("NUMBER")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "ACTIVE" => array(
                "entity" => "vhi",
                "name" => "ACTIVE",
                "originalName" => "ACTIVE",
                "title" => VhiTable::getMap("ACTIVE")->getTitle(),
                "type" => "boolean",
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            "DATE_START" => array(
                "entity" => "vhi",
                "name" => "DATE_START",
                "originalName" => "DATE_START",
                "title" => VhiTable::getMap("DATE_START")->getTitle(),
                "type" => "datetime",
                "data" =>  array(
                    "enableTime" => false,
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            "DATE_END" => array(
                "entity" => "vhi",
                "name" => "DATE_END",
                "originalName" => "DATE_END",
                "title" => VhiTable::getMap("DATE_END")->getTitle(),
                "type" => "datetime",
                "data" =>  array(
                    "enableTime" => false,
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
        ));
    }

    protected function prepareEntityConfig() {
        return array(
            array(
                "name" => "left",
                "type" => "column",
                "data" => array(
                    "width" => 30
                ),
                "elements" => array(
                    array(
                        "name" => "main",
                        "title" => Loc::getMessage("HMS_VHI_ENTITY_SECTION_MAIN"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                            "enableToggling" => !$this->arResult["IS_NEW"],
                        ),
                        "elements" => array(
                            array(
                                "name" => "ID"
                            ),
                            array(
                                "name" => "CONTACT_ID"
                            ),
                            array(
                                "name" => "VHI_TYPE_ID"
                            ),
                            array(
                                "name" => "NUMBER"
                            ),
                            array(
                                "name" => "ACTIVE"
                            ),
                            array(
                                "name" => "DATE_START"
                            ),
                            array(
                                "name" => "DATE_END"
                            ),
                        )
                    ),
                )
            ),
        );
    }

    protected function prepareEntityConfigOptions() {
        return array(
            "enableQuickEdit" => "N"
        );
    }

    protected function prepareEntityData() {
        $vhiID = $this->arResult["ID"];
        $vhi = array();
        if ($vhiID >= 0) {
            $vhiObject = VhiTable::getById($vhiID)->fetchObject();
            if (!$vhiObject)
                $vhiObject = VhiTable::createObject();

            $vhi = array_map(function ($value) {
                if ($value instanceof \Bitrix\Main\Type\Date)
                    return $value->format($value->getFormat());
                return $value;
            }, $vhiObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            ));
        }

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $vhi[$entityKey] ?: "";
            switch ($entityKey) {
                case "CONTACT_ID":
                    if (!$this->arResult["IS_NEW"]) break;
                    $result[$entityKey] = $this->contactID;
                    break;
                case "ACTIVE":
                    $result[$entityKey] = $vhi[$entityKey] ? "Y" : "N";
                    break;
            }
        }

        return $result;
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->arResult["ENTITY_DATA"]["NUMBER"];
        $isNew = $this->arResult["IS_NEW"];
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_VHI_NEW_VHI_TITLE") : $title);
    }

    protected function prepareEntityControllers() {
        $result = array();

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
