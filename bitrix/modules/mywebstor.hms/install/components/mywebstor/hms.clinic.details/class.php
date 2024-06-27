<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Error;
use Bitrix\Main\Errorable;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\ClinicTable;
use MyWebstor\Hms\Integration\DocumentGenerator\DataProvider\Clinic;

Loc::loadMessages(__FILE__);

class HmsClinicDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
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
        $clinicID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if ($clinicID <= 0) {
            $addResult = ClinicTable::add($data);
            if (!$addResult->isSuccess())
                return $this->returnError(join(", <br>", $addResult->getErrorMessages()));

            $result["ENTITY_ID"] = $addResult->getId();
        } else {
            $updateResult = ClinicTable::update($clinicID, $data);
            if (!$updateResult->isSuccess())
                return $this->returnError(join(", <br>", $updateResult->getErrorMessages()));

            $result["ENTITY_ID"] = $clinicID;
        }

        $result["REDIRECT_URL"] = "/hms/config/clinic/details/{$result["ENTITY_ID"]}/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";

        $this->arParams["ID"] = $clinicID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($clinicID) {
        if (!$clinicID)
            return $this->returnError("Clinic ID not found");

        $this->includeModules();
        $result = ClinicTable::delete($clinicID);
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
        $this->arResult["ENTITY_TYPE_NAME"] = "CLINIC";
        $this->arResult["GUID"] = "HMS_CLINIC_CARD";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->arResult["DOCGEN_BUTTON_PARAMS"] = \MyWebstorHmsHelper::getDocumentButtonParameters(
            Clinic::class,
            $this->arResult["ID"] ?: null
        );
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function prepareEntityFields() {
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        return array_filter(array(
            !$isNew ? array(
                "entity" => "clinic",
                "name" => "ID",
                "originalName" => "ID",
                "title" => ClinicTable::getMap("ID")->getTitle(),
                "type" => "number",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            array(
                "entity" => "clinic",
                "name" => "TITLE",
                "originalName" => "TITLE",
                "title" => ClinicTable::getMap("TITLE")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "clinic",
                "name" => "COMPANY_ID",
                "originalName" => "COMPANY_ID",
                "title" => ClinicTable::getMap("COMPANY")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "company",
                    "tagSelectorID" => "COMPANY_ID",
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
                        "title" => Loc::getMessage("HMS_CLINIC_ENTITY_SECTION_MAIN"),
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
                                "name" => "COMPANY_ID"
                            ),
                        )
                    ),
                )
            )
        );
    }

    protected function prepareEntityData() {
        $clinicID = $this->arResult["ID"];
        $clinic = array();
        if ($clinicID >= 0)
            $clinic = ClinicTable::getList(array(
                "filter" => array(
                    "ID" => $clinicID
                ),
                "select" => array(
                    "*"
                )
            ))->fetch();

        $result = array();

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $clinic[$entityKey];
            switch ($entityKey) {
                case "COMPANY_ID":
                    $result[$entityKey] = $clinic[$entityKey] ?: null;
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
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_CLINIC_NEW_CLINIC_TITLE") : $title);
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
