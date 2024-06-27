<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Catalog\ProductTable;
use Bitrix\Crm\ContactTable;
use Bitrix\Crm\Format\TextHelper;
use Bitrix\Crm\IBlockElementProxyTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\ProductRow;
use Bitrix\Crm\ProductRowCollection;
use Bitrix\Crm\ProductRowTable;
use Bitrix\Crm\StatusTable;
use Bitrix\Currency\CurrencyTable;
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
use Bitrix\Main\Type\Date;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UserTable;
use Bitrix\Main\Web\Uri;
use MyWebstor\Hms\AppointmentTable;
use MyWebstor\Hms\Binding\AppointmentContactTable;
use MyWebstor\Hms\Binding\AppointmentDealTable;
use MyWebstor\Hms\Binding\AppointmentReserveDateTable;
use MyWebstor\Hms\Binding\AppointmentReserveDoctorTable;
use MyWebstor\Hms\Binding\AppointmentReserveOfficeTable;
use MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable;
use MyWebstor\Hms\Binding\EO_AppointmentContact;
use MyWebstor\Hms\Integration\DocumentGenerator\DataProvider\Appointment;
use MyWebstor\Hms\ProductRowTable as HmsProductRowTable;

Loc::loadMessages(__FILE__);

class HmsAppointmentDetailsComponent extends \CBitrixComponent implements Controllerable, Errorable {
    /** @var ErrorCollection */
    protected $errorCollection;

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

    public function setError($errorMessage = "") {
        $this->errorCollection->setError(
            new Error($errorMessage)
        );
        return false;
    }

