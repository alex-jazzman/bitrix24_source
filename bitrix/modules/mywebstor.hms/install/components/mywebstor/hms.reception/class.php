<?

use Bitrix\Crm\ContactTable;
use Bitrix\Crm\DealTable;
use Bitrix\Crm\FieldMultiTable;
use Bitrix\Crm\LeadTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\StatusTable;
use Bitrix\Iblock\PropertyEnumerationTable;
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Engine\Response\AjaxJson;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Fields\Relations\OneToMany;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use Bitrix\Main\Type\DateTime;
use MyWebstor\Hms\AppointmentTable;
use MyWebstor\Hms\ClinicTable;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\OfficeTable;
use MyWebstor\Hms\Schedule\WorktimeTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsReceptionComponent extends \CBitrixComponent implements Controllerable {
    const ABSENCE_TYPE_LEAVESICK_COLOR = "#f09e7b";
    const ABSENCE_TYPE_LEAVEMATERINITY_COLOR = "#9ec3f1";
    const ABSENCE_TYPE_LEAVEUNPAYED_COLOR = "#a8b7be";
    const ABSENCE_TYPE_OTHER_COLOR = "#a1ddd6";
    const ABSENCE_TYPE_UNKNOWN_COLOR = "#fe3737";
    const ABSENCE_TYPE_VACATION_COLOR = "#c8df78";
    const ABSENCE_TYPE_ASSIGNMENT_COLOR = "#e2a4d7";
    const ABSENCE_TYPE_PERSONAL_COLOR = "#d2d2d2";

    public static function getAbsenceColor($property) {
        if (!$property) return "";

        return constant('self::ABSENCE_TYPE_' . $property["XML_ID"] . '_COLOR') ?: "";
    }

    public function configureActions() {
        return array();
    }

    public function getContactBySourceAction($sourceType, $sourceID, $isCreate = "N") {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         */
        global $APPLICATION, $USER, $DB;

        $this->includeModule();
        $this->prepareReferences();
        if (!$sourceType)
            return array(
                "ERROR" => "Source type not found"
            );
        if (!$sourceID)
            return array(
                "ERROR" => "Source ID not found"
            );
        $isCreate = $isCreate === "Y";

        switch ($sourceType) {
            case \CCrmOwnerType::Lead:
                /** @var \Bitrix\Main\ORM\Objectify\EntityObject|null $leadObject */
                $leadObject = LeadTable::getById($sourceID)->fetchObject();
                if (!$leadObject)
                    return array(
                        "ERROR" => "Lead not found"
                    );

                $leadObject->fill("CONTACT");
                /** @var \Bitrix\Main\ORM\Objectify\EntityObject|null $contactObject */
                $contactObject = $leadObject->get("CONTACT");
                if (isset($contactObject)) return $contactObject->get("ID");

                $contactObject = ContactTable::getList(array(
                    "filter" => array("LEAD_ID" => $sourceID),
                    "select" => array("ID"),
                    "order" => array("ID" => "DESC"),
                    "limit" => 1
                ))->fetchObject();
                if (isset($contactObject)) return $contactObject->get("ID");

                if (!$isCreate) return null;

                $leadObject->fill(array(
                    "NAME",
                    "LAST_NAME",
                    "SECOND_NAME",
                    "FM"
                ));

                /** @var \Bitrix\Main\ORM\Objectify\Collection $leadFmCollection */
                $leadFmCollection = $leadObject->get("FM");

                if (
                    !$leadObject->get("NAME")
                    && !$leadObject->get("LAST_NAME")
                    && !$leadObject->get("SECOND_NAME")
                    && $leadFmCollection->isEmpty()
                ) return null;

                /** @var \Bitrix\Main\ORM\Objectify\EntityObject|null $contactObject */
                $contactObject = ContactTable::createObject();
                $contactObject->set("NAME", $leadObject->get("NAME"));
                $contactObject->set("LAST_NAME", $leadObject->get("LAST_NAME"));
                $contactObject->set("SECOND_NAME", $leadObject->get("SECOND_NAME"));
                foreach ($leadFmCollection->getAll() as $leadFmObject) {
                    $leadFm = $leadFmObject->collectValues(
                        Values::ALL,
                        FieldTypeMask::ALL,
                        true
                    );
                    unset($leadFm["ID"]);
                    unset($leadFm["ELEMENT_ID"]);
                    $leadFm["ENTITY_ID"] = \CCrmOwnerType::ContactName;
                    $contactFmObject = FieldMultiTable::createObject();
                    foreach ($leadFm as $leadFmKey => $leadFmValue) {
                        if (!$contactFmObject->entity->hasField($leadFmKey) || !$leadFmValue) continue;
                        $contactFmObject->set($leadFmKey, $leadFmValue);
                    }
                    $contactObject->addTo("FM", $contactFmObject);
                }
                $contactObject->set("MODIFY_BY_ID", $USER->GetID());
                $contactObject->set("ASSIGNED_BY_ID", $USER->GetID());
                $contactObject->set("LEAD_ID", $sourceID);

                $createResult = $contactObject->save();
                if (!$createResult->isSuccess())
                    return null;

                return $createResult->getId();
                break;
            case \CCrmOwnerType::Deal:
                /** @var \Bitrix\Main\ORM\Objectify\EntityObject $dealObject */
                $dealObject = DealTable::getById($sourceID)->fetchObject();
                if (!$dealObject)
                    return array(
                        "ERROR" => "Deal not found"
                    );

                $dealObject->fill("CONTACT");
                /** @var \Bitrix\Main\ORM\Objectify\EntityObject|null $contactObject */
                $contactObject = $dealObject->get("CONTACT");
                return $contactObject ? $contactObject->get("ID") : null;
                break;
            default:
                return array(
                    "ERROR" => "Source type not supported"
                );
                break;
        }
    }

    public function loadAction($from = "", $to = "", $filters = array()) {
        $this->includeModule();

        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        if (!$from)
            return $this->getAjaxError("Empty date from");
        if (!$to)
            return $this->getAjaxError("Empty date to");
        if (!is_array($filters) || !count($filters))
            return $this->getAjaxError("Emtpy filter");

        $dateFormat = $DB->DateFormatToPHP(\CSite::GetDateFormat('FULL'));

        $dateFrom = new DateTime($from);
        $dateTo = new DateTime($to);

        $filter = array(
            "SCHEDULE.ACTIVE" => "Y",
            ">=WORKTIME_FROM" => $dateFrom,
            "<=WORKTIME_TO" => $dateTo,
        );

        if (is_array($filters["hms-clinic"]) && count($filters["hms-clinic"])) {
            $filter["SCHEDULE.CLINIC_ID"] = $filters["hms-clinic"];
        }
        if (is_array($filters["hms-doctor"]) && count($filters["hms-doctor"])) {
            $filter["DOCTOR_ID"] = $filters["hms-doctor"];
        }
        if (is_array($filters["hms-office"]) && count($filters["hms-office"])) {
            $filter["OFFICE_ID"] = $filters["hms-office"];
        }
        if (is_array($filters["hms-specialization"]) && count($filters["hms-specialization"])) {
            $filter[] = array(
                "LOGIC" => "OR",
                array(
                    "@DOCTOR.SPECIALIZATION.ID" => $filters["hms-specialization"]
                ),
                array(
                    "@OFFICE.SPECIALIZATION.ID" => $filters["hms-specialization"]
                )
            );
        }

        $worktimeQuery = WorktimeTable::getList(array(
            "filter" => $filter,
            "select" => array(
                "*",
                "SCHEDULE"
            )
        ));

        $worktimeCollection = $worktimeQuery->fetchCollection();
        $worktimes = array();

        foreach ($worktimeCollection as $worktimeObject) {
            if (!$worktimeObject->getSchedule()) continue;

            $worktime = array(
                "id" => (string)$worktimeObject->getId(),
                "clinicID" => (string)$worktimeObject->getSchedule()->getClinicId(),
                "doctorID" => (string)$worktimeObject->getDoctorId(),
                "officeID" => (string)$worktimeObject->getOfficeId(),
                "from" => $worktimeObject->getWorktimeFrom()->format('Y-m-d\TH:i:s'),
                "to" => $worktimeObject->getWorktimeTo()->format('Y-m-d\TH:i:s'),
                "color" => $worktimeObject->getColor(),
                "reason" => $worktimeObject->getDescription(),
                "breaks" => array()
            );
            $breaks = $worktimeObject->getBreaks() ?: array();
            $worktime["breaks"] = array_map(function ($break) {
                return array(
                    "from" => $break["FROM"],
                    "to" => $break["TO"],
                    "color" => $break["COLOR"],
                    "reason" => $break["REASON"],
                );
            }, $breaks);

            $worktimes[] = $worktime;
        }

        $filters["from"] = $dateFrom->format("Y-m-d\TH:i:s");
        $filters["to"] = $dateTo->format("Y-m-d\TH:i:s");

        \CUserOptions::SetOption("mywebstor.hms", "reception_filters", serialize($filters));

        $filters = array(
            array(
                "LOGIC" => "OR",
                "DOCTOR_ID" => array_unique(array_filter(array_map(function ($worktime) {
                    return $worktime["doctorID"];
                }, $worktimes))),
                "OFFICE_ID" => array_unique(array_filter(array_map(function ($worktime) {
                    return $worktime["officeID"];
                }, $worktimes)))
            ),
        );

        // $absences = \CIntranetUtils::GetAbsenceData(array(
        //     "DATE_START" => $dateFrom->format($dateFormat),
        //     "DATE_FINISH" => $dateTo->format($dateFormat)
        // ), BX_INTRANET_ABSENCE_ALL);
        $absences = \MyWebstorHmsHelper::getAbsencesWithoutTimezone(array(
            "DATE_START" => $dateFrom->format($dateFormat),
            "DATE_FINISH" => $dateTo->format($dateFormat)
        ));

        foreach ($absences as $userID => $absenceArray) {
            $absences[$userID] = array_map(function ($absence) {
                $absenceTypeProperty = PropertyEnumerationTable::getList(array(
                    "filter" => array(
                        "PROPERTY.IBLOCK_ID" => "1",
                        "PROPERTY.CODE" => "ABSENCE_TYPE",
                        "ID" => $absence["PROPERTY_ABSENCE_TYPE_ENUM_ID"]
                    ),
                    "select" => array(
                        "ID",
                        "XML_ID"
                    )
                ))->fetch();

                return array(
                    "doctorID" => $absence["USER_ID"],
                    "isFullDay" => $absence["DATE_FROM"] == $absence["DATE_TO"],
                    "from" => (new DateTime($absence["DATE_FROM"]))->format('Y-m-d\TH:i:s'),
                    "to" => (new DateTime($absence["DATE_TO"]))->format('Y-m-d\TH:i:s'),
                    "color" => static::getAbsenceColor($absenceTypeProperty),
                    "reason" => $absence["NAME"] ?: Loc::getMessage("HMS_RECEPTION_REASON_NO_REASON")
                );
            }, $absenceArray);
        }

        $result = array(
            "worktimes" => $worktimes,
            "appointments" => $this->loadAppointment($dateFrom, $dateTo, $filters),
            "absences" => $absences
        );

        return $result;
    }

    public function loadData($context = null) {
        $this->includeModule();

        $filters = unserialize(\CUserOptions::GetOption("mywebstor.hms", "reception_filters", "a:0:{}"));

        $result = array(
            "hms-clinic" => $this->loadClinics(),
            "hms-office" => $this->loadOffices(),
            "hms-doctor" => $this->loadDoctors(),
            "statuses" => $this->loadStatuses(),
            "mode" => $filters["mode"] ?? "D",
            "step" => (int)$filters["step"] ?? 30,
            "sourceType" => $context["SOURCE_TYPE"] ?: null,
            "sourceID" => $context["SOURCE_ID"] ?: null,
            "contactID" => $this->getContactByContext($context),
        );
        unset($filters["mode"]);
        unset($filters["step"]);
        $result["filters"] = $filters;

        $event = new Event(
            "mywebstor.hms",
            "onHmsReceptionComponentLoadData",
            array(
                "data" => $result,
                "context" => $context
            )
        );
        $event->send();
        foreach ($event->getResults() as $eventResult) {
            if (
                $eventResult->getType() !== EventResult::SUCCESS
                || empty(($parameters = $eventResult->getParameters()))
            ) continue;

            $result = $parameters;
        }

        return $result;
    }

    protected function getContactByContext($context) {
        if (!$context) return null;

        list("SOURCE_TYPE" => $sourceType, "SOURCE_ID" => $sourceID) = $context;
        if (!$sourceType || !in_array($sourceType, array(\CCrmOwnerType::Lead, \CCrmOwnerType::Deal))) return null;

        $container = Container::getInstance();
        $factory = $container->getFactory($sourceType);
        if (!$factory) return null;

        /** @var \Bitrix\Crm\Item\Lead|\Bitrix\Crm\Item\Deal $item */
        $item = $factory->getItem($sourceID);
        if (!$item) return null;

        return $item->getContactId() ?: null;
    }

    protected function loadClinics() {
        $clinicsQuery = ClinicTable::getList(array(
            "select" => array(
                "ID",
                "TITLE"
            )
        ));
        $clinicsQuery->addFetchDataModifier(function ($row) {
            return array(
                "title" => $row["TITLE"],
                "value" => $row["ID"]
            );
        });
        return $clinicsQuery->fetchAll();
    }

    protected function loadOffices() {
        $officesQuery = OfficeTable::getList(array(
            "select" => array(
                "ID",
                "TITLE"
            )
        ));
        $officesQuery->addFetchDataModifier(function ($row) {
            return array(
                "title" => $row["TITLE"],
                "value" => $row["ID"]
            );
        });
        return $officesQuery->fetchAll();
    }

    protected function loadDoctors() {
        $doctorsQuery = DoctorTable::getList(array(
            "select" => array(
                "ID",
                "USER_INITIALS"
            )
        ));
        $doctorsQuery->addFetchDataModifier(function ($row) {
            return array(
                "title" => $row["USER_INITIALS"],
                "value" => $row["ID"]
            );
        });
        return $doctorsQuery->fetchAll();
    }

    protected function loadStatuses() {
        $result = array(
            PhaseSemantics::PROCESS => array(),
            PhaseSemantics::SUCCESS => array(),
            PhaseSemantics::FAILURE => array()
        );

        $statusCollection = StatusTable::getList(array(
            "filter" => array(
                "ENTITY_ID" => "HMS_APPOINTMENT_STATUS"
            )
        ))->fetchCollection();
        foreach ($statusCollection as $statusObject) {
            $result[$statusObject->getSemantics()][] = array(
                "name" => $statusObject->getName(),
                "statusId" => $statusObject->getStatusId(),
                "color" => $statusObject->getColor()
            );
        }

        return $result;
    }

    public function loadAppointment($from, $to, $filters = array()) {
        $filter = array_merge(
            array(
                "@STATUS.SEMANTICS" => array(PhaseSemantics::PROCESS, PhaseSemantics::SUCCESS, null),
                ">=DATE_FROM" => $from,
                "<=DATE_TO" => $to,
            ),
            $filters
        );

        $appointmentQuery = AppointmentTable::getList(array(
            "filter" => $filter,
            "select" => array(
                "*",
                "STATUS_SEMANTICS" => "STATUS.SEMANTICS",
                "PATIENT_FIO" => "CONTACT.INITIALS",
                "DATE_TO",
                "PHONE_NUMBER" => "CONTACT.PHONE",
                "CONTACT_ID"
            )
        ));
        $appointmentQuery->addFetchDataModifier(function ($row) {
            $newRow = array(
                "id" => $row["ID"],
                "title" => $row["TITLE"],
                "clinicID" => $row["CLINIC_ID"] ?: "0",
                "doctorID" => $row["DOCTOR_ID"] ?: "0",
                "officeID" => $row["OFFICE_ID"] ?: "0",
                "patient" => $row["PATIENT_FIO"],
                "contactId" => $row["CONTACT_ID"],
                "duration" => $row["DURATION"],
                "from" => $row["DATE_FROM"]->format('Y-m-d\TH:i:s'),
                "to" => $row["DATE_TO"]->format('Y-m-d\TH:i:s'),
                "semantics" => $row["STATUS_SEMANTICS"],
                "phoneNumber" => $row["PHONE_NUMBER"],
            );

            return $newRow;
        });

        return $appointmentQuery->fetchAll();
    }

    public function getReservesAction($dateFrom, $clinicID, $doctorID = "", $officeID = "", $getCount = "N") {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        $this->includeModule();

        $dateFormat = $DB->DateFormatToPHP(\CSite::GetDateFormat('FULL'));
        $dateFrom = new DateTime($dateFrom);
        $clinicObject = ClinicTable::getById($clinicID)->fetchObject();
        if (!$clinicObject)
            return $this->getAjaxError("Clinic not found");

        $worktimeQuery = WorktimeTable::query();
        $worktimeQuery
            ->setSelect(array("*"));
        $worktimeCondition = new ConditionTree;
        $worktimeCondition->logic(ConditionTree::LOGIC_OR);
        if (isset($doctorID) && !empty($doctorID))
            $worktimeCondition->where("DOCTOR_ID", $doctorID);
        if (isset($officeID) && !empty($officeID))
            $worktimeCondition->where("OFFICE_ID", $officeID);
        $worktimeQuery
            ->where("SCHEDULE.CLINIC_ID", $clinicID)
            ->where("SCHEDULE.ACTIVE", "Y")
            ->where("WORKTIME_FROM", "<=", $dateFrom)
            ->where("WORKTIME_TO", ">=", $dateFrom)
            ->where($worktimeCondition);
        $worktimeCollection = $worktimeQuery->fetchCollection();
        if ($worktimeCollection->count() > 1)
            return $this->getAjaxError("Worktime count error");
        $worktimeObject = $worktimeCollection->current();

        $reserveQuery = AppointmentTable::query();
        $reserveQuery
            ->registerRuntimeField(
                new ExpressionField(
                    "IS_RESERVE_FIELD_EMPTY",
                    "(" .
                        AppointmentTable::query()
                        ->setCustomBaseTableAlias("appointment_subquery")
                        ->setSelect(
                            array(
                                new ExpressionField(
                                    "IS_RESERVE_FIELD_EMPTY",
                                    "(COUNT(%s) + COUNT(%s) + COUNT(%s) = 0)",
                                    array(
                                        "RESERVE_DOCTOR.DOCTOR_ID",
                                        "RESERVE_OFFICE.OFFICE_ID",
                                        "RESERVE_SPECIALIZATION.SPECIALIZATION_ID"
                                    )
                                )
                            )
                        )
                        ->setFilter(array("ID" => new SqlExpression("%s")))
                        ->getQuery()
                        . ")",
                    array(
                        "ID"
                    )
                )
            );
        $reserveQuery
            ->where("DURATION", ">", 0)
            ->where("STATUS_ID", AppointmentTable::STATUS_RESERVE);
        $reserveCondition = new ConditionTree;
        $reserveCondition
            ->logic(ConditionTree::LOGIC_OR)
            ->where("IS_RESERVE_FIELD_EMPTY", "1");
        if (isset($doctorID) && !empty($doctorID))
            $reserveCondition
                ->where("RESERVE_DOCTOR.DOCTOR_ID", $doctorID)
                ->whereIn(
                    "RESERVE_SPECIALIZATION.SPECIALIZATION_ID",
                    DoctorTable::query()
                        ->setCustomBaseTableAlias("doctor_subquery")
                        ->setSelect(array("SPECIALIZATION.ID"))
                        ->setFilter(array("ID" => $doctorID))
                );
        if (isset($officeID) && !empty($officeID))
            $reserveCondition
                ->where("RESERVE_OFFICE.OFFICE_ID", $officeID)
                ->whereIn(
                    "RESERVE_SPECIALIZATION.SPECIALIZATION_ID",
                    OfficeTable::query()
                        ->setCustomBaseTableAlias("office_subquery")
                        ->setSelect(array("SPECIALIZATION.ID"))
                        ->setFilter(array("ID" => $officeID))
                );
        $reserveQuery
            ->where($reserveCondition)
            ->setSelect(array(
                "*",
                "CONTACT",
                "CONTACT.ID",
                "CONTACT.INITIALS",
                "CONTACT.PHONE",
                "RESERVE_DOCTOR.DOCTOR_ID",
                "RESERVE_OFFICE.OFFICE_ID",
                "RESERVE_SPECIALIZATION.SPECIALIZATION_ID",
                "RESERVE_DATE"
            ));

        if ($getCount === "Y") {
            $reserveQuery
                ->setSelect(array(
                    new ExpressionField(
                        "COUNT",
                        "COUNT(%s)",
                        "ID"
                    )
                ))
                ->setGroup("ID");

            return (int)$reserveQuery->queryCountTotal();
        }

        $reserveCollection = $reserveQuery->fetchCollection();
        $reserves = array();

        foreach ($reserveCollection as $reserveObject) {
            $reserveFrom = clone $dateFrom;
            $reserveTo = clone $reserveFrom;
            $reserveTo->add("T" . $reserveObject->getDuration() . "M");

            if (
                !($worktimeObject->getWorktimeFrom()->getTimestamp() <= $reserveFrom->getTimestamp()
                    && $worktimeObject->getWorktimeTo()->getTimestamp() >= $reserveTo->getTimestamp())
            ) continue;

            foreach ($worktimeObject->getBreaks() as $break) {
                $breakFrom = new DateTime($worktimeObject->getWorktimeFrom()->format("d.m.Y") . " " . $break["FROM"]);
                $breakTo = new DateTime($worktimeObject->getWorktimeTo()->format("d.m.Y") . " " . $break["TO"]);

                if (
                    $reserveFrom->getTimestamp() < $breakTo->getTimestamp()
                    && $reserveTo->getTimestamp() > $breakFrom->getTimestamp()
                ) continue 2;
            }

            $reserveDates = $reserveObject->getReserveDate();
            if ($reserveDates && !$reserveDates->isEmpty()) {
                $hasReserveDate = false;

                foreach ($reserveDates as $reserveDate) {
                    $reserveDateFrom = $reserveDate->getDateFrom();
                    $reserveDateTo = $reserveDate->getDateTo();

                    if (
                        $reserveDateFrom->getTimestamp() <= $reserveFrom->getTimestamp()
                        && $reserveDateTo->getTimestamp() >= $reserveTo->getTimestamp()
                    ) $hasReserveDate = true;
                }

                if (!$hasReserveDate) continue;
            }

            $appointmentQuery = AppointmentTable::query();
            $appointmentQuery
                ->whereNot("STATUS_ID", AppointmentTable::STATUS_RESERVE)
                ->whereNot("STATUS.SEMANTICS", PhaseSemantics::FAILURE)
                ->where("DATE_TO", ">", $reserveFrom)
                ->where("DATE_FROM", "<", $reserveTo);
            $appointmentCondition = new ConditionTree;
            $appointmentCondition->logic(ConditionTree::LOGIC_OR);
            if (isset($doctorID) && !empty($doctorID))
                $appointmentCondition->where("DOCTOR_ID", $doctorID);
            if (isset($officeID) && !empty($officeID))
                $appointmentCondition->where("OFFICE_ID", $officeID);
            $appointmentQuery->where($appointmentCondition);

            $appointmentCount = $appointmentQuery->queryCountTotal();
            if ($appointmentCount > 0) continue;

            $absences = \MyWebstorHmsHelper::getAbsencesWithoutTimezone(array(
                "DATE_START" => $dateFrom->format($dateFormat),
                "DATE_FINISH" => $dateFrom->format($dateFormat)
            ));

            if (isset($doctorID) && !empty($doctorID) && is_array($absences[$doctorID]))
                foreach ($absences[$doctorID] as $absence) {
                    $absenceFrom = new DateTime($absence["DATE_FROM"]);
                    $absenceTo = new DateTime($absence["DATE_TO"]);

                    if (
                        $absenceFrom->getTimestamp() < $reserveTo->getTimestamp()
                        && $absenceTo->getTimestamp() > $reserveFrom->getTimestamp()
                    ) continue 2;
                }


            $reserve = array(
                "id" => $reserveObject->getId(),
                "title" => $reserveObject->getTitle(),
                "patient" => $reserveObject->getContact()->get("INITIALS"),
                "contactId" => $reserveObject->getContact()->getId(),
                "phoneNumber" => $reserveObject->getContact()->getPhone(),
                "duration" => $reserveObject->getDuration()
            );

            $reserves[] = $reserve;
        }

        return $reserves;
    }

    public function moveAction($appointmentID, $clinicID, $officeID = null, $doctorID = null, $date) {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        $this->includeModule();

        $appointmentObject = AppointmentTable::getById($appointmentID)->fetchObject();
        if (!$appointmentObject)
            return $this->getAjaxError("Appointment not found");

        $clinicObject = ClinicTable::getById($clinicID)->fetchObject();
        if (!$clinicObject)
            return $this->getAjaxError("Clinic not found");

        if (!isset($officeID) && !isset($doctorID))
            return $this->getAjaxError("Doctor or Office must be filled");
        if (
            isset($officeID)
            && $officeID > 0
            && !($officeObject = OfficeTable::getById($clinicID)->fetchObject())
        )
            return $this->getAjaxError("Clinic not found");
        if (
            isset($doctorID)
            && $doctorID > 0
            && !($doctorObject = DoctorTable::getById($doctorID)->fetchObject())
        )
            return $this->getAjaxError("Doctor not found");

        $dateFrom = new DateTime($date);

        $appointmentObject
            ->setClinicId($clinicID)
            ->setOfficeId($officeID ?: null)
            ->setDoctorId($doctorID ?: null)
            ->setDateFrom($dateFrom);

        $saveResult = $appointmentObject->save();
        if (!$saveResult->isSuccess())
            return $this->getAjaxError(join(", ", $saveResult->getErrorMessages()));

        return true;
    }

    public function setStatusAction($appointmentID, $statusID) {
        $this->includeModule();

        $appointmentObject = AppointmentTable::getById($appointmentID)->fetchObject();
        if (!$appointmentObject)
            return $this->getAjaxError("Appointment not found");

        $statusObject = StatusTable::getList(array(
            "filter" => array(
                "ENTITY_ID" => "HMS_APPOINTMENT_STATUS",
                "STATUS_ID" => $statusID
            )
        ))->fetchObject();
        if (!$statusObject)
            return $this->getAjaxError("Status not found");

        $appointmentObject
            ->setRealStatusId($statusObject->getStatusId());

        $saveResult = $appointmentObject->save();
        if (!$saveResult->isSuccess())
            return $this->getAjaxError(join(", ", $saveResult->getErrorMessages()));

        return true;
    }

    protected function getAjaxError($errors) {
        if (!$errors) return null;
        if (!is_array($errors))
            $errors = array(new Error($errors));
        return AjaxJson::createError(new ErrorCollection($errors));
    }

    public function executeComponent() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        $APPLICATION->SetTitle(Loc::getMessage("HMS_RECEPTION_TITLE"));

        $this->arResult["DATA"] = $this->loadData(array(
            "SOURCE_TYPE" => $this->arParams["SOURCE_TYPE"],
            "SOURCE_ID" => $this->arParams["SOURCE_ID"]
        ));

        $this->includeComponentTemplate();
    }

    protected function includeModule() {
        $module = "mywebstor.hms";
        if (!Loader::includeModule($module))
            throw new SystemException("Module \"$module\" not found");
    }

    protected function prepareReferences() {
        /** @var \Bitrix\Main\ORM\Entity $fieldMultiEntity */
        $fieldMultiEntity = FieldMultiTable::getEntity();
        $fieldMultiEntity->addField(
            new ReferenceField(
                "LEAD",
                LeadTable::class,
                Join::on("this.ELEMENT_ID", "ref.ID")
                    ->where("this.ENTITY_ID", \CCrmOwnerType::LeadName)
            )
        );
        $fieldMultiEntity->addField(
            new ReferenceField(
                "CONTACT",
                ContactTable::class,
                Join::on("this.ELEMENT_ID", "ref.ID")
                    ->where("this.ENTITY_ID", \CCrmOwnerType::ContactName)
            )
        );

        /** @var \Bitrix\Main\ORM\Entity $leadEntity */
        $leadEntity = LeadTable::getEntity();
        $leadEntity->addField(
            new ReferenceField(
                "CONTACT",
                ContactTable::class,
                Join::on("this.CONTACT_ID", "ref.ID")
            )
        );
        $leadEntity->addField(
            new OneToMany(
                "FM",
                FieldMultiTable::class,
                "LEAD"
            )
        );

        /** @var \Bitrix\Main\ORM\Entity $contactEntity */
        $contactEntity = ContactTable::getEntity();
        $contactEntity->addField(
            new OneToMany(
                "FM",
                FieldMultiTable::class,
                "CONTACT"
            )
        );
    }
}
