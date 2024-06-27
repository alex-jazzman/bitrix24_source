<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Crm\ContactTable;
use Bitrix\Main\Loader;
use Bitrix\Main\SystemException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\UI;
use MyWebstor\Hms\VhiTable;

Loc::loadMessages(__FILE__);

class HmsVhiListComponent extends \CBitrixComponent {
    protected $data;
    /** @var \Bitrix\Main\Grid\Options $gridOptions */
    protected $gridOptions;
    /** @var \Bitrix\Main\UI\PageNavigation $nav */
    protected $nav;
    /** @var \Bitrix\Main\UI\Filter\Options $filterOptions */
    protected $filterOptions;
    /** @var \Bitrix\Crm\Contact $contactObject */
    public $contactObject;

    public function listKeysSignedParameters() {
        return array(
            "CONTACT_ID"
        );
    }

    protected function includeModules() {
        $module = "mywebstor.hms";
        if (!Loader::includeModule($module))
            throw new SystemException("Module \"$module\" not found");
    }

    public function executeComponent() {
        try {
            $this->includeModules();
            $this->prepareParams();
            $this->prepareResult();

            $this->includeComponentTemplate();
        } catch (\Exception $e) {
            ShowError($e->getMessage());
            return false;
        }
    }

    protected function prepareParams() {
        $contactID = $this->arParams["CONTACT_ID"];
        if (!$contactID || $contactID < 0)
            throw new SystemException("Contact ID not found");

        $contactQuery = ContactTable::getById($contactID);
        $this->contactObject = $contactQuery->fetchObject();
        if (!$this->contactObject)
            throw new SystemException("Contact #$contactID not found");
    }

    protected function prepareResult() {
        $this->arResult["GRID_ID"] = "hms_vhi";

        $this->arResult["SORT"] = $this->getGridOptions()->getSorting()["sort"];
        $this->arResult["SORT_VARS"] = $this->getGridOptions()->getSorting()["vars"];
        $this->arResult["NAV_OBJECT"] = $this->getNav();
        $this->arResult["PAGE_SIZES"] = array_map(function ($size) {
            return array(
                "NAME" => (string)$size,
                "VALUE" => (string)$size
            );
        }, $this->getNav()->getPageSizes());

        $this->arResult["HEADERS"] = $this->prepareHeaders();
        $this->arResult["ROWS"] = $this->prepareRows();
        $this->arResult["ACTION_PANEL"] = $this->prepareActionPanel();

        $this->arResult["NAME_TEMPLATE"] =
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_VHI_LIST_TITLE");
    }

    protected function getGridOptions() {
        if (!isset($this->gridOptions))
            $this->gridOptions = new \Bitrix\Main\Grid\Options($this->arResult["GRID_ID"]);

        return $this->gridOptions;
    }

    protected function getNav() {
        if (!isset($this->nav)) {
            $this->nav = new UI\PageNavigation($this->arResult["GRID_ID"]);
            $this->nav
                ->allowAllRecords(false)
                ->setPageSizes(array(
                    5,
                    10,
                    20,
                    30,
                    50,
                    100
                ))
                ->setPageSize($this->getGridOptions()->GetNavParams(array("nPageSize" => 5))["nPageSize"])
                ->initFromUri();
        }

        return $this->nav;
    }

    protected function getFilterOptions() {
        if (!isset($this->filterOptions))
            $this->filterOptions = new UI\Filter\Options($this->arResult["GRID_ID"]);

        return $this->filterOptions;
    }

    protected function prepareHeaders() {
        return array(
            array(
                'id' => 'ID',
                'name' => VhiTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'ACTIVE',
                'name' => VhiTable::getMap('ACTIVE')->getTitle(),
                'sort' => 'ACTIVE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'NUMBER',
                'name' => VhiTable::getMap('NUMBER')->getTitle(),
                'sort' => 'NUMBER',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DATE_START',
                'name' => VhiTable::getMap('DATE_START')->getTitle(),
                'sort' => 'DATE_START',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DATE_END',
                'name' => VhiTable::getMap('DATE_END')->getTitle(),
                'sort' => 'DATE_END',
                'default' => true,
                'editable' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $vhiObject) {
            $vhi = $vhiObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $row = array(
                "id" => $vhi["ID"],
                "raw_data" => $vhi,
                "data" => $vhi,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            unset($vhi["ID"]);
            foreach ($vhi as $key => $rawValue) {
                $data = $rawValue ?: "";
                switch ($key) {
                    case "ACTIVE":
                        $columns = $vhiObject->getActive() ? Loc::getMessage("HMS_ANSWER_YES") : Loc::getMessage("HMS_ANSWER_NO");
                        break;
                    default:
                        $columns = $data ?: "-";
                        break;
                }
                $row["data"][$key] = $data;
                $row["columns"][$key] = $columns;
            }
            $row["actions"] = $this->getRowActions($vhiObject);

            $rows[] = $row;
        }
        return $rows;
    }

    protected function prepareActionPanel() {
        return array();
    }

    protected function getData() {
        $vhiQuery = VhiTable::query();
        $vhiQuery
            ->countTotal(true);
        $vhiQuery
            ->setSelect(array(
                "*"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset())
            ->where("CONTACT_ID", $this->contactObject->getId());

        $vhiQuery = $vhiQuery->exec();

        $this->getNav()->setRecordCount($vhiQuery->getCount());

        return $vhiQuery->fetchCollection();
    }

    /**
     * @param \MyWebstor\Hms\EO_Vhi $vhiObject
     */
    protected function getRowActions($vhiObject) {
        $actions = array(
            !$vhiObject->getActive()
                ? array(
                    "title" => Loc::getMessage("HMS_VHI_ROW_ACTION_ACTIVATE_TITLE"),
                    "text" => Loc::getMessage("HMS_VHI_ROW_ACTION_ACTIVATE_TEXT"),
                    "default" => false,
                    "disabled" => false,
                    "onclick" => 'BX.MyWebstor.HMS.Vhi.List.Instance.toggleActive("' . $vhiObject->getId() . '")',
                ) : array(
                    "title" => Loc::getMessage("HMS_VHI_ROW_ACTION_DEACTIVATE_TITLE"),
                    "text" => Loc::getMessage("HMS_VHI_ROW_ACTION_DEACTIVATE_TEXT"),
                    "default" => false,
                    "disabled" => false,
                    "onclick" => 'BX.MyWebstor.HMS.Vhi.List.Instance.toggleActive("' . $vhiObject->getId() . '")',
                ),
            array(
                "title" => Loc::getMessage("HMS_VHI_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_VHI_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/vhi/details/' . $vhiObject->getId() . '/")',
            ),
            array(
                "title" => Loc::getMessage("HMS_VHI_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_VHI_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Vhi.List.Instance.delete("' . $vhiObject->getId() . '")',
            )
        );

        return $actions;
    }
}