    public function saveAction($data, $signedParameters) {
        $this->includeModules();
        $signedParameters = ParameterSigner::unsignParameters($this->getName(), $signedParameters);
        $appointmentID = $signedParameters["ID"];
        $result = array(
            "EVENT_PARAMS" => array(),
        );

        if (!$appointmentID || $appointmentID <= 0) {
            $appointmentObject = AppointmentTable::createObject();
            $appointmentObject->setId(0);
        } else {
            $appointmentObject = AppointmentTable::getById($appointmentID)->fetchObject();
            if (!$appointmentObject)
                return $this->setError("Appointment not found");

            $appointmentObject->fill(FieldTypeMask::RELATION);
        }

        $originAppointmentObject = clone $appointmentObject;
        $originTitle = $originAppointmentObject->getTitle();
        $originAppointmentObject->unsetTitle();
        $originAppointmentObject->setTitle($originTitle);

        if (isset($signedParameters["SOURCE_TYPE"]) && isset($signedParameters["SOURCE_ID"])) {
            $appointmentObject->setSourceType($signedParameters["SOURCE_TYPE"]);
            $appointmentObject->setSourceId($signedParameters["SOURCE_ID"]);
        }

        foreach ($appointmentObject->entity->getScalarFields() as $scalarField) {
            $columnName = $scalarField->getColumnName();
            if ($scalarField->isAutocomplete() || !array_key_exists($columnName, $data)) continue;

            $value = $data[$columnName];

            switch ($columnName) {
                case "STATUS_ID":
                    $appointmentObject->setRealStatusId($value);
                    $statusObject = StatusTable::getList(array(
                        "filter" => array(
                            "ENTITY_ID" => "HMS_APPOINTMENT_STATUS",
                            "STATUS_ID" => $value
                        )
                    ))->fetchObject();
                    if (!$statusObject) break;

                    if ($value === AppointmentTable::STATUS_RESERVE) {
                        $appointmentObject
                            ->setDateFrom(DateTime::createFromTimestamp(0))
                            ->setDoctorId(0)
                            ->setOfficeId(0)
                            ->setSpecializationId(0);
                        break;
                    }

                    if (
                        !$statusObject->getSemantics()
                        || $statusObject->getSemantics() === PhaseSemantics::PROCESS
                    ) {
                        if ($appointmentObject->getReceive())
                            $data["RECEIVE"]["END_RECEIVE"] = "N";

                        $appointmentObject->removeAllDeals();
                    }
                    break;
                default:
                    $appointmentObject->set($columnName, $value);
                    break;
            }
        }
        foreach (array(
            "RESERVE_DOCTOR",
            "RESERVE_OFFICE",
            "RESERVE_SPECIALIZATION",
            "RESERVE_DATE",
        ) as $columnName) {
            if (!array_key_exists($columnName, $data)) continue;

            $value = $data[$columnName];

            switch ($columnName) {
                case "RESERVE_DOCTOR":
                    $appointmentObject->removeAllReserveDoctor();

                    $fieldValues = explode(",", $value);
                    foreach ($fieldValues as $fieldValue) {
                        if (!$fieldValue) continue;

                        $reserveDoctorObject = AppointmentReserveDoctorTable::createObject();
                        $reserveDoctorObject
                            ->setDoctorId($fieldValue);

                        $appointmentObject->addToReserveDoctor($reserveDoctorObject);
                    }
                    break;
                case "RESERVE_OFFICE":
                    $appointmentObject->removeAllReserveOffice();

                    $fieldValues = explode(",", $value);
                    foreach ($fieldValues as $fieldValue) {
                        if (!$fieldValue) continue;

                        $reserveOfficeObject = AppointmentReserveOfficeTable::createObject();
                        $reserveOfficeObject
                            ->setOfficeId($fieldValue);

                        $appointmentObject->addToReserveOffice($reserveOfficeObject);
                    }
                    break;
                case "RESERVE_SPECIALIZATION":
                    $appointmentObject->removeAllReserveSpecialization();

                    $fieldValues = explode(",", $value);
                    foreach ($fieldValues as $fieldValue) {
                        if (!$fieldValue) continue;

                        $reserveSpecializationObject = AppointmentReserveSpecializationTable::createObject();
                        $reserveSpecializationObject
                            ->setSpecializationId($fieldValue);

                        $appointmentObject->addToReserveSpecialization($reserveSpecializationObject);
                    }
                    break;
                case "RESERVE_DATE":
                    $appointmentObject->removeAllReserveDate();

                    foreach ($value as $reserveDate) {
                        $date = $reserveDate["DATE"];
                        $timeFrom = $reserveDate["TIME_FROM"];
                        $timeTo = $reserveDate["TIME_TO"];
                        if (!$date) continue;

                        $dateFrom = new DateTime($date);
                        $dateFrom->setTime(0, 0, 0, 0);
                        if (isset($timeFrom) && !empty($timeFrom)) {
                            list($hours, $minutes) = explode(":", $timeFrom);

                            $dateFrom->setTime($hours, $minutes);
                        }

                        $reserveDateObject = AppointmentReserveDateTable::createObject();
                        $reserveDateObject
                            ->setDateFrom($dateFrom);

                        if (isset($timeTo) && !empty($timeTo)) {
                            $dateTo = new DateTime($date);
                            list($hours, $minutes) = explode(":", $timeTo);

                            $dateTo->setTime($hours, $minutes);
                            $reserveDateObject->setDateTo($dateTo);
                        }

                        $appointmentObject->addToReserveDate($reserveDateObject);
                    }
                    break;
            }
        }

        if (isset($data["CLIENT_DATA"]) && $data["CLIENT_DATA"] !== "") {
            $clientData = \CUtil::JsObjectToPhp($data["CLIENT_DATA"]);

            if (isset($clientData["CONTACT_DATA"]) && is_array($clientData["CONTACT_DATA"])) {
                $appointmentObject->removeAllContactBindings();
                foreach (array_values(array_filter(
                    $clientData["CONTACT_DATA"],
                    fn ($contactItem) => $contactItem["id"] > 0
                )) as $contactKey => $contactItem) {
                    $appointmentContactObject = null;
                    if ($appointmentID > 0) {
                        $appointmentContactObject = AppointmentContactTable::getByPrimary(array(
                            "APPOINTMENT_ID" => $appointmentID,
                            "CONTACT_ID" => $contactItem["id"]
                        ))->fetchObject();
                    }
                    if (!$appointmentContactObject) {
                        $appointmentContactObject = AppointmentContactTable::createObject();
                        $appointmentContactObject->setContactId($contactItem["id"]);

                        if (($contactObject = ContactTable::getById($contactItem["id"])->fetchObject()))
                            $appointmentContactObject->setContact($contactObject);
                    }
                    $appointmentContactObject->setSort(10 + $contactKey * 10);
                    $appointmentContactObject->setIsPrimary($contactKey === 0 ? "Y" : "N");
                    $appointmentObject->addToContactBindings($appointmentContactObject);
                }
            }
        }

        if (isset($data["PRODUCT_ROW_DATA_SETTINGS"]) && $data["PRODUCT_ROW_DATA_SETTINGS"] !== "") {
            $productRowDataSettings = \CUtil::JsObjectToPhp($data["PRODUCT_ROW_DATA_SETTINGS"]);

            if (isset($productRowDataSettings) && is_array($productRowDataSettings)) {
                $appointmentObject->removeAllProductRows();
            }
        }

        if (isset($data["PRODUCT_ROW_DATA"]) && $data["PRODUCT_ROW_DATA"] !== "") {
            $productRowData = \CUtil::JsObjectToPhp($data["PRODUCT_ROW_DATA"]);

            if (isset($productRowData) && is_array($productRowData)) {
                $appointmentObject->removeAllProductRows();
                foreach ($productRowData as $productRowItem) {
                    $productRowObject = null;
                    if ($productRowItem["ID"] > 0) {
                        $productRowObject = ProductRowTable::getById($productRowItem["ID"])
                            ->fetchObject();
                    }
                    if (!$productRowObject) {
                        $productRowObject = ProductRowTable::createObject();
                        $productRowObject->setOwnerType("HMS");
                        $productRowObject->setOwnerId(0);

                        if (
                            ($productId = $productRowItem["PRODUCT_ID"])
                            && ($productObject = IBlockElementProxyTable::getById($productId)->fetchObject())
                        )
                            $productRowObject->setIblockElement($productObject);
                    }

                    foreach ($productRowObject->entity->getScalarFields() as $scalarField) {
                        if ($scalarField->isAutocomplete() || !array_key_exists($scalarField->getColumnName(), $productRowItem)) continue;
                        $productRowObject->set($scalarField->getColumnName(), $productRowItem[$scalarField->getColumnName()]);
                    }

                    $productRowObject->customData->set("PRODUCT_ROW", $productRowItem);

                    $appointmentObject->addToProductRows($productRowObject);
                }
            }
        }

        if (
            isset($data["RECEIVE"])
            && is_array($data["RECEIVE"])
            && $data["RECEIVE"]["END_RECEIVE"] == "Y"
        ) {
            $status = StatusTable::getList(array(
                "filter" => array(
                    "=ENTITY_ID" => "HMS_APPOINTMENT_STATUS",
                    "=SEMANTICS" => PhaseSemantics::SUCCESS
                )
            ))->fetch();
            if (!$status)
                return $this->setError("Unexpected error. Status not found");

            $appointmentObject->setRealStatusId($status["STATUS_ID"]);

            $appointmentObject->removeAllDeals();
            if (is_array($data["RECEIVE"]["DEAL_ID"]) && count($data["RECEIVE"]["DEAL_ID"])) {
                foreach ($data["RECEIVE"]["DEAL_ID"] as $dealID) {
                    if ($appointmentObject->state !== State::RAW)
                        $appointmentDealObject = AppointmentDealTable::getByPrimary(array(
                            "DEAL_ID" => $dealID,
                            "APPOINTMENT_ID" => $appointmentObject->getId()
                        ))->fetchObject();

                    if (!isset($appointmentDealObject) || !$appointmentDealObject) {
                        $appointmentDealObject = AppointmentDealTable::createObject();

                        $appointmentDealObject
                            ->setDealId($dealID);
                    }

                    $appointmentObject->addToDeals($appointmentDealObject);
                }
            }

            if ($appointmentID && $appointmentID > 0) {
                $result["REDIRECT_URL"] = "/hms/reception/appointment/details/$appointmentID/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";
            }
        }

        $title = $appointmentObject->getTitle();
        $appointmentObject->unsetTitle();
        $appointmentObject->setTitle(trim($title));

        $saveResult = $appointmentObject->save();
        if (!$saveResult->isSuccess())
            return $this->setError(join(", <br>", $saveResult->getErrorMessages()));

        $productRowCollection = $appointmentObject->getProductRows();
        if (
            isset($productRowCollection)
            && !$productRowCollection->isEmpty()
        )
            foreach ($productRowCollection as $productRowObject) {
                $productRowItem = $productRowObject->customData->get("PRODUCT_ROW");
                if (!$productRowItem || !is_array($productRowItem)) continue;

                $hmsProductRowObject = HmsProductRowTable::getById($productRowObject->getId())->fetchObject();
                if (!$hmsProductRowObject)
                    $hmsProductRowObject = HmsProductRowTable::createObject(array("ID" => $productRowObject->getId()));

                $hmsProductRowObject
                    ->setIsVhi($productRowItem["IS_VHI"])
                    ->setTeeth($productRowItem["TEETH"] ?: array())
                    ->save();
            }

        if (isset($data["RECEIVE"]) && is_array($data["RECEIVE"])) {
            $receiveObject = $appointmentObject->getReceive();
            if (!$receiveObject) {
                $originAppointmentObject->save();
                return $this->setError("Receive not found");
            }

            $typedReceiveObject = $receiveObject->getTypedReceiveObject(false);
            if (!$typedReceiveObject) {
                $originAppointmentObject->save();
                return $this->setError("Unexpected error. Typed Receive not found.");
            }

            $typedReceiveSaveResult = $typedReceiveObject->saveByData($data);
            if (!$typedReceiveSaveResult->isSuccess()) {
                $originAppointmentObject->save();
                return $this->setError(join(", ", $typedReceiveSaveResult->getErrorMessages()));
            }
        }

        if (!$appointmentID || $appointmentID <= 0) {
            $appointmentID = $saveResult->getPrimary()["ID"];
            $result["REDIRECT_URL"] = "/hms/reception/appointment/details/$appointmentID/?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER";
        }
        $result["ENTITY_ID"] = $appointmentID;
        $result["ENTITY_TYPE_ID"] = 38;

        $this->arParams["ID"] = $appointmentID;
        $this->prepareResult();
        $result = array_merge($this->arResult, $result);

        return $result;
    }

