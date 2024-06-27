<?

use Bitrix\Catalog\ProductTable;
use Bitrix\Crm\Format\TextHelper;
use Bitrix\Main\Engine\Contract\Controllerable;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Main\UI;
use MyWebstor\Hms\AppointmentTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

class HmsAppointmentListComponent extends \CBitrixComponent {
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

    public function listKeysSignedParameters() {
        return array(
            "CONTACT_ID"
        );
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
        $this->arResult["GRID_ID"] = $this->arParams["GRID_ID"] ?: "hms_appointment";

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
                    25,
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

    protected static function prepareHeaders() {
        return array(
            array(
                'id' => 'ID',
                'name' => AppointmentTable::getMap('ID')->getTitle(),
                'sort' => 'ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => AppointmentTable::getMap('TITLE')->getTitle(),
                'sort' => 'TITLE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DATE_CREATE',
                'name' => AppointmentTable::getMap('DATE_CREATE')->getTitle(),
                'sort' => 'DATE_CREATE',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'STATUS_ID',
                'name' => AppointmentTable::getMap('STATUS_ID')->getTitle(),
                'sort' => 'STATUS.SORT',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'PATIENT',
                'name' => AppointmentTable::getMap('CONTACT')->getTitle(),
                'sort' => 'PATIENT',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'CLINIC_ID',
                'name' => AppointmentTable::getMap('CLINIC')->getTitle(),
                'sort' => 'CLINIC_ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DOCTOR_ID',
                'name' => AppointmentTable::getMap('DOCTOR')->getTitle(),
                'sort' => 'DOCTOR_ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'OFFICE_ID',
                'name' => AppointmentTable::getMap('OFFICE')->getTitle(),
                'sort' => 'OFFICE_ID',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DATE_FROM',
                'name' => AppointmentTable::getMap('DATE_FROM')->getTitle(),
                'sort' => 'DATE_FROM',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DATE_TO',
                'name' => AppointmentTable::getMap('DATE_TO')->getTitle(),
                'sort' => 'DATE_TO',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'DURATION',
                'name' => AppointmentTable::getMap('DURATION')->getTitle(),
                'sort' => 'DURATION',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'COMMENTS',
                'name' => AppointmentTable::getMap('COMMENTS')->getTitle(),
                'sort' => '',
                'default' => true,
                'editable' => false
            ),
            array(
                'id' => 'ASSIGNED_BY_ID',
                'name' => AppointmentTable::getMap('ASSIGNED_BY_ID')->getTitle(),
                'sort' => 'ASSIGNED_BY_ID',
                'default' => true,
                'editable' => false
            ),
        );
    }

    public static function prepareFilterFields() {
        return array(
            array(
                'id' => 'ID',
                'name' => AppointmentTable::getMap('ID')->getTitle(),
                'type' => 'number',
                'default' => false
            ),
            array(
                'id' => 'TITLE',
                'name' => AppointmentTable::getMap('TITLE')->getTitle(),
                'type' => 'string',
                'default' => true
            ),
            array(
                'id' => 'STATUS_ID',
                'name' => AppointmentTable::getMap('STATUS_ID')->getTitle(),
                'type' => 'list',
                'params' => array(
                    'multiple' => 'Y'
                ),
                'items' => \CCrmStatus::GetStatusList('HMS_APPOINTMENT_STATUS'),
                'default' => true
            ),
            array(
                'id' => 'DATE_CREATE',
                'name' => AppointmentTable::getMap('DATE_CREATE')->getTitle(),
                'type' => 'date',
                'default' => false
            ),
            array(
                'id' => 'CONTACT_ID',
                'name' => AppointmentTable::getMap('CONTACT_ID')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 300,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'contact',
                                'dynamicLoad' => true,
                                'dynamicSearch' => true,
                            )
                        )
                    )
                ),
                'default' => true
            ),
            array(
                'id' => 'CLINIC_ID',
                'name' => AppointmentTable::getMap('CLINIC_ID')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 240,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'hms-clinic',
                                'dynamicLoad' => true,
                                'dynamicSearch' => true,
                            )
                        )
                    )
                ),
                'default' => true
            ),
            array(
                'id' => 'DOCTOR_ID',
                'name' => AppointmentTable::getMap('DOCTOR_ID')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 300,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'hms-doctor',
                                'dynamicLoad' => true,
                                'dynamicSearch' => true,
                            )
                        )
                    )
                ),
                'default' => true
            ),
            array(
                'id' => 'OFFICE_ID',
                'name' => AppointmentTable::getMap('OFFICE_ID')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 300,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'hms-office',
                                'dynamicLoad' => true,
                                'dynamicSearch' => true,
                            )
                        )
                    )
                ),
                'default' => true
            ),
            array(
                'id' => 'DATE_FROM',
                'name' => AppointmentTable::getMap('DATE_FROM')->getTitle(),
                'type' => 'date',
                'default' => false
            ),
            array(
                'id' => 'DATE_TO',
                'name' => AppointmentTable::getMap('DATE_TO')->getTitle(),
                'type' => 'date',
                'default' => false
            ),
            array(
                'id' => 'DURATION',
                'name' => AppointmentTable::getMap('DURATION')->getTitle(),
                'type' => 'number',
                'default' => false
            ),
            array(
                'id' => 'PRODUCT_ROWS.PRODUCT_ID',
                'name' => AppointmentTable::getMap('PRODUCT_ROWS')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'height' => 300,
                        'context' => 'catalog-products',
                        'entities' => array(
                            array(
                                'id' => 'product',
                                'options' => array(
                                    'iblockId' => \Bitrix\Crm\Product\Catalog::getDefaultId(),
                                    'basePriceId' => \Bitrix\Crm\Product\Price::getBaseId(),
                                    'currency' => 'RUB',
                                    'restrictedProductTypes' => array(
                                        ProductTable::TYPE_PRODUCT,
                                        ProductTable::TYPE_SET,
                                        ProductTable::TYPE_SKU,
                                        ProductTable::TYPE_OFFER,
                                        ProductTable::TYPE_FREE_OFFER,
                                        ProductTable::TYPE_EMPTY_SKU,
                                    )
                                )
                            )
                        )
                    )
                ),
                'default' => true
            ),
            array(
                'id' => 'ASSIGNED_BY_ID',
                'name' => AppointmentTable::getMap('ASSIGNED_BY_ID')->getTitle(),
                'type' => 'entity_selector',
                'params' => array(
                    'multiple' => 'Y',
                    'dialogOptions' => array(
                        'hideOnSelect' => 'N',
                        'height' => 300,
                        'context' => 'filter',
                        'entities' => array(
                            array(
                                'id' => 'user',
                            )
                        )
                    )
                ),
                'default' => true
            ),
        );
    }

    protected function prepareRows() {
        $this->data = $this->getData();
        $rows = array();
        foreach ($this->data as $appointment) {
            $row = array(
                "id" => $appointment["ID"],
                "raw_data" => $appointment,
                "data" => $appointment,
                "columns" => array(),
                "has_child" => false,
                "parent_id" => 0,
                "actions" => array(),
                "editable" => false
            );
            foreach ($appointment as $key => $rawValue) {
                $data = $rawValue;
                switch ($key) {
                    case "ID":
                    case "TITLE":
                        $appointmentID = $row["id"];
                        $columns = "<a href=\"/hms/reception/appointment/details/$appointmentID/\">$data</a>";
                        break;
                    case "STATUS_ID":
                        $statusName = $appointment["STATUS_NAME"];
                        $statusColor = $appointment["STATUS_COLOR"] ?: "";
                        $columns = "<div class=\"hms-appointment-status-name\" style=\"background-color: $statusColor; color: " . \MyWebstorHmsHelper::getTextColor($statusColor) . "\">" . $statusName . "</div>";
                        break;
                    case "PATIENT":
                        $contactID = $appointment["CONTACT_ID"];
                        $columns = $contactID && $contactID > 0 ? "<a href=\"/crm/contact/details/$contactID/\" bx-tooltip-user-id=\"CONTACT_$contactID\" bx-tooltip-loader=\"/bitrix/components/bitrix/crm.contact.show/card.ajax.php\">$data</a>" : "";
                        break;
                    case "CLINIC_ID":
                        $clinicTitle = $appointment["CLINIT_TITLE"];
                        $columns = $data && $data > 0 ? "<a href=\"/hms/config/clinic/details/$data/\">$clinicTitle</a>" : "";
                        break;
                    case "DOCTOR_ID":
                        $doctorUserTitle = $appointment["DOCTOR_USER_TITLE"];
                        $columns = $data && $data > 0 ? "<a href=\"/hms/config/doctor/details/$data/\" bx-tooltip-user-id=\"$data\">$doctorUserTitle</a>" : "";
                        break;
                    case "OFFICE_ID":
                        $officeTitle = $appointment["OFFICE_TITLE"];
                        $columns = $data && $data > 0 ? "<a href=\"/hms/config/office/details/$data/\">$officeTitle</a>" : "";
                        break;
                    case "COMMENTS":
                        $columns = TextHelper::convertBbCodeToHtml($data);
                        break;
                    case "ASSIGNED_BY_ID":
                        $assignedByShortName = join(" ", array_filter(array($appointment["ASSIGNED_BY_NAME"], $appointment["ASSIGNED_BY_LAST_NAME"])));
                        $columns = $data && $data > 0 ? "<a href=\"/company/personal/user/$data/\" target=\"_blank\" bx-tooltip-user-id=\"$data\">$assignedByShortName</a>" : "";
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
        $appointmentQuery = AppointmentTable::query();
        $appointmentQuery
            ->countTotal(true);
        $appointmentQuery
            ->registerRuntimeField(
                new ExpressionField(
                    "PATIENT",
                    "CONCAT_WS(\" \", IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL), IF(LENGTH(%s), %s, NULL))",
                    array(
                        "CONTACT.LAST_NAME",
                        "CONTACT.LAST_NAME",
                        "CONTACT.NAME",
                        "CONTACT.NAME",
                        "CONTACT.SECOND_NAME",
                        "CONTACT.SECOND_NAME",
                    )
                )
            )
            ->setSelect(array(
                "ID",
                "TITLE",
                "DATE_CREATE",
                "STATUS_ID",
                "STATUS_NAME" => "STATUS.NAME",
                "STATUS_COLOR" => "STATUS.COLOR",
                "CONTACT_ID",
                "PATIENT",
                "CLINIC_ID",
                "CLINIT_TITLE" => "CLINIC.TITLE",
                "DOCTOR_ID",
                "DOCTOR_USER_TITLE" => "DOCTOR.USER_TITLE",
                "OFFICE_ID",
                "OFFICE_TITLE" => "OFFICE.TITLE",
                "DATE_FROM",
                "DATE_TO",
                "DURATION",
                "COMMENTS",
                "ASSIGNED_BY_ID",
                "ASSIGNED_BY_NAME" => "ASSIGNED_BY.NAME",
                "ASSIGNED_BY_LAST_NAME" => "ASSIGNED_BY.LAST_NAME"
            ))
            ->setOrder($this->getGridOptions()->getSorting()["sort"])
            ->setLimit($this->getNav()->getLimit())
            ->setOffset($this->getNav()->getOffset());

        if (!empty($this->arParams["CONTACT_ID"]) && $this->arParams["CONTACT_ID"] > 0)
            $appointmentQuery->addFilter("CONTACT_ID", $this->arParams["CONTACT_ID"]);

        if (!empty(($searchQuery = $this->getFilterOptions()->getSearchString()))) {
            $appointmentQuery
                ->where(
                    (new ConditionTree)
                        ->logic("OR")
                        ->whereLike("TITLE", "%" . $searchQuery . "%")
                        ->whereLike("PATIENT", "%" . $searchQuery . "%")
                        ->whereLike("CLINIT_TITLE", "%" . $searchQuery . "%")
                        ->whereLike("DOCTOR_USER_TITLE", "%" . $searchQuery . "%")
                        ->whereLike("OFFICE_TITLE", "%" . $searchQuery . "%")
                        ->whereLike("ASSIGNED_BY.NAME", "%" . $searchQuery . "%")
                        ->whereLike("ASSIGNED_BY.LAST_NAME", "%" . $searchQuery . "%")
                        ->whereLike("ASSIGNED_BY.SECOND_NAME", "%" . $searchQuery . "%")
                        ->whereLike("ASSIGNED_BY.LOGIN", "%" . $searchQuery . "%")
                );
        }

        if (!empty(($filterLogic = $this->getFilterOptions()->getFilterLogic($this->prepareFilterFields())))) {
            foreach ($filterLogic as $filterKey => $filterValue) {
                $appointmentQuery
                    ->addFilter($filterKey, $filterValue);
            }
        }

        $appointmentQuery = $appointmentQuery->exec();

        $appointmentQuery->addFetchDataModifier(function ($appointment) {
            foreach ($appointment as $appointmentFieldCode => $appointmentFieldValue)
                if ($appointmentFieldValue instanceof \Bitrix\Main\Type\Date)
                    $appointment[$appointmentFieldCode] = $appointmentFieldValue->format($appointmentFieldValue->getFormat());

            return $appointment;
        });

        $this->getNav()->setRecordCount($appointmentQuery->getCount());

        return $appointmentQuery->fetchAll();
    }

    protected function getRowActions($appointmentID = "0") {
        return array(
            array(
                "title" => Loc::getMessage("HMS_APPOINTMENT_ROW_ACTION_OPEN_TITLE"),
                "text" => Loc::getMessage("HMS_APPOINTMENT_ROW_ACTION_OPEN_TEXT"),
                "default" => true,
                "disabled" => false,
                "onclick" => 'BX.SidePanel.Instance.open("/hms/reception/appointment/details/' . $appointmentID . '/");',
            ),
            array(
                "title" => Loc::getMessage("HMS_APPOINTMENT_ROW_ACTION_DELETE_TITLE"),
                "text" => Loc::getMessage("HMS_APPOINTMENT_ROW_ACTION_DELETE_TEXT"),
                "default" => false,
                "disabled" => false,
                "onclick" => 'BX.MyWebstor.HMS.Appointment.List.Instance.delete("' . $appointmentID . '")',
            )
        );
    }

    protected function prepareActionPanel() {
        return array();
    }
}
