<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Loader;
use Bitrix\Main\SystemException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\UI;
use MyWebstor\Hms\Vhi\VhiServiceTypeTable;

Loc::loadMessages(__FILE__);

class HmsVhiServiceTypeListComponent extends \CBitrixComponent {
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
        $this->arResult["GRID_ID"] = "hms_vhi_service_type";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_VHI_SERVICE_TYPE_LIST_TITLE");
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
                'name' => VhiServiceTypeTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => VhiServiceTypeTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
            // array(
            //     'id' => 'SERVICES',
            //     'name' => VhiServiceTypeTable::getMap('SERVICES')->getTitle(),
            //     'sort' => '',
            //     'default' => true,
            //     'editable' => false
            // ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $vhiServiceTypeObject) {
            $vhiServiceType = $vhiServiceTypeObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $row = array(
                "id" => $vhiServiceType["ID"],
                "raw_data" => $vhiServiceType,
                "data" => $vhiServiceType,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            unset($vhiServiceType["ID"]);
            foreach ($vhiServiceType as $key => $rawValue) {
                $data = $rawValue ?: "";
                switch ($key) {
                    case "TITLE":
                        $vhiServiceTypeID = $row["id"];
                        $columns = "<a href=\"/hms/config/vhi/service_type/details/$vhiServiceTypeID/\">$data</a>";
                        break;
                    default:
                        $columns = $data ?: "-";
                        break;
                }
                $row["data"][$key] = $data;
                $row["columns"][$key] = $columns;
            }
            $row["actions"] = $this->getRowActions($vhiServiceTypeObject);

            $rows[] = $row;
        }
        return $rows;
    }

    protected function prepareActionPanel() {
        return array();
    }

    protected function getData() {
        $vhiServiceTypeQuery = VhiServiceTypeTable::query();
        $vhiServiceTypeQuery
            ->countTotal(true);
        $vhiServiceTypeQuery
            ->setSelect(array(
                "*"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        $vhiServiceTypeQuery = $vhiServiceTypeQuery->exec();

        $this->getNav()->setRecordCount($vhiServiceTypeQuery->getCount());

        return $vhiServiceTypeQuery->fetchCollection();
    }

    /**
     * @param \MyWebstor\Hms\Vhi\EO_VhiServiceType $vhiServiceTypeObject
     */
    protected function getRowActions($vhiServiceTypeObject) {
        $actions = array(
            array(
                "title" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/vhi/service_type/details/' . $vhiServiceTypeObject->getId() . '/")',
            ),
            array(
                "title" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_VHI_SERVICE_TYPE_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Vhi.ServiceType.List.Instance.delete("' . $vhiServiceTypeObject->getId() . '")',
            )
        );

        return $actions;
    }
}