    public function deleteAction($appointmentID) {
        if (!$appointmentID)
            return $this->setError("Appointment ID not found");

        $this->includeModules();

        $appointmentObject = AppointmentTable::getById($appointmentID)->fetchObject();
        if (!$appointmentObject)
            return $this->setError("Appointment not found");

        $result = $appointmentObject->delete();
        if (!$result->isSuccess())
            return $this->setError(join(",", $result->getErrorMessages()));

        return true;
    }

    public function startReceiveAction($appointmentID) {
        $this->includeModules();

        if (!$appointmentID || $appointmentID <= 0)
            return $this->setError("Appointment not found");

        $appointmentObject = AppointmentTable::getById($appointmentID)->fetchObject();
        if (!$appointmentObject)
            return $this->setError("Appointment not found");

        if (!$appointmentObject->getSpecializationId())
            return $this->setError("Cannot start receive without specialization");

        $receiveObject = $appointmentObject->getReceive();
        if (isset($receiveObject))
            return $this->setError("Receive already created");

        $receiveObject = $appointmentObject->getReceive(true);
        return isset($receiveObject);
    }

    public function createDealAction($appointmentID) {
        $this->includeModules();

        if (!$appointmentID || $appointmentID <= 0)
            return $this->setError("Appointment not found");

        $appointmentObject = AppointmentTable::getById($appointmentID)->fetchObject();
        if (!$appointmentObject)
            return $this->setError("Appointment not found");

        $contactBindings = array();
        $productRows = new ProductRowCollection;
        foreach ($appointmentObject->fillContactBindings() as $contactBinding) {
            $contactBindings[] = array(
                "CONTACT_ID" => $contactBinding->getContactId(),
                "IS_PRIMARY" => $contactBinding->getIsPrimary() ? "Y" : "N"
            );
        }
        foreach ($appointmentObject->fillProductRows() as $productRowObject) {
            $productRowObject = new ProductRow(
                $productRowObject->collectValues(
                    Values::ALL,
                    FieldTypeMask::FLAT,
                    true
                )
            );
            $productRowObject
                ->unset("ID")
                ->unsetOwnerId()
                ->unsetOwnerType();

            $productRows->add($productRowObject);
        }


        $container = \Bitrix\Crm\Service\Container::getInstance();
        $entityTypeID = \CCrmOwnerType::Deal;
        $factory = $container->getFactory($entityTypeID);

        /** @var \Bitrix\Crm\Item\Deal $item */
        $item = $factory->createItem();
        $item
            ->setTitle($appointmentObject->getTitle())
            ->setContactBindings($contactBindings)
            ->setProductRows($productRows);

        $action = $factory->getAddOperation($item);
        /** @var \Bitrix\Main\Entity\AddResult $actionResult */
        $actionResult = $action->launch();

        if (!$actionResult->isSuccess())
            return $this->setError(join(", ", $actionResult->getErrorMessages()));

        return $actionResult->getId();
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
        $this->arResult["ENTITY_TYPE_NAME"] = "APPOINTMENT";
        $this->arResult["GUID"] = "HMS_APPOINTMENT_CARD";
        $this->arResult["INITIAL_MODE"] = "view";
        $this->arResult["ENTITY_FIELDS"] = $this->prepareEntityFields();
        $this->arResult["ENTITY_CONFIG"] = $this->prepareEntityConfig();
        $this->arResult["ENTITY_CONFIG_OPTIONS"] = $this->prepareEntityConfigOptions();
        $this->arResult["ENTITY_DATA"] = $this->prepareEntityData();
        $this->arResult["DOCGEN_BUTTON_PARAMS"] = \MyWebstorHmsHelper::getDocumentButtonParameters(
            Appointment::class,
            $this->arResult["ID"] ?: null
        );
        $this->arResult["TABS_CONFIG"] = $this->prepareTabsConfig();
        $this->setHeader();
        $this->arResult["ENTITY_CONTROLLERS"] = $this->prepareEntityControllers();
        $this->arResult["COMPONENT_AJAX_DATA"] = $this->prepareAjaxData();
    }

