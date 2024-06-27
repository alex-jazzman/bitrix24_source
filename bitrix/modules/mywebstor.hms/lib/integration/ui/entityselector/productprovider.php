<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Catalog\ProductTable;
use Bitrix\Catalog\v2\Integration\UI\EntitySelector\ProductProvider as CatalogProductProvider;
use Bitrix\Iblock\Component\Tools;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\Tab;
use MyWebstor\Hms\DoctorTable;
use MyWebstor\Hms\OfficeTable;
use MyWebstor\Hms\SpecializationTable;

Loc::loadMessages(__FILE__);

class ProductProvider extends CatalogProductProvider {
    protected const ENTITY_ID = 'hms-product';
    protected const TAB_ID_PRODUCT = 'hms-tab-product';
    protected const TAB_ID_SERVICE = 'hms-tab-service';

    public function __construct($options = array()) {
        parent::__construct($options);

        $this->options["filters"] = $options["filters"];
    }

    protected function makeItem(array $product): Item {
        $item = parent::makeItem($product);

        switch ($product["TYPE"]) {
            case ProductTable::TYPE_SERVICE:
                $item->addTab(self::TAB_ID_SERVICE);
                break;
            case ProductTable::TYPE_PRODUCT:
            case ProductTable::TYPE_SKU:
            default:
                $item->addTab(self::TAB_ID_PRODUCT);
                break;
        }

        return $item;
    }

    public function fillDialog(Dialog $dialog): void {
        parent::fillDialog($dialog);

        $dialog->addTab(new Tab(array(
            "id" => self::TAB_ID_SERVICE,
            "title" => Loc::getMessage("HMS_ENTITY_SELECTOR_TAB_SERVICE_TITLE"),
            "header" => Loc::getMessage("HMS_ENTITY_SELECTOR_TAB_SERVICE_HEADER"),
        )));
        $dialog->addTab(new Tab(array(
            "id" => self::TAB_ID_PRODUCT,
            "title" => Loc::getMessage("HMS_ENTITY_SELECTOR_TAB_PRODUCT_TITLE"),
            "header" => Loc::getMessage("HMS_ENTITY_SELECTOR_TAB_PRODUCT_HEADER"),
        )));
    }

    protected function loadElements(array $parameters = []): array {
        $elements = [];

        $additionalFilter = (array)($parameters['filter'] ?? []);
        $limit = (int)($parameters['limit'] ?? 0);

        $filter = [
            'CHECK_PERMISSIONS' => 'Y',
            'MIN_PERMISSION' => 'R',
            'ACTIVE' => 'Y',
            'ACTIVE_DATE' => 'Y',
        ];
        $selectFields = array_filter(array_unique(array_merge(
            [
                'ID',
                'NAME',
                'IBLOCK_ID',
                'TYPE',
                'PREVIEW_PICTURE',
                'DETAIL_PICTURE',
                'PREVIEW_TEXT',
                'PREVIEW_TEXT_TYPE',
                'DETAIL_TEXT',
                'DETAIL_TEXT_TYPE',
            ],
            array_keys($additionalFilter)
        )));
        $navParams = false;
        if ($limit > 0) {
            $navParams = [
                'nTopCount' => $limit,
            ];
        }

        $fullFilter = array_merge($filter, $additionalFilter);
        $fullFilter[] = $this->getDoctorOfficeFilter();

        $elementIterator = \CIBlockElement::GetList(
            ['ID' => 'DESC'],
            $fullFilter,
            false,
            $navParams,
            $selectFields
        );
        while ($element = $elementIterator->Fetch()) {
            $element['ID'] = (int)$element['ID'];
            $element['IBLOCK_ID'] = (int)$element['IBLOCK_ID'];
            $element['TYPE'] = (int)$element['TYPE'];
            $element['IMAGE'] = null;
            $element['PRICE'] = null;
            $element['SKU_PROPERTIES'] = null;

            if (!empty($element['PREVIEW_PICTURE'])) {
                $element['IMAGE'] = $this->getImageSource((int)$element['PREVIEW_PICTURE']);
            }

            if (empty($element['IMAGE']) && !empty($element['DETAIL_PICTURE'])) {
                $element['IMAGE'] = $this->getImageSource((int)$element['DETAIL_PICTURE']);
            }

            if (!empty($element['PREVIEW_TEXT']) && $element['PREVIEW_TEXT_TYPE'] === 'html') {
                $element['PREVIEW_TEXT'] = HTMLToTxt($element['PREVIEW_TEXT']);
            }

            if (!empty($element['DETAIL_TEXT']) && $element['DETAIL_TEXT_TYPE'] === 'html') {
                $element['DETAIL_TEXT'] = HTMLToTxt($element['DETAIL_TEXT']);
            }

            $elements[$element['ID']] = $element;
        }

        return $elements;
    }

    private function getImageSource(int $id): ?string {
        if ($id <= 0) {
            return null;
        }

        $file = \CFile::GetFileArray($id);
        if (!$file) {
            return null;
        }

        return Tools::getImageSrc($file, false) ?: null;
    }

    protected function getDoctorOfficeFilter() {
        $result = array();
        if (
            !($doctorID = $this->options["filters"]["DOCTOR_ID"])
            && !($officeID = $this->options["filters"]["OFFICE_ID"])
        ) return $result;

        $specializationCollection = SpecializationTable::createCollection();
        if (isset($doctorID)) {
            $doctorObject = DoctorTable::getById($doctorID)->fetchObject();
            if (isset($doctorObject))
                $specializationCollection->merge($doctorObject->fillSpecialization());
        }
        if (isset($officeID)) {
            $officeObject = OfficeTable::getById($officeID)->fetchObject();
            if (isset($officeObject))
                $specializationCollection->merge($officeObject->fillSpecialization());
        }

        if (!$specializationCollection->isEmpty()) {
            $result = array(
                "LOGIC" => "OR",
                "0" => array(
                    "SECTION_ID" => array()
                ),
                "1" => array(
                    "SECTION_ID" => array(),
                    "INCLUDE_SUBSECTIONS" => "Y"
                ),
                "2" => array(
                    "ID" => array()
                ),
            );

            $servicesList = array_unique(array_merge(...($specializationCollection->getServicesList() ?: array())));

            foreach ($servicesList as $service) {
                list($serviceType, $serviceID, $serviceMode) = explode("_", $service);
                switch ($serviceType) {
                    case "S":
                        switch ($serviceMode) {
                            case "S":
                                $result["0"]["SECTION_ID"][] = $serviceID;
                                break;
                            case "F":
                                $result["1"]["SECTION_ID"][] = $serviceID;
                                break;
                        }
                        break;
                    case "P":
                        $result["1"]["ID"][] = $serviceID;
                        break;
                }
            }
        }

        return $result;
    }
}
