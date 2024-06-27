<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Error;
use Bitrix\Main\Errorable;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\State;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use Bitrix\Main\Web\Json;
use MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable;
use MyWebstor\Hms\Vhi\VhiTypeTable;

Loc::loadMessages(__FILE__);

class HmsVhiTypeDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
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
        $vhiTypeID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if (!$vhiTypeID || $vhiTypeID <= 0) {
            $vhiTypeObject = VhiTypeTable::createObject();
            $vhiTypeObject->setId(0);
        } else {
            $vhiTypeObject = VhiTypeTable::getById($vhiTypeID)->fetchObject();
            if (!$vhiTypeObject)
                return $this->returnError("Vhi not found");
        }

        foreach ($vhiTypeObject->entity->getScalarFields() as $scalarField) {
            if ($scalarField->isAutocomplete() || !array_key_exists($scalarField->getColumnName(), $data)) continue;

            switch ($scalarField->getColumnName()) {
                default:
                    $vhiTypeObject->set($scalarField->getColumnName(), $data[$scalarField->getColumnName()]);
                    break;
            }
        }

        if (isset($data["SERVICE_TYPE"])) {
            $vhiTypeObject->removeAllServiceType();
            if (!empty($data["SERVICE_TYPE"]))
                try {
                    $data["SERVICE_TYPE"] = explode(",", $data["SERVICE_TYPE"]);
                    foreach ($data["SERVICE_TYPE"] as $serviceTypeCode) {
                        list($serviceTypeID, $serviceTypeActive) = explode("_", $serviceTypeCode);
                        $vhiTypeVhiServiceTypeObject = null;

                        if (!in_array($vhiTypeObject->state, array(State::RAW, State::DELETED))) {
                            $vhiTypeVhiServiceTypeObject = VhiTypeVhiServiceTypeTable::getByPrimary(array(
                                "VHI_TYPE_ID" => $vhiTypeObject->getId(),
                                "VHI_SERVICE_TYPE_ID" => $serviceTypeID,
                            ))->fetchObject();
                        }
                        if (!$vhiTypeVhiServiceTypeObject) {
                            $vhiTypeVhiServiceTypeObject = VhiTypeVhiServiceTypeTable::createObject();
                            $vhiTypeVhiServiceTypeObject
                                ->setVhiServiceTypeId($serviceTypeID);
                        }

                        $vhiTypeVhiServiceTypeObject
                            ->setActive($serviceTypeActive === "Y");

                        $vhiTypeObject->addToServiceType($vhiTypeVhiServiceTypeObject);
                    }
                } catch (\Exception $e) {
                    $vhiTypeObject->fillServiceType();
                }
        }

        $title = $vhiTypeObject->getTitle();
        $vhiTypeObject->unsetTitle();
        $vhiTypeObject->setTitle($title);

        $saveResult = $vhiTypeObject->save();
        if (!$saveResult->isSuccess()) {
            return $this->returnError(join(", <br>", $saveResult->getErrorMessages()));
        } else {
            if (!$vhiTypeID || $vhiTypeID <= 0)
                $result["ENTITY_ID"] = $vhiTypeID = $saveResult->getPrimary()["ID"];

            $result["REDIRECT_URL"] = "/hms/config/vhi/type/details/$vhiTypeID/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";
        }

        $this->arParams["ID"] = $vhiTypeID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($vhiTypeID) {
        $this->includeModules();

        if (!$vhiTypeID)
            return $this->returnError("VHI_TYPE_ID not found");

        $vhiTypeObject = VhiTypeTable::getById($vhiTypeID)->fetchObject();
        if (!$vhiTypeObject)
            return $this->returnError("VHI_TYPE not found");

        $deleteResult = $vhiTypeObject->delete();
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
        $this->arResult["ENTITY_TYPE_NAME"] = "VHI_TYPE";
        $this->arResult["GUID"] = "HMS_VHI_TYPE_CARD";
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
                "entity" => "vhi_type",
                "name" => "ID",
                "originalName" => "ID",
                "title" => VhiTypeTable::getMap("ID")->getTitle(),
                "type" => "number",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            "TITLE" => array(
                "entity" => "vhi_type",
                "name" => "TITLE",
                "originalName" => "TITLE",
                "title" => VhiTypeTable::getMap("TITLE")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            "SERVICE_TYPE" => array(
                "entity" => "vhi_type",
                "name" => "SERVICE_TYPE",
                "originalName" => "SERVICE_TYPE",
                "title" => VhiTypeTable::getMap("SERVICE_TYPE")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-vhi-service-type",
                    "multiple" => true,
                    "tagSelectorID" => "SERVICE_TYPE",
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
                        "title" => Loc::getMessage("HMS_VHI_TYPE_ENTITY_SECTION_MAIN"),
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
                                "name" => "SERVICE_TYPE"
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
        $vhiTypeID = $this->arResult["ID"];
        $vhiType = array();
        if ($vhiTypeID >= 0) {
            $vhiTypeObject = VhiTypeTable::getById($vhiTypeID)->fetchObject();
            if (!$vhiTypeObject)
                $vhiTypeObject = VhiTypeTable::createObject();

            if (!in_array($vhiTypeObject->state, array(State::RAW, State::DELETED)))
                $vhiTypeObject->fill(array("SERVICE_TYPE"));

            $vhiType = array_map(function ($value) {
                if ($value instanceof \Bitrix\Main\Type\Date)
                    return $value->format($value->getFormat());
                return $value;
            }, $vhiTypeObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            ));
        }

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $vhiType[$entityKey] ?: "";
            switch ($entityKey) {
                case "SERVICE_TYPE":
                    $serviceTypes = array();

                    $vhiServiceTypeCollection = $vhiTypeObject->getServiceType();
                    foreach ($vhiServiceTypeCollection as $vhiServiceTypeObject) {
                        $serviceTypes[] = implode("_", array(
                            $vhiServiceTypeObject->getVhiServiceTypeId(),
                            $vhiServiceTypeObject->getActive() === true ? "Y" : "N"
                        ));
                    }

                    $result[$entityKey] = $serviceTypes ?: null;
                    break;
            }
        }

        return $result;
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->arResult["ENTITY_DATA"]["TITLE"];
        $isNew = $this->arResult["IS_NEW"];
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_VHI_TYPE_NEW_VHI_TITLE") : $title);
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
