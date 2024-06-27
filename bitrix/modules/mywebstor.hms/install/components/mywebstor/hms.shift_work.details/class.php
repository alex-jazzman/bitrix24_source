<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Engine\Response\AjaxJson;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\Schedule\ShiftWorkTable;

Loc::loadMessages(__FILE__);

class HmsShiftWorkDetailsComponent extends \CBitrixComponent implements Controllerable {
    protected $shiftWork;

    public function configureActions() {
        return array();
    }

    public function loadDataAction($shiftWorkID) {
        $this->includeModules();

        $result = array(
            "shiftWork" => $this->loadShiftWork($shiftWorkID)
        );

        return $result;
    }

    protected function loadShiftWork($shiftWorkID) {
        $shiftWorkQuery = ShiftWorkTable::getList(array(
            "filter" => array(
                "ID" => $shiftWorkID
            ),
            "select" => array(
                "ID",
                "TITLE",
                "WORKTIMES"
            )
        ));
        $shiftWorkObject = $shiftWorkQuery->fetchObject();
        $shiftWork = array();

        if (!$shiftWorkObject) return $shiftWork;

        $shiftWork = array(
            "shiftWorkID" => (string)$shiftWorkObject->getId(),
            "title" => $shiftWorkObject->getTitle(),
            "worktimes" => array()
        );

        $shiftWork["worktimes"] = array_map(function ($worktime) {
            return array(
                "from" => $worktime["WORKTIME_FROM"],
                "to" => $worktime["WORKTIME_TO"],
                "color" => $worktime["COLOR"],
                "reason" => $worktime["DESCRIPTION"],
                "breaks" => array_map(function ($break) {
                    $break = array(
                        "from" => $break["FROM"],
                        "to" => $break["TO"],
                        "color" => $break["COLOR"],
                        "reason" => $break["REASON"],
                    );

                    return $break;
                }, $worktime["BREAKS"] ?: array())
            );
        }, $shiftWorkObject->getWorktimes() ?: array());

        return $shiftWork;
    }

    public function saveAction($shiftWorkID = "0", $fields) {
        $this->includeModules();

        $shiftWorkFields = $fields;

        switch (!$shiftWorkID) {
            case true:
                $shiftWorkAdd = ShiftWorkTable::add($shiftWorkFields);
                if (!$shiftWorkAdd->isSuccess())
                    return $this->getAjaxError($shiftWorkAdd->getErrors());

                $shiftWorkID = $shiftWorkAdd->getId();

                return $shiftWorkID;
                break;
            case false:
                $shiftWorkUpdate = ShiftWorkTable::update($shiftWorkID, $shiftWorkFields);
                if (!$shiftWorkUpdate->isSuccess())
                    return $this->getAjaxError($shiftWorkUpdate->getErrors());

                return $shiftWorkID;
                break;
        }
    }

    public function deleteAction($shiftWorkID) {
        $this->includeModules();
        if (!$shiftWorkID)
            return $this->getAjaxError("SHIFT_WORK_ID not found");

        $deleteResult = ShiftWorkTable::delete($shiftWorkID);
        if (!$deleteResult->isSuccess())
            return $this->getAjaxError($deleteResult->getErrors());

        return true;
    }

    protected function includeModules() {
        $modules = array("mywebstor.hms");
        foreach ($modules as $module)
            if (!Loader::includeModule($module))
                throw new SystemException("Module \"$module\" not found");
    }

    protected function getAjaxError($errors) {
        if (!$errors) return null;
        if (!is_array($errors))
            $errors = array(new Error($errors));
        return AjaxJson::createError(new ErrorCollection($errors));
    }

    public function executeComponent() {
        $this->includeModules();
        $this->prepareResult();
        $this->setHeader();

        $this->includeComponentTemplate();
    }

    protected function prepareResult() {
        $shiftWorkID = $this->arResult["ID"] = $this->arParams["ID"];
        if (!$shiftWorkID) return;

        $shiftWorkQuery = ShiftWorkTable::getList(array(
            "filter" => array(
                "ID" => $shiftWorkID
            ),
            "select" => array(
                "TITLE"
            )
        ));
        $this->shiftWork = $shiftWorkQuery->fetch();
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->shiftWork["TITLE"];
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_SHIFT_WORK_NEW_SHIFT_WORK_TITLE") : $title);
    }
}