    protected function prepareEntityFields() {
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        return array_filter(array(
            array(
                "entity" => "appointment",
                "name" => "TITLE",
                "originalName" => "TITLE",
                "title" => AppointmentTable::getMap("TITLE")->getTitle(),
                "type" => "text",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "DATE_CREATE",
                "originalName" => "DATE_CREATE",
                "title" => AppointmentTable::getMap("DATE_CREATE")->getTitle(),
                "type" => "datetime",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "STATUS_ID",
                "title" => AppointmentTable::getMap("STATUS_ID")->getTitle(),
                "type" => "list",
                "editable" => true,
                "enableAttributes" => false,
                "mergeable" => false,
                "data" => array(
                    "items" => \CCrmInstantEditorHelper::PrepareListOptions(
                        \CCrmStatus::GetStatusList("HMS_APPOINTMENT_STATUS")
                    )
                ),
            ),
            array(
                "entity" => "appointment",
                "name" => "CLINIC_ID",
                "originalName" => "CLINIC_ID",
                "title" => AppointmentTable::getMap("CLINIC")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-clinic",
                    "tagSelectorID" => "CLINIC_ID",
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "DOCTOR_ID",
                "originalName" => "DOCTOR_ID",
                "title" => AppointmentTable::getMap("DOCTOR")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-doctor",
                    "tagSelectorID" => "DOCTOR_ID",
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "OFFICE_ID",
                "originalName" => "OFFICE_ID",
                "title" => AppointmentTable::getMap("OFFICE")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-office",
                    "tagSelectorID" => "OFFICE_ID",
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "SPECIALIZATION_ID",
                "originalName" => "SPECIALIZATION_ID",
                "title" => AppointmentTable::getMap("SPECIALIZATION")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-specialization",
                    "tagSelectorID" => "SPECIALIZATION_ID",
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "DATE_FROM",
                "originalName" => "DATE_FROM",
                "title" => AppointmentTable::getMap("DATE_FROM")->getTitle(),
                "type" => "datetime",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "DURATION",
                "originalName" => "DURATION",
                "title" => AppointmentTable::getMap("DURATION")->getTitle(),
                "type" => "custom",
                "data" => array(
                    "view" => "DURATION[VIEW]",
                    "edit" => "DURATION[EDIT]"
                ),
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ),
            !$isNew ? array(
                "entity" => "appointment",
                "name" => "DATE_TO",
                "originalName" => "DATE_TO",
                "title" => AppointmentTable::getMap("DATE_TO")->getTitle(),
                "type" => "datetime",
                "editable" => false,
                "required" => false,
                "optionFlags" => 1,
            ) : null,
            array(
                "entity" => "appointment",
                "name" => "PATIENT",
                "originalName" => "PATIENT",
                "title" => AppointmentTable::getMap("CONTACT")->getTitle(),
                "type" => "patient",
                "data" => array(
                    "contactLegend" => Loc::getMessage("HMS_APPOINTMENT_PATIENT_CONTACT_LEGEND"),
                    "categoryParams" => array(
                        \CCrmOwnerType::Contact => array(
                            "categoryId" => "0"
                        ),
                        \CCrmOwnerType::Company => array(
                            "categoryId" => "0"
                        )
                    ),
                    "clientEditorFieldsParams" => array(
                        "COMPANY" => array(),
                        "CONTACT" => array()
                    ),
                    "compound" => array(
                        array(
                            "name" => "CONTACT_IDS",
                            "type" => "multiple_contact",
                            "entityTypeName" => "CONTACT",
                            "tagName" => "CONTACT"
                        )
                    ),
                    "fixedLayoutType" => "CONTACT",
                    "info" => "CLIENT_INFO",
                    "lastContactInfos" => "LAST_CONTACT_INFOS",
                    "loaders" => array(
                        "primary" => array(
                            "CONTACT" => array(
                                "action" => "GET_CLIENT_INFO",
                                "url" => "/bitrix/components/bitrix/crm.contact.show/ajax.php?" . bitrix_sessid_get()
                            )
                        )
                    ),
                    "map" => array(
                        "data" => "CLIENT_DATA"
                    ),
                ),
                "editable" => true,
                "required" => true,
                "optionFlags" => 1
            ),
            array(
                "entity" => "appointment",
                "name" => "COMMENTS",
                "originalName" => "COMMENTS",
                "title" => AppointmentTable::getMap("COMMENTS")->getTitle(),
                "type" => "bb",
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "ASSIGNED_BY_ID",
                "originalName" => "ASSIGNED_BY_ID",
                "title" => AppointmentTable::getMap("ASSIGNED_BY_ID")->getTitle(),
                "type" => "assignedBy",
                "data" => array(
                    "enableEditInView" => true,
                    "formated" => "ASSIGNED_BY_FORMATTED_NAME",
                    "position" => "ASSIGNED_BY_WORK_POSITION",
                    "photoUrl" => "ASSIGNED_BY_PHOTO_URL",
                    "showUrl" => "PATH_TO_ASSIGNED_BY_USER",
                    "pathToProfile" => "/company/personal/user/#user_id#/",
                ),
                "editable" => true,
                "required" => false,
                "enableAttributes" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "RESERVE_DOCTOR",
                "originalName" => "RESERVE_DOCTOR",
                "title" => AppointmentTable::getMap("RESERVE_DOCTOR")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-doctor",
                    "tagSelectorID" => "RESERVE_DOCTOR",
                    "multiple" => true
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "RESERVE_OFFICE",
                "originalName" => "RESERVE_OFFICE",
                "title" => AppointmentTable::getMap("RESERVE_OFFICE")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-office",
                    "tagSelectorID" => "RESERVE_OFFICE",
                    "multiple" => true
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "RESERVE_SPECIALIZATION",
                "originalName" => "RESERVE_SPECIALIZATION",
                "title" => AppointmentTable::getMap("RESERVE_SPECIALIZATION")->getTitle(),
                "type" => "entitySelector",
                "data" => array(
                    "entity" => "hms-specialization",
                    "tagSelectorID" => "RESERVE_SPECIALIZATION",
                    "multiple" => true
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            ),
            array(
                "entity" => "appointment",
                "name" => "RESERVE_DATE",
                "originalName" => "RESERVE_DATE",
                "title" => AppointmentTable::getMap("RESERVE_DATE")->getTitle(),
                "type" => "multidatetimerange",
                "data" => array(
                    "enableTime" => false
                ),
                "editable" => true,
                "required" => false,
                "optionFlags" => 1,
            )
        ));
    }

    protected function prepareEntityConfig() {
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        return array(
            array(
                "name" => "left",
                "type" => "column",
                "data" => array(
                    // "width" => 30
                    "width" => 100
                ),
                "elements" => array(
                    array(
                        "name" => "main",
                        "title" => Loc::getMessage("HMS_APPOINTMENT_ENTITY_SECTION_MAIN"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                        ),
                        "elements" => array(
                            array(
                                "name" => "RECEIVE_CONTROLLER"
                            ),
                            array(
                                "name" => "TITLE"
                            ),
                            array(
                                "name" => "DATE_CREATE"
                            ),
                            array(
                                "name" => "STATUS_ID"
                            ),
                            array(
                                "name" => "PATIENT"
                            ),
                            array(
                                "name" => "CLINIC_ID"
                            ),
                            array(
                                "name" => "DOCTOR_ID"
                            ),
                            array(
                                "name" => "OFFICE_ID"
                            ),
                            array(
                                "name" => "SPECIALIZATION_ID"
                            ),
                            array(
                                "name" => "DATE_FROM"
                            ),
                            array(
                                "name" => "DATE_TO"
                            ),
                            array(
                                "name" => "DURATION"
                            ),
                            array(
                                "name" => "COMMENTS"
                            ),
                            array(
                                "name" => "ASSIGNED_BY_ID"
                            ),
                        )
                    ),
                    array(
                        "name" => "reserve",
                        "title" => Loc::getMessage("HMS_APPOINTMENT_ENTITY_SECTION_RESERVE"),
                        "type" => "section",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                        ),
                        "elements" => array(
                            array(
                                "name" => "RESERVE_DATE"
                            ),
                            array(
                                "name" => "RESERVE_DOCTOR"
                            ),
                            array(
                                "name" => "RESERVE_OFFICE"
                            ),
                            array(
                                "name" => "RESERVE_SPECIALIZATION"
                            ),
                        )
                    ),
                ),
            ),
            /*array(
                "name" => "right",
                "type" => "column",
                "data" => array(
                    "width" => 70
                ),
                "elements" => array(
                    array(
                        "name" => "services",
                        "title" => Loc::getMessage("HMS_APPOINTMENT_ENTITY_SECTION_SERVICES"),
                        "type" => "included_area",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                            "type" => "component",
                            "componentName" => "mywebstor:hms.entity.product.list",
                            "action" => "getProductGrid",
                            "mode" => "ajax",
                            "dataName" => "PRODUCT_LIST_DATA",
                            "signedParametersName" => "PRODUCT_LIST_SIGNED_PARAMETERS"
                        ),
                    ),
                    array(
                        "name" => "vhi",
                        "title" => Loc::getMessage("HMS_APPOINTMENT_ENTITY_SECTION_VHI"),
                        "type" => "included_area",
                        "data" => array(
                            "isRemovable" => false,
                            "isChangeable" => false,
                            "type" => "component",
                            "mode" => "ajax",
                            "componentName" => "mywebstor:hms.vhi.appointment",
                            "action" => "getVhiClientInfo",
                            "dataName" => "VHI_CLIENT_INFO"
                        ),
                    ),
                )
            )*/
        );
    }

