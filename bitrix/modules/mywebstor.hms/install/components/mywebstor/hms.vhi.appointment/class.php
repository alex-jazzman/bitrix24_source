<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Crm\ContactTable;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Loader;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\VhiTable;

Loc::loadMessages(__FILE__);

class HmsVhiAppointmentComponent extends \CBitrixComponent {
    /** @var array */
    public $contact;
    /** @var \MyWebstor\Hms\EO_Vhi[] */
    public $vhiArray;

    public function listKeysSignedParameters() {
        return array(
            "CONTACT_ID",
        );
    }

    protected function includeModules() {
        $modules = array("mywebstor.hms");
        foreach ($modules as $module)
            if (!Loader::includeModule($module))
                throw new SystemException("Module \"$module\" not found");
    }

    public function executeComponent() {
        $this->includeModules();

        $contactID = $this->arParams["CONTACT_ID"];
        if (!$contactID)
            return true;

        $contactQuery = ContactTable::query();
        $contactQuery
            ->registerRuntimeField(
                new ExpressionField(
                    "FULL_NAME",
                    "CONCAT_WS(\" \", IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL))",
                    array(
                        "NAME",
                        "NAME",
                        "LAST_NAME",
                        "LAST_NAME"
                    )
                )
            )
            ->setSelect(array("ID", "FULL_NAME"))
            ->where("ID", $contactID);
        $contact = $contactQuery->fetch();
        if (!($this->contact = $contact)) return true;

        $vhiQuery = VhiTable::query();
        $vhiQuery
            ->setSelect(array(
                "ID",
                "NUMBER",
                "DATE_START",
                "DATE_END",
                "CONTACT",
                "VHI_TYPE",
                "VHI_TYPE.SERVICE_TYPE",
                "VHI_TYPE.SERVICE_TYPE.VHI_SERVICE_TYPE",
            ))
            ->setOrder(array("DATE_START" => "ASC"))
            ->where("CONTACT_ID", $contactID)
            ->where("IS_ACTIVE", true);

        $vhiCollection = $vhiQuery->fetchCollection();
        $this->vhiArray = $vhiCollection->getAll();

        $this->includeComponentTemplate();
        return true;
    }
}
