<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Engine\Response\AjaxJson;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Main\Type\Date;
use Bitrix\Main\Type\DateTime;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\OfficeTable;
use MyWebstor\Hms\Schedule\ScheduleTable;
use MyWebstor\Hms\Schedule\WorktimeTable;

Loc::loadMessages(__FILE__);

class HmsScheduleDetailsComponent extends \CBitrixComponent implements Controllerable {
    protected $schedule;

    public function configureActions() {
        return array();
    }

    public function loadAbsencesAction($planDate) {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        $this->includeModule();

        $dateFormat = $DB->DateFormatToPHP(\CSite::GetDateFormat('FULL'));

        $dateFrom = new DateTime($planDate, "Y-m-d\TH:i:s");
        $dateTo = clone $dateFrom;
        $dateTo->add("1M");

        $absences = \CIntranetUtils::GetAbsenceData(array(
            "DATE_START" => $dateFrom->format($dateFormat),
            "DATE_FINISH" => $dateTo->format($dateFormat)
        ), BX_INTRANET_ABSENCE_ALL);
        foreach ($absences as $userID => $absenceArray)
            $absences[$userID] = array_map(function ($absence) {
                return array(
                    "doctorID" => $absence["USER_ID"],
                    "isFullDay" => $absence["DATE_FROM"] == $absence["DATE_TO"],
                    "from" => (new DateTime($absence["DATE_FROM"]))->format('Y-m-d\TH:i:s'),
                    "to" => (new DateTime($absence["DATE_TO"]))->format('Y-m-d\TH:i:s'),
                    "reason" => $absence["NAME"] ?: Loc::getMessage("HMS_SCHEDULE_REASON_NO_REASON")
                );
            }, $absenceArray);

        return $absences;
    }

    public function loadDataAction($scheduleID = 0) {
        $this->includeModule();

        $result = array(
            "schedule" => $this->loadSchedule($scheduleID),
            "participants" => $this->loadParticipants()
        );

        return $result;
    }

    protected function loadSchedule($scheduleID = 0) {
        if (!$scheduleID) return null;

        $scheduleQuery = ScheduleTable::getList(array(
            "filter" => array(
                "ID" => $scheduleID
            ),
            "select" => array(
                "ID",
                "ACTIVE",
                "CLINIC_ID",
                "MODE",
                "PLAN_DATE",
                "NUMBER",
                "PARTICIPANTS",
                "WORKTIME"
            )
        ));

        $scheduleObject = $scheduleQuery->fetchObject();
        $schedule = array(
            "scheduleID" => (string)$scheduleObject->getId(),
            "active" => $scheduleObject->getActive() ? "Y" : "N",
            "clinicID" => (string)$scheduleObject->getClinicId(),
            "mode" => $scheduleObject->getMode(),
            "planDate" => $scheduleObject->getPlanDate()->format('Y-m-d\TH:i:s'),
            "number" => $scheduleObject->getNumber(),
            "currentParticipants" => $scheduleObject->getParticipants(),
            "worktime" => array()
        );

        $worktimeCollection = $scheduleObject->getWorktime();
        if ($worktimeCollection->isEmpty()) return $schedule;

        foreach ($worktimeCollection as $worktimeObject) {
            $worktime = array(
                "id" => (string)$worktimeObject->getId(),
                "doctorID" => (string)$worktimeObject->getDoctorId(),
                "officeID" => (string)$worktimeObject->getOfficeId(),
                "from" => $worktimeObject->getWorktimeFrom()->format('Y-m-d\TH:i:s'),
                "to" => $worktimeObject->getWorktimeTo()->format('Y-m-d\TH:i:s'),
                "color" => $worktimeObject->getColor(),
                "reason" => $worktimeObject->getDescription()
            );
            $breaks = $worktimeObject->getBreaks() ?: array();
            $worktime["breaks"] = array_map(function ($break) {
                $break = array(
                    "from" => $break["FROM"],
                    "to" => $break["TO"],
                    "color" => $break["COLOR"],
                    "reason" => $break["REASON"],
                );

                return $break;
            }, $breaks);

            $schedule["worktime"][] = $worktime;
        }

        return $schedule;
    }

    protected function loadParticipants() {
        $result = array();

        $doctorsQuery = DoctorTable::getList(array(
            "select" => array(
                "ID",
                "USER_TITLE"
            )
        ));
        $doctorsQuery->addFetchDataModifier(function ($row) {
            return array(
                "title" => $row["USER_TITLE"],
                "value" => $row["ID"]
            );
        });
        $result["hms-doctor"] = $doctorsQuery->fetchAll();

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
        $result["hms-office"] = $officesQuery->fetchAll();

        return $result;
    }

