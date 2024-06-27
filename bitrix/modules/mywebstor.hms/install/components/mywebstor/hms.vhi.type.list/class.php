<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Loader;
use Bitrix\Main\SystemException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\UI;
use MyWebstor\Hms\Vhi\VhiTypeTable;

Loc::loadMessages(__FILE__);

class HmsVhiTypeListComponent extends \CBitrixComponent {
    protected $data;
    /** @var \Bitrix\Main\Grid\Options $gridOptions */
    protected $gridOptions;
    /** @var \Bitrix\Main\UI\PageNavigation $nav */
    protected $nav;
    /** @var \Bitrix\Main\UI\Filter\Options $filterOptions */
    protected $filterOptions;

    public function listKeysSignedParameters() {
        return array();
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
    }

    protected function prepareResult() {
        $this->arResult["GRID_ID"] = "hms_vhi_type";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_VHI_TYPE_LIST_TITLE");
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
                'name' => VhiTypeTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => VhiTypeTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'SERVICE_TYPE',
                'name' => VhiTypeTable::getMap('SERVICE_TYPE')->getTitle(),
                'sort' => '',
                'default' => true,
                'editable' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $vhiTypeObject) {
            $vhiType = $vhiTypeObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $row = array(
                "id" => $vhiType["ID"],
                "raw_data" => $vhiType,
                "data" => $vhiType,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            unset($vhiType["ID"]);
            foreach ($vhiType as $key => $rawValue) {
                $data = $rawValue ?: "";
                switch ($key) {
                    case "TITLE":
                        $vhiTypeID = $row["id"];
                        $columns = "<a href=\"/hms/config/vhi/type/details/$vhiTypeID/\">$data</a>";
                        break;
                    default:
                        $columns = $data ?: "-";
                        break;
                }
                $row["data"][$key] = $data;
                $row["columns"][$key] = $columns;
            }
            $row["actions"] = $this->getRowActions($vhiTypeObject);

            $rows[] = $row;
        }
        return $rows;
    }

    protected function prepareActionPanel() {
        return array();
    }

    protected function getData() {
        $vhiTypeQuery = VhiTypeTable::query();
        $vhiTypeQuery
            ->countTotal(true);
        $vhiTypeQuery
            ->setSelect(array(
                "*"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        $vhiTypeQuery = $vhiTypeQuery->exec();

        $this->getNav()->setRecordCount($vhiTypeQuery->getCount());

        return $vhiTypeQuery->fetchCollection();
    }

    /**
     * @param \MyWebstor\Hms\Vhi\EO_VhiType $vhiTypeObject
     */
    protected function getRowActions($vhiTypeObject) {
        $actions = array(
            array(
                "title" => Loc::getMessage("HMS_VHI_TYPE_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_VHI_TYPE_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/vhi/type/details/' . $vhiTypeObject->getId() . '/")',
            ),
            array(
                "title" => Loc::getMessage("HMS_VHI_TYPE_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_VHI_TYPE_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Vhi.Type.List.Instance.delete("' . $vhiTypeObject->getId() . '")',
            )
        );

        return $actions;
    }
}
