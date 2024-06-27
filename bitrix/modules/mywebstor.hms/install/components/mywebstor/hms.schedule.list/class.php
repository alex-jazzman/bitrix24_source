<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use Bitrix\Main\Type\Date;
use MyWebstor\Hms\Schedule\ScheduleTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsScheduleListComponent extends \CBitrixComponent implements Controllerable {
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

    public function deleteAction($scheduleID) {
        $this->includeModule();
        $result = ScheduleTable::delete($scheduleID);
        if (!$result->isSuccess())
            throw new \Exception(join(",", $result->getErrorMessages()));

        return true;
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
        $this->arResult["GRID_ID"] = "hms_schedule";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_SCHEDULE_LIST_TITLE");
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
                'name' => ScheduleTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'NUMBER',
                'name' => ScheduleTable::getMap('NUMBER')->getTitle(),
                'sort' => 'NUMBER',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'ACTIVE',
                'name' => ScheduleTable::getMap('ACTIVE')->getTitle(),
                'sort' => 'ACTIVE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'CLINIC_ID',
                'name' => ScheduleTable::getMap('CLINIC')->getTitle(),
                'sort' => 'CLINIC_ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DATE_CREATE',
                'name' => ScheduleTable::getMap('DATE_CREATE')->getTitle(),
                'sort' => 'DATE_CREATE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'PLAN_DATE',
                'name' => ScheduleTable::getMap('PLAN_DATE')->getTitle(),
                'sort' => 'PLAN_DATE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'ASSIGNED_BY_ID',
                'name' => ScheduleTable::getMap('ASSIGNED_BY')->getTitle(),
                'sort' => 'ASSIGNED_BY_ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'COMMENT',
                'name' => ScheduleTable::getMap('COMMENT')->getTitle(),
                'sort' => 'COMMENT',
                'default' => true,
                'editable' => false
            ),
        );
    }

    public function prepareFilterFields() {
        return array(
            array(
                'id' => 'ID',
                'name' => ScheduleTable::getMap('ID')->getTitle(),
                'type' => 'number',
                'default' => false
            ),

            array(
                'id' => 'ACTIVE',
                'name' => ScheduleTable::getMap('ACTIVE')->getTitle(),
                'type' => 'checkbox',
                'default' => true
            ),
            array(
                'id' => 'CLINIC_ID',
                'name' => ScheduleTable::getMap('CLINIC')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 240,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'hms-clinic',
                            )
                        )
                    )
                ),
                'default' => true
            ),
            array(
                'id' => 'DATE_CREATE',
                'name' => ScheduleTable::getMap('DATE_CREATE')->getTitle(),
                'type' => 'date',
                'default' => false
            ),
            array(
                'id' => 'PLAN_DATE',
                'name' => ScheduleTable::getMap('PLAN_DATE')->getTitle(),
                'type' => 'date',
                'default' => true
            ),
            array(
                'id' => 'ASSIGNED_BY_ID',
                'name' => ScheduleTable::getMap('ASSIGNED_BY')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 240,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'user',
                            )
                        )
                    )
                ),
                'default' => false
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $scheduleObject) {
            $schedule = $scheduleObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $row = array(
                "id" => $schedule["ID"],
                "raw_data" => $schedule,
                "data" => $schedule,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            foreach ($schedule as $key => $rawValue) {
                $data = $rawValue;
                $columns = "";
                switch ($key) {
                    case "ASSIGNED_BY_ID":
                        $assignedFullName = $schedule["ASSIGNED_BY_FULL_NAME"];
                        $columns = $data ? "<a href=\"/company/personal/user/$data/\" bx-tooltip-user-id=\"$data\">$assignedFullName</a>" : "";
                        break;
                    case "PLAN_DATE":
                        $columns = $data instanceof Date ? \MyWebstorHmsHelper::getDateMonthYear($data) : $data;
                        break;
                    case "CLINIC_ID":
                        $clinicObject = $scheduleObject->getClinic();
                        if (!$clinicObject) break;

                        $clinicTitle = $clinicObject->getTitle();
                        $columns = $data ? "<a href=\"/hms/config/clinic/details/$data/\">$clinicTitle</a>" : "-";
                        break;
                    case "ACTIVE":
                        $columns = $data ? Loc::getMessage("HMS_ANSWER_YES") : Loc::getMessage("HMS_ANSWER_NO");
                        break;
                    case "NUMBER":
                        $scheduleID = $row["id"];
                        $columns = "<a href=\"/hms/config/schedule/details/$scheduleID/\">$data</a>";
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
        $scheduleQuery = ScheduleTable::query();
        $scheduleQuery
            ->countTotal(true);
        $scheduleQuery
            ->setSelect(array(
                "*",
                "CLINIC",
                "ASSIGNED_BY_ID",
                "ASSIGNED_BY_FULL_NAME",
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        if (!empty(($searchQuery = $this->getFilterOptions()->getSearchString()))) {
            $scheduleQuery
                ->where(
                    (new ConditionTree)
                        ->logic("OR")
                        ->whereLike("ID", "%" . $searchQuery . "%")
                        ->whereLike("NUMBER", "%" . $searchQuery . "%")
                        ->whereLike("CLINIC.TITLE", "%" . $searchQuery . "%")
                        ->whereLike("ASSIGNED_BY_FULL_NAME", "%" . $searchQuery . "%")
                        ->whereLike("COMMENT", "%" . $searchQuery . "%")
                );
        }

        if (!empty(($filterLogic = $this->getFilterOptions()->getFilterLogic($this->prepareFilterFields())))) {
            foreach ($filterLogic as $filterKey => $filterValue) {
                $scheduleQuery
                    ->addFilter($filterKey, $filterValue);
            }
        }

        $scheduleQuery = $scheduleQuery->exec();

        $this->getNav()->setRecordCount($scheduleQuery->getCount());

        return $scheduleQuery->fetchCollection();
    }

    protected function getRowActions($scheduleID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_SCHEDULE_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_SCHEDULE_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/schedule/details/' . $scheduleID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_SCHEDULE_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_SCHEDULE_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Schedule.List.Instance.delete("' . $scheduleID . '")',
            )
        );
    }
}