    public function saveAction($scheduleID = "0", $fields) {
        /** @var \CDatabase $DB */
        global $DB;
        $this->includeModule();

        $worktimes = $fields["WORKTIME"];
        unset($fields["WORKTIME"]);
        $scheduleFields = $fields;
        $scheduleFields["PLAN_DATE"] = new Date($scheduleFields["PLAN_DATE"]);

        switch (!$scheduleID) {
            case true:
                $DB->StartTransaction();
                $scheduleAdd = ScheduleTable::add($scheduleFields);
                if (!$scheduleAdd->isSuccess()) {
                    $DB->Rollback();
                    return $this->getAjaxError($scheduleAdd->getErrors());
                }
                $scheduleID = $scheduleAdd->getId();
                foreach ($worktimes as $worktimeFields) {
                    $worktimeFields["SCHEDULE_ID"] = $scheduleID;
                    $worktimeFields["WORKTIME_FROM"] = new DateTime($worktimeFields["WORKTIME_FROM"]);
                    $worktimeFields["WORKTIME_TO"] = new DateTime($worktimeFields["WORKTIME_TO"]);

                    $worktimeAdd = WorktimeTable::add($worktimeFields);
                    if (!$worktimeAdd->isSuccess()) {
                        $DB->Rollback();
                        return $this->getAjaxError($worktimeAdd->getErrors());
                    }
                }
                $DB->Commit();
                return $scheduleID;
                break;
            case false:
                $DB->StartTransaction();
                $scheduleUpdate = ScheduleTable::update($scheduleID, $scheduleFields);
                if (!$scheduleUpdate->isSuccess()) {
                    $DB->Rollback();
                    return $this->getAjaxError($scheduleUpdate->getErrors());
                }
                foreach ($worktimes as $worktimeFields) {
                    $worktimeID = $worktimeFields["ID"];
                    $worktimeFields["SCHEDULE_ID"] = $scheduleID;
                    $worktimeFields["WORKTIME_FROM"] = new DateTime($worktimeFields["WORKTIME_FROM"]);
                    $worktimeFields["WORKTIME_TO"] = new DateTime($worktimeFields["WORKTIME_TO"]);
                    unset($worktimeFields["ID"]);

                    if ($worktimeID == "0") {
                        $worktimeAdd = WorktimeTable::add($worktimeFields);
                        if (!$worktimeAdd->isSuccess()) {
                            $DB->Rollback();
                            return $this->getAjaxError($worktimeAdd->getErrors());
                        }
                    } elseif ($worktimeFields["IS_DELETED"] == "Y") {
                        $worktimeDelete = WorktimeTable::delete($worktimeID);
                        if (!$worktimeDelete->isSuccess()) {
                            $DB->Rollback();
                            return $this->getAjaxError($worktimeDelete->getErrors());
                        }
                    }
                }
                $DB->Commit();
                return $scheduleID;
                break;
        }
    }

    public function deleteAction($scheduleID) {
        $this->includeModule();

        if (!$scheduleID)
            return $this->getAjaxError("SCHEDULE_ID not found");

        $scheduleObject = ScheduleTable::wakeUpObject($scheduleID);
        $deleteResult = $scheduleObject->delete();
        if (!$deleteResult->isSuccess())
            return $this->getAjaxError($deleteResult->getErrors());

        return true;
    }

    public function deactivateAction($scheduleID) {
        $this->includeModule();

        if (!$scheduleID)
            return $this->getAjaxError("SCHEDULE_ID not found");

        $updateResult = ScheduleTable::update($scheduleID, array("ACTIVE" => "N"));
        if (!$updateResult->isSuccess())
            return $this->getAjaxError($updateResult->getErrors());

        return true;
    }

    protected function getAjaxError($errors) {
        if (!$errors) return null;
        if (!is_array($errors))
            $errors = array(new Error($errors));
        return AjaxJson::createError(new ErrorCollection($errors));
    }

    protected function includeModule() {
        $module = "mywebstor.hms";
        if (!Loader::includeModule($module))
            throw new SystemException("Module \"$module\" not found");
    }

    public function executeComponent() {
        $this->includeModule();
        $this->prepareResult();
        $this->setHeader();

        $this->includeComponentTemplate();
    }

    protected function prepareResult() {
        $scheduleID = $this->arResult["ID"] = $this->arParams["ID"];
        if (!$scheduleID) return;

        $scheduleQuery = ScheduleTable::getList(array(
            "filter" => array(
                "ID" => $scheduleID
            ),
            "select" => array(
                "ACTIVE",
                "TITLE" => "NUMBER"
            )
        ));
        $this->schedule = $scheduleQuery->fetch();
        $this->arResult["ACTIVE"] = $this->schedule["ACTIVE"];
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->schedule["TITLE"];
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_SCHEDULE_NEW_SCHEDULE_TITLE") : $title);
    }
}
