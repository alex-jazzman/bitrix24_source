<?

use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\EO_Specialization_Collection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsDoctorListComponent extends \CBitrixComponent implements Controllerable {
    /** @var \MyWebstor\Hms\EO_Doctor_Collection */
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
        $this->arResult["GRID_ID"] = "hms_doctor";

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
            $this->arResult["SETTINGS_WINDOW_TITLE"] = Loc::getMessage("HMS_DOCTOR_LIST_TITLE");
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
                'name' => DoctorTable::getMap("ID")->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => DoctorTable::getMap("USER_TITLE")->getTitle(),
                'sort' => 'USER_TITLE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'SPECIALIZATION',
                'name' => DoctorTable::getMap("SPECIALIZATION")->getTitle(),
                'sort' => 'SPECIALIZATION',
                'default' => true,
                'editable' => false
            ),
            // array(
            //     'id' => 'IS_CONTINUOUS_SCHEME',
            //     'name' => DoctorTable::getMap("IS_CONTINUOUS_SCHEME")->getTitle(),
            //     'sort' => 'IS_CONTINUOUS_SCHEME',
            //     'default' => true,
            //     'editable' => false
            // ),
            // array(
            //     'id' => 'OFFICE_ID',
            //     'name' => DoctorTable::getMap("OFFICE")->getTitle(),
            //     'sort' => 'OFFICE_ID',
            //     'default' => true,
            //     'editable' => false
            // ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $doctorObject) {
            $doctor = $doctorObject->collectValues(
                Values::ALL,
                FieldTypeMask::FLAT,
                true
            );
            $doctor["SPECIALIZATION"] = $doctorObject->fillSpecialization();
            $row = array(
                "id" => $doctor["ID"],
                "raw_data" => $doctor,
                "data" => $doctor,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            foreach ($doctor as $key => $rawValue) {
                $data = $rawValue;
                $columns = "";
                switch ($key) {
                    case "USER_TITLE":
                        $key = "TITLE";
                        $doctorID = $row["id"];
                        $doctorTitle = $doctorObject->getUserTitle();
                        $columns = "<a href=\"/hms/config/doctor/details/$doctorID/\" bx-tooltip-user-id=\"$doctorID\">$doctorTitle</a>";
                        break;
                    case "OFFICE_ID":
                        $officeObject = $doctorObject->getOffice();
                        if (!$officeObject) break;

                        $officeTitle = $officeObject->getTitle();
                        $columns = "<a href=\"/hms/config/office/details/$data/\">$officeTitle</a>";
                        break;
                    case "SPECIALIZATION":
                        /** @var EO_Specialization_Collection $specializationCollection */
                        $specializationCollection = $doctor["SPECIALIZATION"];
                        if ($specializationCollection->isEmpty()) break;

                        foreach ($specializationCollection as $specializationObject) {
                            $specializationID = $specializationObject->getId();
                            $specializationTitle = $specializationObject->getTitle();
                            $columns .= "<a href=\"/hms/config/specialization/details/$specializationID/\">$specializationTitle</a><br>";
                        }
                        break;
                    case "IS_CONTINUOUS_SCHEME":
                        $columns = $data ? Loc::getMessage("HMS_ANSWER_YES") : Loc::getMessage("HMS_ANSWER_NO");
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
        $doctorQuery = DoctorTable::query();
        $doctorQuery
            ->countTotal(true);
        $doctorQuery
            ->setSelect(array(
                "*",
                "USER_TITLE",
                "OFFICE"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        $doctorQuery = $doctorQuery->exec();

        $this->getNav()->setRecordCount($doctorQuery->getCount());

        return $doctorQuery->fetchCollection();
    }

    protected function getRowActions($doctorID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_DOCTOR_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_DOCTOR_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/config/doctor/details/' . $doctorID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_DOCTOR_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_DOCTOR_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Doctor.List.Instance.delete("' . $doctorID . '")',
            )
        );
    }
}
