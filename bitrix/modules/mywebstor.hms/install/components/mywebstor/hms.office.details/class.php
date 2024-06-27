<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Error;
use Bitrix\Main\Errorable;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\Binding\SpecializationBindingTable;
use MyWebstor\Hms\Integration\DocumentGenerator\DataProvider\Office;
use MyWebstor\Hms\OfficeTable;
use MyWebstor\Hms\SpecializationTable;

Loc::loadMessages(__FILE__);

class HmsOfficeDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
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

    public function saveAction($data, $signedParameters) {
        $this->includeModules();
        $data = array_filter($data ?: array(), function ($key) {
            return !empty($key);
        }, ARRAY_FILTER_USE_KEY);
        $signedParameters = ParameterSigner::unsignParameters($this->getName(), $signedParameters);
        $officeID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if ($officeID <= 0 || !$officeID)
            $officeObject = OfficeTable::createObject();
        else {
            $officeObject = OfficeTable::getById($officeID)->fetchObject();
            if (!$officeObject)
                return $this->returnError("Office not found");
        }

        foreach ($data as $key => $value) {
            if (!OfficeTable::getEntity()->hasField($key)) continue;
            switch ($key) {
                case "SPECIALIZATION":
                    $specializationIDs = explode(",", $value);
                    $officeObject->removeAllSpecialization();

                    foreach ($specializationIDs as $specializationID) {
                        $specializationObject = SpecializationTable::getById($specializationID)->fetchObject();
                        if (!$specializationObject) continue;

                        $officeObject->addToSpecialization($specializationObject);
                    }
                    break;
                default:
                    $officeObject->set($key, $value);
                    break;
            }
        }

        $saveResult = $officeObject->save();

        if (!$saveResult->isSuccess())
            return $this->returnError(join(", ", $saveResult->getErrorMessages()));

        $officeID = $officeObject->getId();
        $result["ENTITY_ID"] = $officeID;
        $result["REDIRECT_URL"] = "/hms/config/office/details/{$result["ENTITY_ID"]}/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";

        $this->arParams["ID"] = $officeID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($officeID) {
        if (!$officeID)
            return $this->returnError("Office ID not found");

        $this->includeModules();
        $result = OfficeTable::delete($officeID);
        if (!$result->isSuccess())
            return $this->returnError(join(",", $result->getErrorMessages()));

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
        $this->arResult["ENTITY_TYPE_NAME"] = "OFFICE";
        $this->arResult["GUID"] = "HMS_OFFICE_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->arResult["DOCGEN_BUTTON_PARAMS"] = \MyWebstorHmsHelper::getDocumentButtonParameters(
            Office::class,
            $this->arResult["ID"] ?: null
        );
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function prepareEntityFields() {
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        return array_filter(array(
            "ID" => !$isNew ? array(
                "entity" => "office",
                "name" => "ID",
                "originalName" => "ID",
                "title" => OfficeTable::getMap("ID")->getTitle(),
                "type" => "number",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            "TITLE" => array(
                "entity" => "office",
                "name" => "TITLE",
                "originalName" => "TITLE",
                "title" => OfficeTable::getMap("TITLE")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "CLINIC_ID" => array(
                "entity" => "office",
                "name" => "CLINIC_ID",
                "originalName" => "CLINIC_ID",
                "title" => OfficeTable::getMap("CLINIC")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-clinic",
                    "tagSelectorID" => "CLINIC_ID",
                ),
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "SPECIALIZATION" => array(
                "entity" => "office",
                "name" => "SPECIALIZATION",
                "originalName" => "SPECIALIZATION",
                "title" => OfficeTable::getMap("SPECIALIZATION")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-specialization",
                    "multiple" => true,
                    "tagSelectorID" => "SPECIALIZATION",
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
                    "width" => 100
                ),
                "elements" => array(
                    array(
                        "name" => "main",
                        "title" => Loc::getMessage("HMS_OFFICE_ENTITY_SECTION_MAIN"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false
                        ),
                        "elements" => array(
                            array(
                                "name" => "ID"
                            ),
                            array(
                                "name" => "TITLE"
                            ),
                            array(
                                "name" => "CLINIC_ID"
                            ),
                            array(
                                "name" => "SPECIALIZATION"
                            ),
                        )
                    ),
                )
            )
        );
    }

    protected function prepareEntityData() {
        $officeID = $this->arResult["ID"];
        $officeObject = OfficeTable::createObject();
        if ($officeID > 0) {
            $officeObject = OfficeTable::getById($officeID)->fetchObject();
            if (!$officeObject)
                throw new SystemException("Office not found");

            $officeObject->fill("SPECIALIZATION");
        }

        $office = $officeObject->collectValues(
            Values::ALL,
            FieldTypeMask::FLAT,
            true
        );

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $office[$entityKey];
            switch ($entityKey) {
                case "CLINIC_ID":
                    $result[$entityKey] = $office[$entityKey] ?: null;
                    break;
                case "SPECIALIZATION":
                    $result[$entityKey] = null;
                    $specializationCollection = $officeObject->getSpecialization();
                    if (!$specializationCollection || $specializationCollection->isEmpty()) break;

                    $result[$entityKey] = $specializationCollection->getIdList();
                    break;
            }
        }

        return $result;
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->arResult["ENTITY_DATA"]["TITLE"];
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_OFFICE_NEW_OFFICE_TITLE") : $title);
    }

    protected function prepareEntityControllers() {
        return array();
    }

    protected function prepareAjaxData() {
        return array(
            "COMPONENT_NAME" => $this->getName(),
            "ACTION_NAME" => "save",
            "SIGNED_PARAMETERS" => $this->getSignedParameters(),
        );
    }
}
