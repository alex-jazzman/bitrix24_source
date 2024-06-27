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
use MyWebstor\Hms\Vhi\VhiServiceTypeTable;
use MyWebstor\Hms\Vhi\VhiStorageTable;
use MyWebstor\Hms\VhiTable;

Loc::loadMessages(__FILE__);

class HmsVhiServiceTypeDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
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
        $vhiServiceTypeID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if (!$vhiServiceTypeID || $vhiServiceTypeID <= 0) {
            $vhiServiceTypeObject = VhiServiceTypeTable::createObject();
            $vhiServiceTypeObject->setId(0);
        } else {
            $vhiServiceTypeObject = VhiServiceTypeTable::getById($vhiServiceTypeID)->fetchObject();
            if (!$vhiServiceTypeObject)
                return $this->returnError("Vhi not found");
        }

        foreach ($vhiServiceTypeObject->entity->getScalarFields() as $scalarField) {
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

                    $vhiServiceTypeObject->setServices($services);
                    break;
                default:
                    $vhiServiceTypeObject->set($scalarField->getColumnName(), $data[$scalarField->getColumnName()]);
                    break;
            }
        }

        $title = $vhiServiceTypeObject->getTitle();
        $vhiServiceTypeObject->unsetTitle();
        $vhiServiceTypeObject->setTitle($title);

        $saveResult = $vhiServiceTypeObject->save();
        if (!$saveResult->isSuccess()) {
            return $this->returnError(join(", <br>", $saveResult->getErrorMessages()));
        } else {
            if (!$vhiServiceTypeID || $vhiServiceTypeID <= 0)
                $result["ENTITY_ID"] = $vhiServiceTypeID = $saveResult->getPrimary()["ID"];

            $result["REDIRECT_URL"] = "/hms/config/vhi/service_type/details/$vhiServiceTypeID/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";
        }

        $this->arParams["ID"] = $vhiServiceTypeID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($vhiServiceTypeID) {
        $this->includeModules();

        if (!$vhiServiceTypeID)
            return $this->returnError("VHI_SERVICE_TYPE_ID not found");

        $vhiServiceTypeObject = VhiServiceTypeTable::getById($vhiServiceTypeID)->fetchObject();
        if (!$vhiServiceTypeObject)
            return $this->returnError("VHI_SERVICE_TYPE not found");

        $deleteResult = $vhiServiceTypeObject->delete();
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
        $this->arResult["IS_NEW"] = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $this->arResult["ENTITY_TYPE_NAME"] = "VHI_SERVICE_TYPE";
        $this->arResult["GUID"] = "HMS_VHI_SERVICE_TYPE_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_CONFIG_OPTIONS"] = $this->prepareEntityConfigOptions();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function prepareEntityFields() {
        $isNew = $this->arResult["IS_NEW"];
        return array_filter(array(
            "ID" => !$isNew ? array(
                "entity" => "vhi_service_type",
                "name" => "ID",
                "originalName" => "ID",
                "title" => VhiServiceTypeTable::getMap("ID")->getTitle(),
                "type" => "number",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            "TITLE" => array(
                "entity" => "vhi_service_type",
                "name" => "TITLE",
                "originalName" => "TITLE",
                "title" => VhiServiceTypeTable::getMap("TITLE")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "SERVICES" => array(
                "entity" => "vhi_service_type",
                "name" => "SERVICES",
                "originalName" => "SERVICES",
                "title" => VhiServiceTypeTable::getMap("SERVICES")->getTitle(),
                "type" => "variousEntitySelector",
                "data" => array(
                    "entity" => array(
                        array(
                            "id" => "hms-section",
                            "title" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_SERVICES_ENTITY_SECTION_TITLE"),
                            "dynamicLoad" => true,
                            "dynamicSearch" => true,
                            "options" => array(
                                "iblockId" => \Bitrix\Crm\Product\Catalog::getDefaultId()
                            )
                        ),
                        array(
                            "id" => "hms-product",
                            "title" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_SERVICES_ENTITY_PRODUCT_TITLE"),
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
                        "title" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_ENTITY_SECTION_MAIN"),
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
                                "name" => "TITLE"
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
        $vhiServiceTypeID = $this->arResult["ID"];
        $vhiServiceType = array();
        if ($vhiServiceTypeID >= 0) {
            $vhiServiceTypeObject = VhiServiceTypeTable::getById($vhiServiceTypeID)->fetchObject();
            if (!$vhiServiceTypeObject)
                $vhiServiceTypeObject = VhiServiceTypeTable::createObject();

            $vhiServiceType = array_map(function ($value) {
                if ($value instanceof \Bitrix\Main\Type\Date)
                    return $value->format($value->getFormat());
                return $value;
            }, $vhiServiceTypeObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            ));
        }

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $vhiServiceType[$entityKey] ?: "";
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
        $title = $this->arResult["ENTITY_DATA"]["NUMBER"];
        $isNew = $this->arResult["IS_NEW"];
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_VHI_SERVICE_TYPE_NEW_VHI_TITLE") : $title);
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
