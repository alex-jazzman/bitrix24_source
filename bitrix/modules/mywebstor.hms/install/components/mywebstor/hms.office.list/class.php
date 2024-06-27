<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection;
use MyWebstor\Hms\Binding\EO_SpecializationBinding_Collection;
use MyWebstor\Hms\EO_Specialization_Collection;
use MyWebstor\Hms\OfficeTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsOfficeListComponent extends \CBitrixComponent implements Controllerable {
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
        $this->arResult["GRID_ID"] = "hms_office";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_OFFICE_LIST_TITLE");
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
                'name' => OfficeTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => OfficeTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'CLINIC_ID',
                'name' => OfficeTable::getMap('CLINIC')->getTitle(),
                'sort' => 'CLINIC_ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'SPECIALIZATION',
                'name' => OfficeTable::getMap('SPECIALIZATION')->getTitle(),
                'sort' => 'SPECIALIZATION',
                'default' => true,
                'editable' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $officeObject) {
            $office = $officeObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $office["SPECIALIZATION"] = $officeObject->fillSpecialization();
            $row = array(
                "id" => $office["ID"],
                "raw_data" => $office,
                "data" => $office,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            foreach ($office as $key => $rawValue) {
                $data = $rawValue;
                $columns = "";
                switch ($key) {
                    case "TITLE":
                        $officeID = $row["id"];
                        $columns = "<a href=\"/hms/config/office/details/$officeID/\">$data</a>";
                        break;
                    case "CLINIC_ID":
                        $clinicObject = $officeObject->getClinic();
                        if (!$clinicObject) break;

                        $clinicTitle = $clinicObject->getTitle();
                        $columns = $data ? "<a href=\"/hms/config/clinic/details/$data/\">$clinicTitle</a>" : "";
                        break;
                    case "SPECIALIZATION":
                        /** @var EO_Specialization_Collection $officeSpecializationCollection */
                        $officeSpecializationCollection = $office["SPECIALIZATION"];
                        if ($officeSpecializationCollection->isEmpty()) break;

                        foreach ($officeSpecializationCollection as $specializationObject) {
                            $specializationID = $specializationObject->getId();
                            $specializationTitle = $specializationObject->getTitle();
                            $columns .= "<a href=\"/hms/config/specialization/details/$specializationID/\">$specializationTitle</a><br>";
                        }
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
        $officeQuery = OfficeTable::query();
        $officeQuery
            ->countTotal(true);
        $officeQuery
            ->setSelect(array(
                "*",
                "CLINIC"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        $officeQuery = $officeQuery->exec();

        $this->getNav()->setRecordCount($officeQuery->getCount());

        return $officeQuery->fetchCollection();
    }

    protected function getRowActions($officeID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_OFFICE_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_OFFICE_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/office/details/' . $officeID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_OFFICE_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_OFFICE_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Office.List.Instance.delete("' . $officeID . '")',
            )
        );
    }
}