    protected function prepareEntityConfigOptions() {
        return array(
            "enableQuickEdit" => "N"
        );
    }

    protected function prepareEntityData() {
        $result = array();

        $appointmentID = $this->arResult["ID"];
        $appointment = array();
        if ($appointmentID >= 0) {
            /** @var \Bitrix\Main\ORM\Objectify\EntityObject|null $appointmentObject */
            $appointmentObject = AppointmentTable::getList(array(
                "filter" => array(
                    "ID" => $appointmentID
                ),
                "order" => array(
                    "ID" => "DESC",
                    "CONTACT_BINDINGS.SORT" => "ASC"
                ),
            ))->fetchObject();
            if (!$appointmentObject)
                $appointmentObject = AppointmentTable::createObject();

            $appointmentObject->fill();

            $doctorObject = $appointmentObject
                ->getDoctor();

            if ($doctorObject)
                $doctorObject->fill(\Bitrix\Main\ORM\Fields\FieldTypeMask::EXPRESSION);

            $result["EDIT_FIELDS"] = $this->prepareFromRequest($appointmentObject);

            $appointment = array_map(function ($value) {
                if ($value instanceof \Bitrix\Main\Type\Date)
                    return $value->format($value->getFormat());
                return $value;
            }, $appointmentObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            ));
        }

