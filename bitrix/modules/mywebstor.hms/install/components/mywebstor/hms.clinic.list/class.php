<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\ClinicTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsClinicListComponent extends \CBitrixComponent implements Controllerable {
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
        $this->arResult["GRID_ID"] = "hms_clinic";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_CLINIC_LIST_TITLE");
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
                'name' => ClinicTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => ClinicTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'COMPANY_ID',
                'name' => ClinicTable::getMap('COMPANY')->getTitle(),
                'sort' => 'COMPANY_ID',
                'default' => true,
                'editable' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $clinicObject) {
            $clinic = $clinicObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $row = array(
                "id" => $clinic["ID"],
                "raw_data" => $clinic,
                "data" => $clinic,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            foreach ($clinic as $key => $rawValue) {
                $data = $rawValue;
                $columns = "";
                switch ($key) {
                    case "COMPANY_ID":
                        $companyObject = $clinicObject->getCompany();
                        if (!$companyObject) break;

                        $companyTitle = $companyObject->getTitle();
                        $columns = "<a href=\"/crm/company/details/$data/\" bx-tooltip-user-id=\"COMPANY_$data\" bx-tooltip-loader=\"/bitrix/components/bitrix/crm.company.show/card.ajax.php\">$companyTitle</a>";
                        break;
                    case "TITLE":
                        $clinicID = $row["id"];
                        $columns = "<a href=\"/hms/config/clinic/details/$clinicID/\">$data</a>";
                        break;
                    default:
                        $columns = $data ?: "";
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
        $clinicQuery = ClinicTable::query();
        $clinicQuery
            ->countTotal(true);
        $clinicQuery
            ->setSelect(array(
                "*",
                "COMPANY"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        $clinicQuery = $clinicQuery->exec();

        $this->getNav()->setRecordCount($clinicQuery->getCount());

        return $clinicQuery->fetchCollection();
    }

    protected function getRowActions($clinicID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_CLINIC_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_CLINIC_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/clinic/details/' . $clinicID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_CLINIC_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_CLINIC_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Clinic.List.Instance.delete("' . $clinicID . '")',
            )
        );
    }

    protected function prepareActionPanel() {
        return array();
    }
}
