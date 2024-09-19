<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
    Sotbit\RestAPI\Localisation as l,
    Sotbit\RestAPI\Repository\CatalogRepository,
    Sotbit\RestAPI\Core;
use Bitrix\Main\Loader;


class Filter extends CatalogRepository
{
    public Price $prices;
    public array $avaliblePrices = [];
    public $vats;
    public $iblockId = 0;
    public $sectionId = 0;

    public $skuIblockId = 0;
    public $skuPropertyId = 0;
    public $currencyConvert;

    public array $filter = [];
    public array $select = [];

    /** @var \Bitrix\Iblock\PropertyIndex\Facet **/
    protected $facet = null;

    /** @var \CBitrixCatalogSmartFilter **/
    protected $objectSmartFilter = null;

    private $searchSettings = [];

    public const SELECT_FILTER = [
        'ID', 'IBLOCK_ID', 'CODE', 'NAME', 'PROPERTY_TYPE',
        'DISPLAY_TYPE', 'DISPLAY_EXPANDED', 'FILTER_HINT', 'VALUES', 'CURRENCIES',
        'VALUE', 'SORT', 'CURRENCY', 'FILE', 'MIN', 'MAX', 'PRICE', 'USER_TYPE',
        'URL_ID', 'VALUE_ID', 'ELEMENT_COUNT'
    ];

    public const USER_TYPE_DIRECTORY = 'directory';
    public const FILTER_NAME = 'sotbit_restapi';

    public function __construct()
    {
        parent::__construct();

        // include class catalog.smart.filter
        if(\CBitrixComponent::includeComponentClass("bitrix:catalog.smart.filter") !== 'CBitrixCatalogSmartFilter') {
            throw new CatalogException(l::get('ERROR_COMPONENT_SMART_FILTER'), StatusCode::STATUS_BAD_REQUEST);
        }

        $this->objectSmartFilter = new ClassExtends\BitrixCatalogSmartFilterCustom();
        $this->prices = new Price();
        $this->vats = new Vat();


        // config
        // prices preparation
        $pricesSelect = $this->getConfig()->getCatalogPrices();
        $this->prices->setPricesSelect($pricesSelect);

        // currency convert
        $this->currencyConvert = $this->getConfig()->getCurrencyConvert();

    }

