<?

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
use MyWebstor\Hms\SpecializationTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsSpecializationDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
    /** @var ErrorCollection */
    protected $errorCollection;

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
        $specializationID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if (!$specializationID || $specializationID <= 0) {
            $specializationObject = SpecializationTable::createObject();
            $specializationObject->setId(0);
        } else {
            $specializationObject = SpecializationTable::getById($specializationID)->fetchObject();
            if (!$specializationObject)
                return $this->returnError("Specialization not found");
        }

        foreach ($specializationObject->entity->getScalarFields() as $scalarField) {
            if ($scalarField->isAutocomplete() || !array_key_exists($scalarField->getColumnName(), $data)) continue;

            switch ($scalarField->getColumnName()) {
                case "SERVICES":
                    $services = array();

                    try {
                        $data["SERVICES"] = Json::decode($data["SERVICES"]);
                        if (is_array($data["SERVICES"]))
                            foreach ($data["SERVICES"] as $service) {
                                list($serviceCode, $serviceID) = $service;
                                switch ($serviceCode) {
                                    case "hms-section":
                                        $services[] = "S_" . $serviceID;
                                        break;
                                    case "hms-product":
                                        $services[] = "P_" . $serviceID;
                                        break;
                                }
                            }
                    } catch (\Exception $e) {
                    }

                    $specializationObject->setServices($services);
                    break;
                default:
                    $specializationObject->set($scalarField->getColumnName(), $data[$scalarField->getColumnName()]);
                    break;
            }
        }

        $title = $specializationObject->getTitle();
        $specializationObject->unsetTitle();
        $specializationObject->setTitle(trim($title));

        $saveResult = $specializationObject->save();
        if (!$saveResult->isSuccess()) {
            return $this->returnError(join(", <br>", $saveResult->getErrorMessages()));
        } else {
            if (!$specializationID || $specializationID <= 0)
                $result["ENTITY_ID"] = $specializationID = $saveResult->getPrimary()["ID"];

            $result["REDIRECT_URL"] = "/hms/config/specialization/details/$specializationID/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";
        }

        $this->arParams["ID"] = $specializationID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($specializationID) {
        $this->includeModules();

        if (!$specializationID)
            return $this->returnError("SCHEDULE_ID not found");

        $specializationObject = SpecializationTable::getById($specializationID)->fetchObject();
        if (!$specializationObject)
            return $this->returnError("SCHEDULE not found");

        $deleteResult = $specializationObject->delete();
        if (!$deleteResult->isSuccess())
            return $this->returnError(join(", ", $deleteResult->getErrorMessages()));

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
        $this->arResult["ENTITY_TYPE_NAME"] = "SPECIALIZATION";
        $this->arResult["GUID"] = "HMS_SPECIALIZATION_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_CONFIG_OPTIONS"] = $this->prepareEntityConfigOptions();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function prepareEntityFields() {
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        return array_filter(array(
            "ID" => !$isNew ? array(
                "entity" => "specialization",
                "name" => "ID",
                "originalName" => "ID",
                "title" => SpecializationTable::getMap("ID")->getTitle(),
                "type" => "number",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            "TITLE" => array(
                "entity" => "specialization",
                "name" => "TITLE",
                "originalName" => "TITLE",
                "title" => SpecializationTable::getMap("TITLE")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "RECEIVE_TYPE" => array(
                "entity" => "specialization",
                "name" => "RECEIVE_TYPE",
                "originalName" => "RECEIVE_TYPE",
                "title" => SpecializationTable::getMap("RECEIVE_TYPE")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-receive-type",
                    "tagSelectorID" => "RECEIVE_TYPE",
                ),
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "SERVICES" => array(
                "entity" => "specialization",
                "name" => "SERVICES",
                "originalName" => "SERVICES",
                "title" => SpecializationTable::getMap("SERVICES")->getTitle(),
                "type" => "variousEntitySelector",
                "data" => array(
                    "entity" => array(
                        array(
                            "id" => "hms-section",
                            "title" => Loc::getMessage("HMS_SPECIALIZATION_SERVICES_ENTITY_SECTION_TITLE"),
                            "dynamicLoad" => true,
                            "dynamicSearch" => true,
                            "options" => array(
                                "iblockId" => \Bitrix\Crm\Product\Catalog::getDefaultId()
                            )
                        ),
                        array(
                            "id" => "hms-product",
                            "title" => Loc::getMessage("HMS_SPECIALIZATION_SERVICES_ENTITY_PRODUCT_TITLE"),
                            "options" => array(
                                "iblockId" => \Bitrix\Crm\Product\Catalog::getDefaultId()
                            )
                        ),
                    ),
                    "viewField" => "SERVICES_HTML",
                    "tagSelectorID" => "SERVICES_ID",
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
                        "title" => Loc::getMessage("HMS_SPECIALIZATION_ENTITY_SECTION_MAIN"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                        ),
                        "elements" => array(
                            array(
                                "name" => "ID"
                            ),
                            array(
                                "name" => "TITLE"
                            ),
                            array(
                                "name" => "RECEIVE_TYPE"
                            ),
                            array(
                                "name" => "SERVICES"
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
        $specializationID = $this->arResult["ID"];
        $specialization = array();
        if ($specializationID >= 0) {
            $specializationObject = SpecializationTable::getById($specializationID)->fetchObject();
            if (!$specializationObject)
                $specializationObject = SpecializationTable::createObject();

            $specializationObject->fill();

            $specialization = array_map(function ($value) {
                if ($value instanceof \Bitrix\Main\Type\Date)
                    return $value->format($value->getFormat());
                return $value;
            }, $specializationObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            ));
        }

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $specialization[$entityKey] ?: "";
            switch ($entityKey) {
                case "SERVICES":
                    $services = array();

                    if (is_array($result[$entityKey]))
                        foreach ($result[$entityKey] as $serviceID) {
                            list($serviceCode, $serviceID) = explode("_", $serviceID, 2);
                            switch ($serviceCode) {
                                case "S":
                                    $services[] = array("hms-section", $serviceID);
                                    break;
                                case "P":
                                    $services[] = array("hms-product", $serviceID);
                                    break;
                            }
                        }

                    $result[$entityKey] = $services ?: null;
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
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_SPECIALIZATION_NEW_SPECIALIZATION_TITLE") : $title);
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
