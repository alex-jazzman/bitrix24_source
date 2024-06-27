<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\UI;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\Schedule\FillingMethodTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsFillingMethodListComponent extends \CBitrixComponent implements Controllerable {
    /** @var array */
    protected $data;
    /** @var \Bitrix\Main\Grid\Options $gridOptions */
    protected $gridOptions;
    /** @var \Bitrix\Main\UI\PageNavigation $nav */
    protected $nav;
    /** @var \Bitrix\Main\UI\Filter\Options $filterOptions */
    protected $filterOptions;

    public function configureActions() {
        return array();
    }

    public function deleteAction($fillingMethodID) {
        if (!$fillingMethodID)
            throw new \Exception("Filling Method ID not found");

        $this->includeModules();
        $result = FillingMethodTable::delete($fillingMethodID);
        if (!$result->isSuccess())
            throw new \Exception(join(",", $result->getErrorMessages()));

        return true;
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

    protected function includeModules() {
        $modules = array("mywebstor.hms");
        foreach ($modules as $module)
            if (!Loader::includeModule($module))
                throw new SystemException("Module \"$module\" not found");
    }

    protected function prepareParams() {
    }

    protected function prepareResult() {
        $this->arResult["GRID_ID"] = "hms_filling_method";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_FILLING_METHOD_LIST_TITLE");
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
                'name' => FillingMethodTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => FillingMethodTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TYPE',
                'name' => FillingMethodTable::getMap('TYPE')->getTitle(),
                'sort' => 'TYPE',
                'default' => true,
                'editable' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $fillingMethodObject) {
            $fillingMethod = $fillingMethodObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $row = array(
                "id" => $fillingMethod["ID"],
                "raw_data" => $fillingMethod,
                "data" => $fillingMethod,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            foreach ($fillingMethod as $key => $rawValue) {
                $data = $rawValue;
                switch ($key) {
                    case "TITLE":
                        $fillingMethodID = $row["id"];
                        $columns = "<a href=\"/hms/config/filling_method/details/$fillingMethodID/\">$data</a>";
                        break;
                    case "TYPE":
                        $type = Loc::getMessage("HMS_FILLING_METHOD_TYPE_" . $data);

                        $columns = $type ?: "-";
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

    protected function getData() {
        $fillingMethodQuery = FillingMethodTable::query();
        $fillingMethodQuery
            ->countTotal(true);
        $fillingMethodQuery
            ->setSelect(array(
                "*",
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        $fillingMethodQuery = $fillingMethodQuery->exec();

        $this->getNav()->setRecordCount($fillingMethodQuery->getCount());

        return $fillingMethodQuery->fetchCollection();
    }

    protected function getRowActions($fillingMethodID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_FILLING_METHOD_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_FILLING_METHOD_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/filling_method/details/' . $fillingMethodID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_FILLING_METHOD_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_FILLING_METHOD_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.FillingMethod.List.Instance.delete("' . $fillingMethodID . '")',
            )
        );
    }

    protected function prepareActionPanel() {
        return array();
    }
}