        foreach ($this->arResult["ENTITY_FIELDS"] as $entityField) {
            $entityKey = $entityField["name"];
            $result[$entityKey] = $appointment[$entityKey] ?: "";
            switch ($entityKey) {
                case "STATUS_ID":
                    $result[$entityKey] = $appointment["REAL_STATUS_ID"] ?: "";
                    break;
                case "PATIENT":
                    $clientInfo = array(
                        "CONTACT_DATA" => array()
                    );
                    $contactBindingsCollection = $appointmentObject->getContactBindings();
                    if (!$contactBindingsCollection || $contactBindingsCollection->isEmpty()) break;

                    $appointment["CONTACT_BINDINGS"] = array_map(function ($contactBindingsObject) {
                        /** @var EO_AppointmentContact $contactBindingsObject */
                        return $contactBindingsObject->collectValues(
                            Values::ALL,
                            FieldTypeMask::FLAT,
                            true
                        );
                    }, $contactBindingsCollection->getAll());
                    foreach ($contactBindingsCollection->getAll() as $contactIndex => $contactBindingObject) {
                        $contactObject = $contactBindingObject->state === State::RAW ?
                            ContactTable::getById($contactBindingObject->getContactId())->fetchObject()
                            : $contactBindingObject->fillContact();
                        if (!$contactObject) continue;

                        $contactID = $contactObject->getId();
                        $isEntityReadPermitted = \CCrmContact::CheckReadPermission($contactID);
                        $contactData = \CCrmEntitySelectorHelper::PrepareEntityInfo(
                            \CCrmOwnerType::ContactName,
                            $contactID,
                            array(
                                "ENTITY_EDITOR_FORMAT" => true,
                                "IS_HIDDEN" => !$isEntityReadPermitted,
                                "USER_PERMISSIONS" => \CCrmPerms::GetCurrentUserPermissions(),
                                "REQUIRE_REQUISITE_DATA" => true,
                                "REQUIRE_EDIT_REQUISITE_DATA" => ($contactIndex === 0),
                                "REQUIRE_MULTIFIELDS" => true,
                                "NORMALIZE_MULTIFIELDS" => true,
                                "REQUIRE_BINDINGS" => true,
                                "NAME_TEMPLATE" => \Bitrix\Crm\Format\PersonNameFormatter::getFormat(),
                            )
                        );

                        if (($contactBirthdate = $contactObject->getBirthdate())) {
                            $birthdateString = $contactBirthdate->toString();
                            $today = new Date();
                            $diff = $today->getDiff($contactBirthdate);
                            $dateWithoutYears = clone $contactBirthdate;
                            $dateWithoutYears->add("P" . $diff->y . "Y");

                            $birthdateString .=
                                " (" .
                                join(" ", array_values(array_filter(array(
                                    FormatDate("Ydiff", $contactBirthdate->getTimestamp()),
                                    $diff->m ? strtolower(FormatDate("mdiff", $dateWithoutYears->getTimestamp())) : null
                                )))) .
                                ")";

                            $contactData["advancedInfo"]["multiFields"][] = array(
                                "ID" => 0,
                                "ENTITY_ID" => 0,
                                "ENTITY_TYPE_ID" => "CONTACT",
                                "TYPE_ID" => "BIRTHDATE",
                                "VALUE_TYPE" => "WORK",
                                "VALUE" => $contactBirthdate->toString(),
                                "VALUE_EXTRA" => array(),
                                "VALUE_FORMATTED" => $birthdateString,
                                "COMPLEX_ID" => "BIRTHDATE_WORK",
                                "COMPLEX_NAME" => "",
                                "TITLE" => "",
                            );
                        }

                        $clientInfo["CONTACT_DATA"][] = $contactData;
                    }

                    $result["CLIENT_INFO"] = $clientInfo;
                    break;
                case "DURATION":
                    if ($entityField["type"] != "custom") break;

                    $duration = $appointment["DURATION"] ?: null;
                    if ($appointmentObject->state === State::RAW && !$duration)
                        $duration = 5;

                    $result["DURATION[VIEW]"] = null;
                    $result["DURATION[EDIT]"] = $this->getDurationEditField(5);
                    if (!$duration) break;

                    $result["DURATION[VIEW]"] = "<div class='ui-entity-editor-content-block-number'>$duration</div>";
                    $result["DURATION[EDIT]"] = $this->getDurationEditField($duration);
                    break;
                case "COMMENTS":
                    $result[$entityKey . "_HTML"] = TextHelper::convertBbCodeToHtml($result[$entityKey]);
                    break;
                case "ASSIGNED_BY_ID":
                    $assignedByID = $appointmentObject->getAssignedById();
                    $assignedBy = UserTable::getById($assignedByID)->fetchObject();
                    if (!$assignedBy) break;

                    $result["ASSIGNED_BY_FORMATTED_NAME"] = join(" ", array_filter(array($assignedBy->fillName(), $assignedBy->fillLastName())));
                    $result["ASSIGNED_BY_WORK_POSITION"] = $assignedBy->fillWorkPosition();
                    $result["PATH_TO_ASSIGNED_BY_USER"] = "/company/personal/user/$assignedByID/";
                    if (
                        ($avatarID = $assignedBy->fillPersonalPhoto())
                        && ($avatarFile = \CFile::GetByID($avatarID)->Fetch())
                    )
                        $result["ASSIGNED_BY_PHOTO_URL"] = $avatarFile["SRC"];
                    break;
                case "RESERVE_DOCTOR":
                    $result[$entityKey] = null;

                    $reserveDoctorCollection = $appointmentObject->getReserveDoctor();
                    if (!$reserveDoctorCollection || $reserveDoctorCollection->isEmpty()) break;

                    $result[$entityKey] = array();
                    foreach ($reserveDoctorCollection as $reserveDoctorObject) {
                        $result[$entityKey][] = $reserveDoctorObject->getDoctorId();
                    }
                    break;
                case "RESERVE_OFFICE":
                    $result[$entityKey] = null;

                    $reserveOfficeCollection = $appointmentObject->getReserveOffice();
                    if (!$reserveOfficeCollection || $reserveOfficeCollection->isEmpty()) break;

                    $result[$entityKey] = array();
                    foreach ($reserveOfficeCollection as $reserveOfficeObject) {
                        $result[$entityKey][] = $reserveOfficeObject->getOfficeId();
                    }
                    break;
                case "RESERVE_SPECIALIZATION":
                    $result[$entityKey] = null;

                    $reserveSpecializationCollection = $appointmentObject->getReserveSpecialization();
                    if (!$reserveSpecializationCollection || $reserveSpecializationCollection->isEmpty()) break;

                    $result[$entityKey] = array();
                    foreach ($reserveSpecializationCollection as $reserveSpecializationObject) {
                        $result[$entityKey][] = $reserveSpecializationObject->getSpecializationId();
                    }
                    break;
                case "RESERVE_DATE":
                    $result[$entityKey] = null;

                    foreach ($appointmentObject->getReserveDate() as $reserveDateObject) {
                        $dateFrom = $reserveDateObject->getDateFrom();
                        $dateTo = $reserveDateObject->getDateTo();

                        $reserveDate = array(
                            "DATE" => $dateFrom->format("d.m.Y"),
                            "TIME_FROM" => $dateFrom->format("H:i"),
                            "TIME_TO" => $dateTo->format("H:i")
                        );
                        if ($dateFrom->format("d") != $dateTo->format("d"))
                            $reserveDate["TIME_TO"] = "24:00";

                        $result[$entityKey][] =  $reserveDate;
                    }

                    break;
            }
        }

