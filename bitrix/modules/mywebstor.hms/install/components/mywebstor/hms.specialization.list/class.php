<?

use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\Loader;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\SpecializationTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsSpecializationListComponent extends \CBitrixComponent {
    protected $data;
    /** @var \Bitrix\Main\Grid\Options $gridOptions */
    protected $gridOptions;
    /** @var \Bitrix\Main\UI\PageNavigation $nav */
    protected $nav;
    /** @var \Bitrix\Main\UI\Filter\Options $filterOptions */
    protected $filterOptions;

    protected function includeModule() {
        $module = "mywebstor.hms";
        if (!Loader::includeModule($module))
            throw new SystemException("Module \"$module\" not found");
    }

    public function executeComponent() {
        try {
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
        $this->arResult["GRID_ID"] = "hms_specialization";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_SPECIALIZATION_LIST_TITLE");
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
                'name' => SpecializationTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => SpecializationTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $specialization) {
            $row = array(
                "id" => $specialization["ID"],
                "raw_data" => $specialization,
                "data" => $specialization,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            unset($specialization["ID"]);
            foreach ($specialization as $key => $rawValue) {
                $data = $rawValue ?: "";
                switch ($key) {
                    case "TITLE":
                        $columns = "<a href=\"/hms/config/specialization/details/" . $row["id"] . "/\">$data</a>";
                        break;
                    default:
                        $columns = $data ?: "-";
                        break;
                }
                $row["data"][$key] = $data;
                $row["columns"][$key] = $columns;
            }
            $row["actions"] = $this->getRowActions($row["id"]);

            $rows[] = $row;
        }
        return $rows;
    }

    protected function prepareActionPanel() {
        return array();
    }

    protected function getData() {
        $specializationQuery = SpecializationTable::query();
        $specializationQuery
            ->countTotal(true);
        $specializationQuery
            ->setSelect(array(
                "ID",
                "TITLE"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        if (!empty(($searchQuery = $this->getFilterOptions()->getSearchString()))) {
            $specializationQuery
                ->where(
                    (new ConditionTree)
                        ->logic("OR")
                        ->whereLike("ID", "%" . $searchQuery . "%")
                        ->whereLike("TITLE", "%" . $searchQuery . "%")
                );
        }

        $specializationQuery = $specializationQuery->exec();

        $this->getNav()->setRecordCount($specializationQuery->getCount());

        return $specializationQuery->fetchAll();
    }

    protected function getRowActions($specializationID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_SPECIALIZATION_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_SPECIALIZATION_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/specialization/details/' . $specializationID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_SPECIALIZATION_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_SPECIALIZATION_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Specialization.List.Instance.delete("' . $specializationID . '")',
            )
        );
    }
}
