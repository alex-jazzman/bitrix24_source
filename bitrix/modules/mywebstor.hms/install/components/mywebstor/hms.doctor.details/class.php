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
use Bitrix\Main\Web\Uri;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\Integration\DocumentGenerator\DataProvider\Doctor;
use MyWebstor\Hms\SpecializationTable;

Loc::loadMessages(__FILE__);

class HmsDoctorDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
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
        $doctorID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if ($doctorID <= 0 || !$doctorID) {
            $doctorObject = DoctorTable::getById($data["ID"])->fetchObject();
            if (isset($doctorObject))
                return $this->returnError("This doctor already exists");

            $doctorObject = DoctorTable::createObject();
        } else {
            $doctorObject = DoctorTable::getById($doctorID)->fetchObject();
            if (!$doctorObject)
                $this->returnError("Doctor not found");
        }

        foreach ($data as $key => $value) {
            if (!DoctorTable::getEntity()->hasField($key)) continue;
            switch ($key) {
                case "SPECIALIZATION":
                    $specializationIDs = explode(",", $value);
                    $doctorObject->removeAllSpecialization();

                    foreach ($specializationIDs as $specializationID) {
                        $specializationObject = SpecializationTable::getById($specializationID)->fetchObject();
                        if (!$specializationObject) continue;

                        $doctorObject->addToSpecialization($specializationObject);
                    }
                    break;
                default:
                    $doctorObject->set($key, $value);
                    break;
            }
        }

        $saveResult = $doctorObject->save();

        if (!$saveResult->isSuccess())
            return $this->returnError(join(", ", $saveResult->getErrorMessages()));

        $doctorID = $doctorObject->getId();
        $result["ENTITY_ID"] = $doctorID;
        $result["REDIRECT_URL"] = "/hms/config/doctor/details/{$result["ENTITY_ID"]}/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";

        $this->arParams["ID"] = $doctorID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($doctorID) {
        if (!$doctorID)
            return $this->returnError("Doctor ID not found");

        $this->includeModules();
        $result = DoctorTable::delete($doctorID);
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
        $this->arResult["ENTITY_TYPE_NAME"] = "DOCTOR";
        $this->arResult["GUID"] = "HMS_DOCTOR_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->arResult["DOCGEN_BUTTON_PARAMS"] = \MyWebstorHmsHelper::getDocumentButtonParameters(
            Doctor::class,
            $this->arResult["ID"] ?: null
        );
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function prepareEntityFields() {
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        if ($isNew)
            return array(
                array(
                    "entity" => "doctor",
                    "name" => "ID",
                    "originalName" => "ID",
                    "title" => DoctorTable::getMap("USER")->getTitle(),
                    "type" => "entitySelector",
                    "data" => array(
                        "entity" => "user",
                        "tagSelectorID" => "USER_ID",
                    ),
                    "editable" => true,
                    "required" => true,
                    "optionFlags" => 1,
                )
            );
        else
            return array(
                array(
                    "entity" => "doctor",
                    "name" => "ID",
                    "originalName" => "ID",
                    "title" => DoctorTable::getMap("ID")->getTitle(),
                    "type" => "number",
                    "editable" => false,
                    "required" => true,
                    "optionFlags" => 1,
                ),
                array(
                    "entity" => "doctor",
                    "name" => "USER_ID",
                    "originalName" => "USER_ID",
                    "title" => DoctorTable::getMap("USER")->getTitle(),
                    "type" => "entitySelector",
                    "data" => array(
                        "entity" => "user",
                        "tagSelectorID" => "USER_ID",
                    ),
                    "editable" => false,
                    "required" => false,
                    "optionFlags" => 1,
                ),
                array(
                    "entity" => "doctor",
                    "name" => "SPECIALIZATION",
                    "originalName" => "SPECIALIZATION",
                    "title" => DoctorTable::getMap("SPECIALIZATION")->getTitle(),
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
                // array(
                //     "entity" => "doctor",
                //     "name" => "IS_CONTINUOUS_SCHEME",
                //     "originalName" => "IS_CONTINUOUS_SCHEME",
                //     "title" => DoctorTable::getMap("IS_CONTINUOUS_SCHEME")->getTitle(),
                //     "type" => "boolean",
                //     "editable" => true,
                //     "required" => false,
                //     "optionFlags" => 1,
                // ),
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
                        "title" => Loc::getMessage("HMS_DOCTOR_ENTITY_SECTION_MAIN"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false
                        ),
                        "elements" => array(
                            array(
                                "name" => "ID"
                            ),
                            array(
                                "name" => "USER_ID"
                            ),
                            array(
                                "name" => "SPECIALIZATION"
                            ),
                            // array(
                            //     "name" => "IS_CONTINUOUS_SCHEME"
                            // ),
                        )
                    ),
                )
            )
        );
    }

    protected function prepareEntityData() {
        $doctorID = $this->arResult["ID"];
        $doctorObject = DoctorTable::createObject();
        if ($doctorID > 0) {
            $doctorObject = DoctorTable::getById($doctorID)->fetchObject();
            if (!$doctorObject)
                throw new SystemException("Doctor not found");

            $doctorObject->fill(array("SPECIALIZATION", "USER_TITLE"));
        }

        $doctor = $doctorObject->collectValues(
            Values::ALL,
            FieldTypeMask::FLAT,
            true
        );

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $doctor[$entityKey];
            switch ($entityKey) {
                case "ID":
                    $result[$entityKey] = $doctor[$entityKey] ?: null;

                    break;
                case "USER_ID":
                    $result[$entityKey] = $result["ID"];
                    $result["USER_HEADER"] = $doctor["USER_TITLE"];
                    break;
                case "SPECIALIZATION":
                    $result[$entityKey] = null;
                    $specializationCollection = $doctorObject->getSpecialization();
                    if ($specializationCollection->isEmpty()) break;

                    $result[$entityKey] = $specializationCollection->getIdList();
                    break;
            }
        }

        return $result;
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->arResult["ENTITY_DATA"]["USER_HEADER"];
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_DOCTOR_NEW_DOCTOR_TITLE") : $title);
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