        $result["PRODUCT_LIST_UNSIGNED_PARAMETERS"] = array(
            "ENTITY_EDITOR_ID" => $this->arResult["GUID"],
            "ENTITY_TYPE_NAME" => "HMS",
            "ENTITY_ID" => $appointmentID,
            "ALLOW_EDIT" => "Y",
            "RESTRICTED_PRODUCT_TYPES" => array(
                // ProductTable::TYPE_PRODUCT,
                ProductTable::TYPE_SET,
                // ProductTable::TYPE_SKU,
                ProductTable::TYPE_OFFER,
                ProductTable::TYPE_FREE_OFFER,
                ProductTable::TYPE_EMPTY_SKU,
            ),
            "DOCTOR_ID" => $result["DOCTOR_ID"],
            "OFFICE_ID" => $result["OFFICE_ID"],
            "ENABLE_TEETH_FIELD" => false
        );
        $result["PRODUCT_LIST_SIGNED_PARAMETERS"] = ParameterSigner::signParameters(
            "mywebstor:hms.entity.product.list",
            $result["PRODUCT_LIST_UNSIGNED_PARAMETERS"]
        );
        $result["PRODUCT_LIST_DATA"] = array(
            "DOCTOR_ID" => $result["DOCTOR_ID"],
            "OFFICE_ID" => $result["OFFICE_ID"]
        );
        $result["CURRENCY_ID"] = "RUB";

        $patient = current($result["CLIENT_INFO"]["CONTACT_DATA"] ?: array());
        $patientID = $patient["id"];
        $result["VHI_CLIENT_INFO"] = array(
            "CONTACT_ID" => 0
        );
        if ($patientID && $patientID > 0)
            $result["VHI_CLIENT_INFO"]["CONTACT_ID"] = $patientID;

        if (
            !$result["BASE_DURATION"]
            || $result["BASE_DURATION"] <= 0
        )
            $result["BASE_DURATION"] = 5;

        $receiveObject = $appointmentObject->getReceive();
        $result["IS_RECEIVE_STARTED"] = isset($receiveObject) && !empty($receiveObject);
        $result["IS_RECEIVE_READ_ONLY"] = $result["IS_RECEIVE_STARTED"] && (bool)$receiveObject->getDateEnd();
        if ($result["IS_RECEIVE_STARTED"]) {
            array_unshift($this->arResult["ENTITY_FIELDS"], array(
                "entity" => "appointment",
                "name" => "RECEIVE_CONTROLLER",
                "originalName" => "RECEIVE_CONTROLLER",
                "title" => "-",
                "type" => "receiveController",
                "editable" => true,
                "required" => true,
                "optionFlags" => 1,
            ));

            $result["RECEIVE_CONTROLLER"] = array(
                "READ_ONLY" => (bool)$receiveObject->getDateEnd()
            );

            $receiveType = \MyWebstorHmsHelper::getReceiveTypes($receiveObject->getType());
            if (!empty($receiveType))
                $result["DISABLE_PRODUCT_LIST"] = $receiveType["disableProductList"];

            $typedReceiveObject = $receiveObject->getTypedReceiveObject(false);
            if (!empty($typedReceiveObject))
                $result["TYPED_RECEIVE"] = $typedReceiveObject->collectValues();
        }

        $result["CAN_RECEIVE_START"] = $this->arResult["ID"] && $this->arResult["ID"] > 0 && !$result["IS_RECEIVE_STARTED"];

