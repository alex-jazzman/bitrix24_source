<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Engine\Response\AjaxJson;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\Schedule\FillingMethodTable;
use MyWebstor\HMS\Schedule\ShiftWorkTable;

Loc::loadMessages(__FILE__);

class HmsFillingMethodDetailsComponent extends \CBitrixComponent implements Controllerable {
    protected $fillingMethod;

    public function configureActions() {
        return array();
    }

    public function loadDataAction($fillingMethodID) {
        $this->includeModules();

        $result = array(
            "fillingMethod" => $this->loadFillingMethod($fillingMethodID)
        );

        return $result;
    }

    protected function loadFillingMethod($fillingMethodID) {
        $fillingMethodQuery = FillingMethodTable::getList(array(
            "filter" => array(
                "ID" => $fillingMethodID
            ),
            "select" => array(
                "ID",
                "TITLE",
                "TYPE",
                "SEGMENTS"
            )
        ));
        $fillingMethodObject = $fillingMethodQuery->fetchObject();
        $fillingMethod = array();

        if (!$fillingMethodObject) return $fillingMethod;

        $fillingMethod = array(
            "fillingMethodID" => (string)$fillingMethodObject->getId(),
            "type" => $fillingMethodObject->getType(),
            "title" => $fillingMethodObject->getTitle(),
            "segments" => array_map(function ($segment) {
                $segment = array(
                    "shiftWorkID" => $segment["SHIFT_WORK_ID"],
                    "shiftWork" => array()
                );

                $shiftWorkQuery = ShiftWorkTable::getById($segment["shiftWorkID"] ?: 0);
                $shiftWorkObject = $shiftWorkQuery->fetchObject();

                if (!$shiftWorkObject) return $segment;

                $segment["shiftWork"] = array(
                    "worktimes" => array_map(function ($worktime) {
                        return array(
                            "from" => $worktime["WORKTIME_FROM"],
                            "to" => $worktime["WORKTIME_TO"],
                            "color" => $worktime["COLOR"],
                            "reason" => $worktime["DESCRIPTION"],
                            "breaks" => array_map(function ($break) {
                                return array(
                                    "from" => $break["FROM"],
                                    "to" => $break["TO"],
                                    "color" => $break["COLOR"],
                                    "reason" => $break["REASON"],
                                );
                            }, $worktime["BREAKS"] ?: array())
                        );
                    }, $shiftWorkObject->getWorktimes() ?: array())
                );

                return $segment;
            }, $fillingMethodObject->getSegments() ?: array())
        );

        return $fillingMethod;
    }

    public function saveAction($fillingMethodID = "0", $fields) {
        $this->includeModules();

        $fillingMethodFields = $fields;

        switch (!$fillingMethodID) {
            case true:
                $fillingMethodAdd = FillingMethodTable::add($fillingMethodFields);
                if (!$fillingMethodAdd->isSuccess())
                    return $this->getAjaxError($fillingMethodAdd->getErrors());

                $fillingMethodID = $fillingMethodAdd->getId();

                return $fillingMethodID;
                break;
            case false:
                $fillingMethodUpdate = FillingMethodTable::update($fillingMethodID, $fillingMethodFields);
                if (!$fillingMethodUpdate->isSuccess())
                    return $this->getAjaxError($fillingMethodUpdate->getErrors());

                return $fillingMethodID;
                break;
        }
    }

    public function deleteAction($fillingMethodID) {
        $this->includeModules();
        if (!$fillingMethodID)
            return $this->getAjaxError("fillingMethodID not found");

        $deleteResult = FillingMethodTable::delete($fillingMethodID);
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
        $fillingMethodID = $this->arResult["ID"] = $this->arParams["ID"];
        if (!$fillingMethodID) return;

        $fillingMethodQuery = FillingMethodTable::getList(array(
            "filter" => array(
                "ID" => $fillingMethodID
            ),
            "select" => array(
                "TITLE"
            )
        ));
        $this->fillingMethod = $fillingMethodQuery->fetch();
    }

    protected function setHeader() {
        /** @var \CMain $APPLICATION */
        global $APPLICATION;
        $title = $this->fillingMethod["TITLE"];
        $isNew = !$this->arResult["ID"] || $this->arResult["ID"] <= 0;
        $APPLICATION->SetTitle($isNew ? Loc::getMessage("HMS_FILLING_METHOD_NEW_FILLING_METHOD_TITLE") : $title);
    }
}
