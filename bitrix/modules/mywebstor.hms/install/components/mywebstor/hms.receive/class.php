<?

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\ReceiveTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsReceiveComponent extends \CBitrixComponent {
    protected function includeModules() {
        $modules = array("mywebstor.hms");
        foreach ($modules as $module)
            if (!Loader::includeModule($module))
                throw new SystemException("Module \"$module\" not found");
    }

    public function executeComponent() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        $this->includeModules();

        $receiveID = $this->arParams["ID"];
        if (!$receiveID || $receiveID <= 0)
            ShowError("Receive ID not found");

        $receiveObject = ReceiveTable::getById($receiveID)->fetchObject();
        if (!$receiveObject)
            ShowError("Receive not found");
        if (!$receiveObject->getTypedReceiveObject())
            ShowError("Incorrect receive");

        $type = ReceiveTable::getReceiveTypes($receiveObject->getType());
        if (!$type || !($componentName = $type["componentName"]))
            ShowError("Receive type \"$type\" not found");

        $receiveObject->fill(FieldTypeMask::ALL);

        $APPLICATION->IncludeComponent(
            $componentName,
            "",
            array(
                "RECEIVE" => $receiveObject,
                "GUID" => $this->arParams["GUID"]
            )
        );

        return true;
    }
}