        return $result;
    }

    protected function prepareTabsConfig() {
        $isReceiveStarted = $this->arResult["ENTITY_DATA"]["IS_RECEIVE_STARTED"];
        $isReceiveReadOnly = $this->arResult["ENTITY_DATA"]["IS_RECEIVE_READ_ONLY"];
        $menuTabs = array();
        $guid = $this->arResult["GUID"];
        $id = $this->arResult["ID"] ?: "0";
        $tabs = array(
            array(
                "id" => "main",
                "name" => Loc::getMessage("HMS_APPOINTMENT_TAB_MAIN"),
                "active" => !$isReceiveStarted || $isReceiveReadOnly,
            ),
            array(
                "id" => "receive",
                "name" => Loc::getMessage("HMS_APPOINTMENT_TAB_RECEIVE"),
                "enabled" => $isReceiveStarted,
                "loader" => array(
                    "serviceUrl" => "/bitrix/components/mywebstor/hms.appointment.details/receive.ajax.php",
                    "componentData" => array(
                        "id" => $id,
                        "guid" => $this->arResult["GUID"]
                    )
                ),
                "active" => $isReceiveStarted && !$isReceiveReadOnly,
            )
        );

        foreach ($tabs as $tab) {
            $menuTab = array(
                "ID" => $tab["id"],
                "TEXT" => $tab["name"],
                "ON_CLICK" => "BX.onCustomEvent('" . htmlspecialcharsbx(CUtil::JSEscape($guid . "_click_" . $tab["id"])) . "');",
                "IS_ACTIVE" => isset($tab["active"]) && $tab["active"],
                "IS_PASSIVE" => isset($tab["enabled"]) && !$tab["enabled"],
                "IS_LOCKED" => false,
            );

            if (!empty($tab["url"])) {
                $menuTab["URL"] = (string) $tab["url"];
                unset($menuTab["ON_CLICK"]);
            }

            $menuTabs[] = $menuTab;
        }

        return array(
            "TABS" => $tabs,
            "MENU_TABS" => $menuTabs,
            "TAB_CONTAINER_ID" => "{$guid}_tabs",
            "TAB_MENU_CONTAINER_ID" => "{$guid}_tabs_menu"
        );
    }

    protected function prepareFromRequest($appointmentObject) {
        $result = array();

        /** @var \MyWebstor\Hms\EO_Appointment|\Bitrix\Main\ORM\Objectify\EntityObject $appointmentObject */
        $query = $this->request->getPostList()->toArray();
        if (!array_key_exists("EDIT_MODE", $query)) return null;

        foreach ($query as $key => $value) {
            if (
                !$appointmentObject->entity->hasField($key)
                || !$value
            ) continue;

            switch ($key) {
                case "CONTACT_ID":
                    $appointmentContactObject = AppointmentContactTable::createObject();
                    $appointmentContactObject->setContactId($value);
                    $appointmentObject->addToContactBindings($appointmentContactObject);
                    $appointmentContactObject->unsetAppointment();
                    break;
                case "RESERVE_DOCTOR":
                    if (!is_array($value) || !count($value)) break;

                    $appointmentObject->removeAllReserveDoctor();
                    foreach ($value as $doctorID) {
                        if (!$doctorID) continue;

                        $reserveDoctorObject = AppointmentReserveDoctorTable::createObject();
                        $reserveDoctorObject
                            ->setDoctorId($doctorID);

                        $appointmentObject->addToReserveDoctor($reserveDoctorObject);
                    }
                    break;
                case "RESERVE_OFFICE":
                    if (!is_array($value) || !count($value)) break;

                    $appointmentObject->removeAllReserveOffice();
                    foreach ($value as $officeID) {
                        if (!$officeID) continue;

                        $reserveOfficeObject = AppointmentReserveOfficeTable::createObject();
                        $reserveOfficeObject
                            ->setOfficeId($officeID);

                        $appointmentObject->addToReserveOffice($reserveOfficeObject);
                    }
                    break;
                case "RESERVE_DATE":
                    if (!is_array($value) || !count($value)) break;

                    $appointmentObject->removeAllReserveDate();
                    foreach ($value as $dateString) {
                        if (!$dateString) continue;

                        $dateFrom = new DateTime($dateString);
                        $dateTo = clone $dateFrom;

                        $dateTo->setTime(0, 0, 0, 0);
                        $dateTo->add("P1D");

                        $reserveDateObject = AppointmentReserveDateTable::createObject();
                        $reserveDateObject
                            ->setId(0)
                            ->setDateFrom($dateFrom)
                            ->setDateTo($dateTo);

                        $reserveDate = array(
                            "DATE" => $dateFrom->format("d.m.Y"),
                            "TIME_FROM" => $dateFrom->format("H:i"),
                            "TIME_TO" => $dateTo->format("H:i")
                        );
                        if ($dateFrom->format("d") != $dateTo->format("d"))
                            $reserveDate["TIME_TO"] = "24:00";

                        $appointmentObject->addToReserveDate($reserveDateObject);
                    }
                    break;
                case "REAL_STATUS_ID":
                    $result["STATUS_ID"] = $appointmentObject->get($key);

                    $appointmentObject->set($key, $value);
                    break;
                default:
                    $result[$key] = $appointmentObject->get($key);

                    $appointmentObject->set($key, $value);
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
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_APPOINTMENT_NEW_APPOINTMENT_TITLE") : $title);
    }

    protected function prepareEntityControllers() {
        $result = array();

        if (Loader::includeModule("currency")) {
            $currencyQuery = CurrencyTable::getList(array(
                "select" => array(
                    "CURRENCY"
                )
            ));
            $currencyQuery->addFetchDataModifier(function ($row) {
                $currencyFormat = \CCurrencyLang::GetFormatDescription($row["CURRENCY"]);
                return array(
                    "CURRENCY" => $row["CURRENCY"],
                    "FORMAT" => array(
                        "FORMAT_STRING" => $currencyFormat["FORMAT_STRING"],
                        "DEC_POINT" => $currencyFormat["DEC_POINT"],
                        "THOUSANDS_SEP" => $currencyFormat["THOUSANDS_SEP"],
                        "DECIMALS" => $currencyFormat["DECIMALS"],
                        "THOUSANDS_VARIANT" => $currencyFormat["THOUSANDS_VARIANT"],
                        "HIDE_ZERO" => $currencyFormat["HIDE_ZERO"]
                    )
                );
            });
            $result[] = array(
                "name" => "PRODUCT_LIST",
                "type" => "product_list",
                "config" => array(
                    "currencyId" => "RUB",
                    "productListId" => "new_system_product_editor",
                    "currencyList" => $currencyQuery->fetchAll()
                )
            );
        }


        return $result;
    }

    protected function prepareAjaxData() {
        return array(
            "COMPONENT_NAME" => $this->getName(),
            "ACTION_NAME" => "save",
            "SIGNED_PARAMETERS" => ParameterSigner::signParameters(
                $this->getName(),
                array(
                    "ID" => $this->arParams["ID"],
                    "SOURCE_TYPE" => $this->request->getPostList()->get("SOURCE_TYPE"),
                    "SOURCE_ID" => $this->request->getPostList()->get("SOURCE_ID")
                )
            ),
            "ADDITIONAL_ACTIONS" => array(
                array(
                    "ID" => "RECEIVE",
                    "ACTION" => "save_receive",
                    "ACTION_TYPE" => "save_receive",

                )
            )
        );
    }

    protected function getDurationEditField($duration = 5) {
        return <<<HTML
<div class='ui-ctl ui-ctl-textbox ui-ctl-duration'>
    <div class='ui-chevron ui-double ui-left'></div>
    <div class='ui-chevron ui-left'></div>
    <input name='DURATION' class='ui-ctl-element' type='number' value='$duration' id='duration_text' readonly>
    <div class='ui-chevron ui-right'></div>
    <div class='ui-chevron ui-double ui-right'></div>
</div>
<script>
    (function() {
        let editor = BX.UI.EntityEditor.defaultInstance;
        if (!editor) return;
        let control = editor.getControlById("DURATION");
        if (!control) return;

        let field = control._innerWrapper;
        let input = field.querySelector("input[name='DURATION']");
        if (!input) return;

        field
            .querySelectorAll(".ui-chevron")
            .forEach((chevron) => {
                let chevronDirection = chevron.classList.contains("ui-left") ? -1 : 1;
                let chevronMultiplier = chevron.classList.contains("ui-double") ? 2 : 1;
                let baseDuration = 5;

                chevron.addEventListener("click", function() {
                    input.value = +input.value + baseDuration * chevronDirection * chevronMultiplier;
                    if (input.value <= 0)
                        input.value = baseDuration;

                    control.markAsChanged();
                });
            });
    })();
</script>
HTML;
    }
}