    public function getItems(): array
    {
        $result = [];

        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        if(empty($this->filter['IBLOCK_ID'])) {
            throw new CatalogException(l::get('ERROR_CATALOG_ID_EMPTY'), StatusCode::STATUS_BAD_REQUEST);
        }

        $this->preparePrices();
        $this->prepareSmartFilter();

        $result['FACET_FILTER'] = false;
        $result['PRICES'] = \CIBlockPriceTools::GetCatalogPrices($this->iblockId, $this->avaliblePrices);
        $result['ITEMS'] = $this->objectSmartFilter->getResultItems();
        $result['CURRENCIES'] = [];


        if(!empty($result['ITEMS'])) {

            if($this->objectSmartFilter->getFacet() && $this->objectSmartFilter->getFacet()->isValid()) {
                $this->objectSmartFilter->getFacet()->setPrices($result['PRICES']);
                $this->objectSmartFilter->getFacet()->setSectionId($this->sectionId);

                $propertyEmptyValuesCombination = [];
                foreach($result['ITEMS'] as $PID => $arItem) {
                    $propertyEmptyValuesCombination[$arItem["ID"]] = [];
                }


                $result['FACET_FILTER'] = [
                    "ACTIVE_DATE"       => "Y",
                    "CHECK_PERMISSIONS" => "Y",
                    'MIN_PERMISSION'    => 'R',
                    'PERMISSIONS_BY'    => $this->getUserId(),
                ];

                if($this->objectSmartFilter->arParams['HIDE_NOT_AVAILABLE']) {
                    $result['FACET_FILTER']['AVAILABLE'] = 'Y';
                }

                $cntProperty = 0;
                $tmpProperty = [];
                $dictionaryID = [];
                $elementDictionary = [];
                $sectionDictionary = [];
                $directoryPredict = [];

                $res = $this->objectSmartFilter->getFacet()->query($result['FACET_FILTER']);

                \CTimeZone::Disable();
                while($rowData = $res->fetch()) {
                    $facetId = $rowData["FACET_ID"];

                    if(\Bitrix\Iblock\PropertyIndex\Storage::isPropertyId($facetId)) {
                        $PID = \Bitrix\Iblock\PropertyIndex\Storage::facetIdToPropertyId($facetId);
                        if(!array_key_exists($PID, $result['ITEMS'])) {
                            continue;
                        }
                        ++$cntProperty;

                        $rowData['PID'] = $PID;
                        $tmpProperty[] = $rowData;
                        $item = $result['ITEMS'][$PID];
                        $arUserType = \CIBlockProperty::GetUserType($item['USER_TYPE']);

                        if($item["PROPERTY_TYPE"] == "S") {
                            $dictionaryID[] = $rowData["VALUE"];
                        }

                        if($item["PROPERTY_TYPE"] == "E" && $item['USER_TYPE'] == '') {
                            $elementDictionary[] = $rowData['VALUE'];
                        }

                        if($item["PROPERTY_TYPE"] == "G" && $item['USER_TYPE'] == '') {
                            $sectionDictionary[] = $rowData['VALUE'];
                        }

                        if($item['USER_TYPE'] == 'directory' && isset($arUserType['GetExtendedValue'])) {
                            $tableName = $item['USER_TYPE_SETTINGS']['TABLE_NAME'];
                            $directoryPredict[$tableName]['PROPERTY'] = [
                                'PID'                => $item['ID'],
                                'USER_TYPE_SETTINGS' => $item['USER_TYPE_SETTINGS'],
                                'GetExtendedValue'   => $arUserType['GetExtendedValue'],
                            ];
                            $directoryPredict[$tableName]['VALUE'][] = $rowData["VALUE"];
                        }
                    } else {
                        $priceId = \Bitrix\Iblock\PropertyIndex\Storage::facetIdToPriceId($facetId);
                        foreach($result["PRICES"] as $NAME => $arPrice) {
                            if($arPrice["ID"] == $priceId && isset($result['ITEMS'][$NAME])) {
                                $this->objectSmartFilter->fillItemPrices($result['ITEMS'][$NAME], $rowData);

                                if(isset($result['ITEMS'][$NAME]["~CURRENCIES"])) {
                                    $result["CURRENCIES"] += $result['ITEMS'][$NAME]["~CURRENCIES"];
                                }

                                if($rowData["VALUE_FRAC_LEN"] > 0) {
                                    $result['ITEMS'][$PID]["DECIMALS"] = $rowData["VALUE_FRAC_LEN"];
                                }
                            }
                        }
                    }

                    if($cntProperty > 200) {
                        $this->objectSmartFilter->predictIBElementFetch($elementDictionary);
                        $this->objectSmartFilter->predictIBSectionFetch($sectionDictionary);
                        $this->objectSmartFilter->processProperties(
                            $result,
                            $tmpProperty,
                            $dictionaryID,
                            $directoryPredict
                        );
                        $cntProperty = 0;
                        $tmpProperty = [];
                        $dictionaryID = [];
                        $lookupDictionary = [];
                        $directoryPredict = [];
                        $elementDictionary = [];
                        $sectionDictionary = [];
                    }
                }

                $this->objectSmartFilter->predictIBElementFetch($elementDictionary);
                $this->objectSmartFilter->predictIBSectionFetch($sectionDictionary);
                $this->objectSmartFilter->processProperties(
                    $result,
                    $tmpProperty,
                    $dictionaryID,
                    $directoryPredict
                );
                \CTimeZone::Enable();
            } else {
                $arElementFilter = [
                    "IBLOCK_ID"         => $this->objectSmartFilter->IBLOCK_ID,
                    "SUBSECTION"        => $this->objectSmartFilter->SECTION_ID,
                    "SECTION_SCOPE"     => "IBLOCK",
                    "ACTIVE_DATE"       => "Y",
                    "ACTIVE"            => "Y",
                    "CHECK_PERMISSIONS" => "Y",
                    'MIN_PERMISSION'    => 'R',
                    'PERMISSIONS_BY'    => $this->getUserId(),
                ];

                if($this->objectSmartFilter->arParams['HIDE_NOT_AVAILABLE']) {
                    $arElementFilter['AVAILABLE'] = 'Y';
                }

                $arElements = [];

                if(!empty($this->objectSmartFilter->arResult["PROPERTY_ID_LIST"])) {
                    $rsElements = \CIBlockElement::GetPropertyValues(
                        $this->objectSmartFilter->IBLOCK_ID,
                        $arElementFilter,
                        false,
                        ['ID' => $this->objectSmartFilter->arResult["PROPERTY_ID_LIST"]]
                    );
                    while($arElement = $rsElements->Fetch()) {
                        $arElements[$arElement["IBLOCK_ELEMENT_ID"]] = $arElement;
                    }
                } else {
                    $rsElements = \CIBlockElement::GetList(
                        ['ID' => 'ASC'],
                        $arElementFilter,
                        false,
                        false,
                        ['ID', 'IBLOCK_ID']
                    );
                    while($arElement = $rsElements->Fetch()) {
                        $arElements[$arElement["ID"]] = [];
                    }
                }

                if(!empty($arElements) && $this->objectSmartFilter->SKU_IBLOCK_ID
                    && $this->objectSmartFilter->arResult["SKU_PROPERTY_COUNT"] > 0
                ) {
                    $arSkuFilter = [
                        "IBLOCK_ID"                                              => $this->objectSmartFilter->SKU_IBLOCK_ID,
                        "ACTIVE_DATE"                                            => "Y",
                        "ACTIVE"                                                 => "Y",
                        "CHECK_PERMISSIONS"                                      => "Y",
                        'MIN_PERMISSION'                                         => 'R',
                        'PERMISSIONS_BY'                                         => $this->getUserId(),
                        "=PROPERTY_".$this->objectSmartFilter->SKU_PROPERTY_ID => array_keys($arElements),
                    ];
                    if($this->objectSmartFilter->arParams['HIDE_NOT_AVAILABLE']) {
                        $arSkuFilter['AVAILABLE'] = 'Y';
                    }

                    $rsElements = \CIBlockElement::GetPropertyValues(
                        $this->objectSmartFilter->SKU_IBLOCK_ID,
                        $arSkuFilter,
                        false,
                        ['ID' => $this->objectSmartFilter->arResult["SKU_PROPERTY_ID_LIST"]]
                    );
                    while($arSku = $rsElements->Fetch()) {
                        foreach($result["ITEMS"] as $PID => $arItem) {
                            if(isset($arSku[$PID]) && $arSku[$this->objectSmartFilter->SKU_PROPERTY_ID] > 0) {
                                if(is_array($arSku[$PID])) {
                                    foreach($arSku[$PID] as $value) {
                                        $arElements[$arSku[$this->objectSmartFilter->SKU_PROPERTY_ID]][$PID][]
                                            = $value;
                                    }
                                } else {
                                    $arElements[$arSku[$this->objectSmartFilter->SKU_PROPERTY_ID]][$PID][]
                                        = $arSku[$PID];
                                }
                            }
                        }
                    }
                }

                \CTimeZone::Disable();
                $uniqTest = [];
                foreach($arElements as $arElement) {
                    $propertyValues = $propertyEmptyValuesCombination;
                    $uniqStr = '';
                    foreach($result["ITEMS"] as $PID => $arItem) {
                        if(is_array($arElement[$PID])) {
                            foreach($arElement[$PID] as $value) {
                                $key = $this->objectSmartFilter->fillItemValues($result["ITEMS"][$PID], $value);
                                $propertyValues[$PID][$key] = $result["ITEMS"][$PID]["VALUES"][$key]["VALUE"];
                                $uniqStr .= '|'.$key.'|'.$propertyValues[$PID][$key];
                            }
                        } elseif($arElement[$PID] !== false) {
                            $key = $this->objectSmartFilter->fillItemValues($result["ITEMS"][$PID], $arElement[$PID]);
                            $propertyValues[$PID][$key] = $result["ITEMS"][$PID]["VALUES"][$key]["VALUE"];
                            $uniqStr .= '|'.$key.'|'.$propertyValues[$PID][$key];
                        }
                    }

                    $uniqCheck = md5($uniqStr);
                    if(isset($uniqTest[$uniqCheck])) {
                        continue;
                    }
                    $uniqTest[$uniqCheck] = true;

                    $this->objectSmartFilter->ArrayMultiply($result["COMBO"], $propertyValues);
                }
                \CTimeZone::Enable();

                $arSelect = ["ID", "IBLOCK_ID"];
                foreach($result["PRICES"] as &$value) {
                    if(!$value['CAN_VIEW'] && !$value['CAN_BUY']) {
                        continue;
                    }
                    $arSelect = array_merge($arSelect, $value["SELECT_EXTENDED"]);
                    $arElementFilter["DEFAULT_PRICE_FILTER_".$value["ID"]] = 1;
                    if(isset($arSkuFilter)) {
                        $arSkuFilter["DEFAULT_PRICE_FILTER_".$value["ID"]] = 1;
                    }
                }
                unset($value);

                $rsElements = \CIBlockElement::GetList([], $arElementFilter, false, false, $arSelect);
                while($arElement = $rsElements->Fetch()) {
                    foreach($result["PRICES"] as $NAME => $arPrice) {
                        if(isset($result["ITEMS"][$NAME])) {
                            $this->objectSmartFilter->fillItemPrices($result["ITEMS"][$NAME], $arElement);
                        }
                    }
                }

                if(isset($arSkuFilter)) {
                    $rsElements = \CIBlockElement::GetList([], $arSkuFilter, false, false, $arSelect);
                    while($arSku = $rsElements->Fetch()) {
                        foreach($result["PRICES"] as $NAME => $arPrice) {
                            if(isset($result["ITEMS"][$NAME])) {
                                $this->objectSmartFilter->fillItemPrices($result["ITEMS"][$NAME], $arSku);
                            }
                        }
                    }
                }
            }

            foreach($result["ITEMS"] as $PID => $arItem) {
                uasort($result["ITEMS"][$PID]["VALUES"], [$this->objectSmartFilter, "_sort"]);
            }
        }

        /**
         * FITLER
         */
        if(count($this->filter)) {
            $allCHECKED = array();
            $facetIndex = array();
            foreach($result["ITEMS"] as $PID => $arItem)
            {
                foreach($arItem["VALUES"] as $key => $ar)
                {
                    if ($result["FACET_FILTER"] && isset($ar["FACET_VALUE"]))
                    {
                        $facetIndex[$PID][$ar["FACET_VALUE"]] = &$result["ITEMS"][$PID]["VALUES"][$key];
                    }

                    if(!empty($this->filter['PROPERTY_'.$arItem['CODE']]))
                    {
                        if($arItem["PROPERTY_TYPE"] == "N")
                        {
                            //$result["ITEMS"][$PID]["VALUES"][$key]["HTML_VALUE"] = htmlspecialcharsbx($_CHECK[$ar["CONTROL_NAME"]]);
                            $result["ITEMS"][$PID]["DISPLAY_EXPANDED"] = "Y";
                            if ($result["FACET_FILTER"] /*&& strlen($_CHECK[$ar["CONTROL_NAME"]]) > 0*/)
                            {
                                if ($key == "MIN")
                                    $this->objectSmartFilter->getFacet()->addNumericPropertyFilter($PID, ">=", $this->filter['PROPERTY_'.$arItem['CODE']]);
                                elseif ($key == "MAX")
                                    $this->objectSmartFilter->getFacet()->addNumericPropertyFilter($PID, "<=", $this->filter['PROPERTY_'.$arItem['CODE']]);
                            }
                        }
                        elseif(isset($arItem["PRICE"]))
                        {
                            //$result["ITEMS"][$PID]["VALUES"][$key]["HTML_VALUE"] = htmlspecialcharsbx($_CHECK[$ar["CONTROL_NAME"]]);
                            $result["ITEMS"][$PID]["DISPLAY_EXPANDED"] = "Y";
                            if ($result["FACET_FILTER"] /*&& strlen($_CHECK[$ar["CONTROL_NAME"]]) > 0*/)
                            {
                                if ($key == "MIN")
                                    $this->objectSmartFilter->getFacet()->addPriceFilter($result["PRICES"][$PID]["ID"], ">=", $this->filter['PROPERTY_'.$arItem['CODE']]);
                                elseif ($key == "MAX")
                                    $this->objectSmartFilter->getFacet()->addPriceFilter($result["PRICES"][$PID]["ID"], "<=", $this->filter['PROPERTY_'.$arItem['CODE']]);
                            }
                        }
                        elseif($arItem["DISPLAY_TYPE"] == "U")
                        {
                            //$result["ITEMS"][$PID]["VALUES"][$key]["HTML_VALUE"] = htmlspecialcharsbx($_CHECK[$ar["CONTROL_NAME"]]);
                            $result["ITEMS"][$PID]["DISPLAY_EXPANDED"] = "Y";
                            if ($result["FACET_FILTER"] /*&& strlen($_CHECK[$ar["CONTROL_NAME"]]) > 0*/)
                            {
                                if ($key == "MIN")
                                    $this->objectSmartFilter->getFacet()->addDatetimePropertyFilter($PID, ">=", MakeTimeStamp($this->filter['PROPERTY_'.$arItem['CODE']], FORMAT_DATE));
                                elseif ($key == "MAX")
                                    $this->objectSmartFilter->getFacet()->addDatetimePropertyFilter($PID, "<=", MakeTimeStamp($this->filter['PROPERTY_'.$arItem['CODE']], FORMAT_DATE) + 23*3600+59*60+59);
                            }
                        } else {
                            $result["ITEMS"][$PID]["VALUES"][$key]["CHECKED"] = true;
                            $result["ITEMS"][$PID]["DISPLAY_EXPANDED"] = "Y";
                            $allCHECKED[$PID][$ar["VALUE"]] = true;
                            if ($result["FACET_FILTER"])
                            {
                                if ($arItem["USER_TYPE"] === "DateTime")
                                    $this->objectSmartFilter->getFacet()->addDatetimePropertyFilter($PID, "=", MakeTimeStamp($ar["VALUE"], FORMAT_DATE));
                                else
                                    $this->objectSmartFilter->getFacet()->addDictionaryPropertyFilter($PID, "=", $ar["FACET_VALUE"]);
                            }
                        }
                        /*elseif($_CHECK[$ar["CONTROL_NAME"]] == $ar["HTML_VALUE"])
                        {
                            $result["ITEMS"][$PID]["VALUES"][$key]["CHECKED"] = true;
                            $result["ITEMS"][$PID]["DISPLAY_EXPANDED"] = "Y";
                            $allCHECKED[$PID][$ar["VALUE"]] = true;
                            if ($result["FACET_FILTER"])
                            {
                                if ($arItem["USER_TYPE"] === "DateTime")
                                    $this->objectSmartFilter->getFacet()->addDatetimePropertyFilter($PID, "=", MakeTimeStamp($ar["VALUE"], FORMAT_DATE));
                                else
                                    $this->objectSmartFilter->getFacet()->addDictionaryPropertyFilter($PID, "=", $ar["FACET_VALUE"]);
                            }
                        }
                        elseif($_CHECK[$ar["CONTROL_NAME_ALT"]] == $ar["HTML_VALUE_ALT"])
                        {
                            $result["ITEMS"][$PID]["VALUES"][$key]["CHECKED"] = true;
                            $result["ITEMS"][$PID]["DISPLAY_EXPANDED"] = "Y";
                            $allCHECKED[$PID][$ar["VALUE"]] = true;
                            if ($result["FACET_FILTER"])
                            {
                                $this->objectSmartFilter->getFacet()->addDictionaryPropertyFilter($PID, "=", $ar["FACET_VALUE"]);
                            }
                        }*/
                    }
                }
            }



            if ($result["FACET_FILTER"])
            {
                if (!$this->objectSmartFilter->getFacet()->isEmptyWhere())
                {
                    foreach ($result["ITEMS"] as $PID => &$arItem)
                    {
                        if ($arItem["PROPERTY_TYPE"] != "N" && !isset($arItem["PRICE"]))
                        {
                            foreach ($arItem["VALUES"] as $key => &$arValue)
                            {
                                $arValue["DISABLED"] = true;
                                $arValue["ELEMENT_COUNT"] = 0;
                            }
                            unset($arValue);
                        }
                    }
                    unset($arItem);

                    if ($result["CURRENCIES"])
                        $this->objectSmartFilter->getFacet()->enableCurrencyConversion($this->convertCurrencyId, array_keys($result["CURRENCIES"]));

                    $res = $this->objectSmartFilter->getFacet()->query($result["FACET_FILTER"]);
                    while ($row = $res->fetch())
                    {
                        $facetId = $row["FACET_ID"];
                        if (\Bitrix\Iblock\PropertyIndex\Storage::isPropertyId($facetId))
                        {
                            $pp = \Bitrix\Iblock\PropertyIndex\Storage::facetIdToPropertyId($facetId);
                            if ($result["ITEMS"][$pp]["PROPERTY_TYPE"] == "N")
                            {
                                if (is_array($result["ITEMS"][$pp]["VALUES"]))
                                {
                                    $result["ITEMS"][$pp]["VALUES"]["MIN"]["FILTERED_VALUE"] = $row["MIN_VALUE_NUM"];
                                    $result["ITEMS"][$pp]["VALUES"]["MAX"]["FILTERED_VALUE"] = $row["MAX_VALUE_NUM"];
                                }
                            }
                            else
                            {
                                if (isset($facetIndex[$pp][$row["VALUE"]]))
                                {
                                    unset($facetIndex[$pp][$row["VALUE"]]["DISABLED"]);
                                    $facetIndex[$pp][$row["VALUE"]]["ELEMENT_COUNT"] = $row["ELEMENT_COUNT"];
                                }
                                elseif (isset($result["ITEMS"][$pp]["VALUES"]))
                                {
                                    if (isset($result["ITEMS"][$pp]["VALUES"]["MIN"]))
                                    {
                                        unset($result["ITEMS"][$pp]["VALUES"]["MIN"]["DISABLED"]);
                                        $result["ITEMS"][$pp]["VALUES"]["MIN"]["ELEMENT_COUNT"] = $row["ELEMENT_COUNT"];
                                    }
                                    if (isset($result["ITEMS"][$pp]["VALUES"]["MAX"]))
                                    {
                                        unset($result["ITEMS"][$pp]["VALUES"]["MAX"]["DISABLED"]);
                                        $result["ITEMS"][$pp]["VALUES"]["MAX"]["ELEMENT_COUNT"] = $row["ELEMENT_COUNT"];
                                    }
                                }
                            }
                        }
                        else
                        {
                            $priceId = \Bitrix\Iblock\PropertyIndex\Storage::facetIdToPriceId($facetId);
                            foreach($result["PRICES"] as $NAME => $arPrice)
                            {
                                if (
                                    $arPrice["ID"] == $priceId
                                    && isset($result["ITEMS"][$NAME])
                                    && is_array($result["ITEMS"][$NAME]["VALUES"])
                                )
                                {
                                    $currency = $row["VALUE"];
                                    $existCurrency = strlen($currency) > 0;
                                    if ($existCurrency)
                                        $currency = $this->objectSmartFilter->getFacet()->lookupDictionaryValue($currency);

                                    $priceValue = $this->objectSmartFilter->convertPrice($row["MIN_VALUE_NUM"], $currency);
                                    if (
                                        !isset($result["ITEMS"][$NAME]["VALUES"]["MIN"]["FILTERED_VALUE"])
                                        || $result["ITEMS"][$NAME]["VALUES"]["MIN"]["FILTERED_VALUE"] > $priceValue
                                    )
                                    {
                                        $result["ITEMS"][$NAME]["VALUES"]["MIN"]["FILTERED_VALUE"] = $priceValue;
                                    }

                                    $priceValue = $this->objectSmartFilter->convertPrice($row["MAX_VALUE_NUM"], $currency);
                                    if (
                                        !isset($result["ITEMS"][$NAME]["VALUES"]["MAX"]["FILTERED_VALUE"])
                                        || $result["ITEMS"][$NAME]["VALUES"]["MAX"]["FILTERED_VALUE"] > $priceValue
                                    )
                                    {
                                        $result["ITEMS"][$NAME]["VALUES"]["MAX"]["FILTERED_VALUE"] = $priceValue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        $result['ITEMS'] = $this->prepareItems($result['ITEMS']);
        return $result['ITEMS'];

        /*$arElementFilter = [
            "IBLOCK_ID"         => $this->objectSmartFilter->IBLOCK_ID,
            "SUBSECTION"        => $this->objectSmartFilter->SECTION_ID,
            "SECTION_SCOPE"     => "IBLOCK",
            "ACTIVE_DATE"       => "Y",
            "ACTIVE"            => "Y",
            "CHECK_PERMISSIONS" => "Y",
            'MIN_PERMISSION'    => 'R',
            'PERMISSIONS_BY'    => $this->getUserId(),
        ];

        if($this->objectSmartFilter->arParams['HIDE_NOT_AVAILABLE']) {
            $arElementFilter['AVAILABLE'] = 'Y';
        }

        //$this->filter = array_filter($this->filter, fn($k) => str_contains((string)$k, 'PROPERTY_'), ARRAY_FILTER_USE_KEY);
        if($this->filter) {
            $arElementFilter = array_merge($this->filter, $arElementFilter);
        }

        $result["ELEMENT_COUNT"] = \CIBlockElement::GetList(array(), $arElementFilter, array(), false);

        return [
            'data' => $result['ITEMS'],
            'info' => [
                'count' => $result['ELEMENT_COUNT'] ?? 0,
                'filter' => $arElementFilter
            ]
        ];*/
    }

    public function select(array $array = [])
    {
        if($array === ['*']) {
            $array = [];
        }
        $this->select = $array;

        return $this;
    }

    public function filter(array $array = [])
    {
        $this->filter = $array;

        return $this;
    }


    protected function preparePrices()
    {
        // prices preparation
        $this->prices->setUserId($this->getUserId());
        $priceCodes = $this->prices->getPricesType();
        if($priceCodes) {
            $priceCodes = array_map(
                function($v) {
                    return $v['NAME'];
                }, $priceCodes
            );

            if(!empty($this->filter["PRICE_CODE"])) {
                $priceCodes = array_intersect($this->filter["PRICE_CODE"], $priceCodes);
            }
        } else {
            throw new CatalogException(l::get('ERROR_FILTER_EMPTY_PRICE_CODE'), StatusCode::STATUS_BAD_REQUEST);
        }

        $this->avaliblePrices = $priceCodes;
    }

    protected function prepareSmartFilter()
    {
        $this->objectSmartFilter->userId = $this->getUserId();
        $this->iblockId = $this->objectSmartFilter->IBLOCK_ID =  (int) $this->filter['IBLOCK_ID'];
        $this->objectSmartFilter->setFacet($this->iblockId);

        // section id
        if(isset($this->filter['SECTION_ID'])) {
            $this->sectionId = $this->objectSmartFilter->SECTION_ID = (int) $this->filter['SECTION_ID'];
        }

        // SKU
        $skuInfo = \CCatalogSKU::GetInfoByProductIBlock($this->iblockId);
        if($skuInfo) {
            $this->skuIblockId = $this->objectSmartFilter->SKU_IBLOCK_ID = $skuInfo['IBLOCK_ID'];
            $this->skuPropertyId = $this->objectSmartFilter->SKU_PROPERTY_ID = $skuInfo['SKU_PROPERTY_ID'];
        }/* else {
            throw new CatalogException(l::get('ERROR_CATALOG_NOT_FOUND'), StatusCode::STATUS_BAD_REQUEST);
        }*/

        // prepare params for smart filter class
        $this->objectSmartFilter->SAFE_FILTER_NAME = self::FILTER_NAME;
        $this->objectSmartFilter->arParams = $this->objectSmartFilter->onPrepareComponentParams(
            [
                'IBLOCK_ID' => $this->iblockId,
                'SECTION_ID' => $this->sectionId,
                'PRICE_CODE' => $this->avaliblePrices,
                'CONVERT_CURRENCY' => $this->currencyConvert ? 'Y' : 'N',
                'CURRENCY_ID' => $this->currencyConvert,
                'HIDE_NOT_AVAILABLE' => $this->getConfig()->getHideNotAvailable(),
                'FILTER_NAME' => self::FILTER_NAME,
                'SAFE_FILTER_NAME' => self::FILTER_NAME
            ]);
    }

    protected function prepareItems($array)
    {
        $result = [];
        $select = ($this->select ?: self::SELECT_FILTER);

        if(is_array($array)) {
            foreach($array as $key=>$val) {
                if(is_array($val['VALUES'])) {

                    // skip empty
                    if(empty($val['VALUES'])) {
                        continue;
                    }

                    // skip empty price
                    if(!empty($val['PRICE'])) {
                        if(empty($val['VALUES']['MIN']['VALUE']) && empty($val['VALUES']['MAX']['VALUE'])) {
                            continue;
                        }

                        // add currency format
                        if(is_array($val['CURRENCIES'])) {
                            $format = $this->getCurrencyFormat(array_keys($val['CURRENCIES']));
                            foreach($val['CURRENCIES'] as $currencyId => $currencyName) {
                                $val['CURRENCIES'][$currencyId] = $format[$currencyId];
                            }
                        }
                    }


                    // select
                    $resultValues = [];
                    foreach($val['VALUES'] as $k=>$v) {
                        if(is_array($v['FILE']) && !empty($v['FILE']['SRC'])) {
                            $v['FILE'] = $v['FILE']['SRC'];
                        }
                        if($val['USER_TYPE'] === self::USER_TYPE_DIRECTORY) {
                            $v['CODE'] = $k;
                        }


                        if(!empty($val['PRICE']) && ($k === 'MIN' || $k === 'MAX')) {
                            $resultValues[$k] = array_intersect_key($v, array_flip($select));
                        } else {
                            $resultValues[] = array_intersect_key(array_merge(['VALUE_ID' => $k], $v), array_flip($select));
                            //$resultValues[] = array_merge(['VALUE_ID' => $k], $v);
                        }
                    }
                    $val['VALUES'] = $resultValues;

                }

                $result[] = array_intersect_key($val, array_flip($select));
            }
        }

        return $result;
    }


}