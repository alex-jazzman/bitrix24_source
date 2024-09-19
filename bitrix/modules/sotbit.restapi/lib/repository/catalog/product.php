<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Catalog;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Core\Helper;
use Sotbit\RestAPI\Exception\CatalogException;
use Sotbit\RestAPI\Exception\OrderException,
    Sotbit\RestAPI\Core,
    Sotbit\RestAPI\Localisation as l,
    Sotbit\RestAPI\Repository\CatalogRepository,
    Sotbit\RestAPI\Repository\Catalog\Filter;

use Bitrix\Sale,
    Bitrix\Catalog,
    Bitrix\Main\Entity,
    Bitrix\Main\Loader,
    Bitrix\Main\Type\DateTime,
    Bitrix\Main\UserTable,
    Bitrix\Sale\Cashbox\CheckManager,
    Bitrix\Main\Config\Option,
    Bitrix\Catalog\ProductTable,
    Bitrix\Currency,
    Bitrix\Iblock;

class Product extends CatalogRepository
{
    public $prices;
    public $vats;
    public $search;
    public $user;
    public $productTypes;
    public $roundingRule;
    public $vatList;
    public $listHL;

    public $vatIncludeComponent;

    public const FIELD_ELEMENT = [
        'ID', 'IBLOCK_ID', 'CODE', 'XML_ID', 'NAME', 'ACTIVE', 'DATE_ACTIVE_FROM', 'DATE_ACTIVE_TO', 'SORT',
        'PREVIEW_TEXT', 'PREVIEW_TEXT_TYPE', 'DETAIL_TEXT', 'DETAIL_TEXT_TYPE', 'DATE_CREATE', 'CREATED_BY', 'TAGS',
        'TIMESTAMP_X', 'MODIFIED_BY', 'IBLOCK_SECTION_ID', 'DETAIL_PAGE_URL', 'DETAIL_PICTURE', 'PREVIEW_PICTURE'
    ];

    public const FIELD_ELEMENT_REQUEST = [
        'ID', 'CODE'
    ];

    public const FIELD_PROPERTIES = ['ID', 'NAME', 'CODE', 'DEFAULT_VALUE', 'PROPERTY_TYPE', 'PROPERTY_VALUE_ID', 'LIST_TYPE', 'MULTIPLE',
        'XML_ID', 'FILE_TYPE', 'FILTRABLE', 'VALUE_ENUM', 'VALUE_XML_ID', 'VALUE', 'DESCRIPTION'];

    public const SEARCH_DEFAULT_GUESS_LANGUAGE = false;
    public const SEARCH_DEFAULT_NO_WORD_LOGIC = false;
    public const SEARCH_DEFAULT_WITHOUT_MORPHOLOGY = false;

    /**
     * Product constructor.
     *
     * @param  null|array  $settings
     *
     * @throws \Bitrix\Main\LoaderException
     */
    public function __construct()
    {
        parent::__construct();

        $this->prices = new Price();
        $this->vats = new Vat();
        $this->search = new Search();

        // config
        $pricesSelect = $this->getConfig()->getCatalogPrices();
        $this->prices->setPricesSelect($pricesSelect);
        $this->vatIncludeComponent = $this->getConfig()->isVatIncluded();


        // product types
        if(empty($this->productTypes)) {
            $this->productTypes = ProductTable::getProductTypes(true);
        }

        // rounding rule
        if(empty($this->roundingRule)) {
            $this->roundingRule = $this->prices->getRoundingRule(['select' => ['ID', 'CATALOG_GROUP_ID', 'PRICE', 'ROUND_TYPE', 'ROUND_PRECISION']]);
        }

        // vat
        if(empty($this->vatList)) {
            $this->vatList = $this->vats->list(['select' => ['ID', 'NAME', 'RATE'], 'filter' => ['ACTIVE' => 'Y']]);
            $this->vatList = $this->vatList['data'] ?? [];
        }

    }



    public function get(int $id) {
        $result = [];

        if(!$id) {
            throw new CatalogException(l::get('ERROR_CATALOG_PRODUCT_ID_EMPTY'), StatusCode::STATUS_BAD_REQUEST);
        }
        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }

        // get and check iblock
        $iblockId = \CIBlockElement::GetIBlockByID($id);
        if(!$iblockId) {
            throw new CatalogException(l::get('ERROR_CATALOG_PRODUCT_NOT_FOUND'), StatusCode::STATUS_NOT_FOUND);
        }

        // checking the selected infoblock for type
        $iblockData = \CCatalogSku::GetInfoByIBlock($iblockId);
        $allowedTypes = $this->getProductTypes($iblockData['CATALOG_TYPE']);
        if(empty($allowedTypes) || $iblockData['CATALOG'] !== 'Y') {
            throw new CatalogException(l::get('ERROR_IBLOCK_NOT_CATALOG'), StatusCode::STATUS_BAD_REQUEST);
        }
        $iblockOfferId = $iblockData['IBLOCK_ID'];


        // prices preparation
        $this->prices->setUserId($this->getUserId());



        $data = $this->getElements([
            'filter' => [
                '=ID' => $id
            ],
            'limit' => 1
        ]);

        if(!$data) {
            throw new CatalogException(l::get('ERROR_CATALOG_PRODUCT_NOT_FOUND'), StatusCode::STATUS_NOT_FOUND);
        }

        $data = $data[$id];
        $id = $data['ID'];
        $product = $this->getProducts([$id]);

        $selectProperties = [];
        if($this->isPropertyFeature()) {
            $selectProperties = Iblock\Model\PropertyFeature::getDetailPageShowProperties(
                $iblockId,
                ['CODE' => 'Y']
            );
            $offerTreeProp = Catalog\Product\PropertyCatalogFeature::getOfferTreePropertyCodes(
                $iblockOfferId,
                ['CODE' => 'Y']
            );
        } else {
            // config
            $selectProperties = $this->getConfig()->getDetailProperties();
            $offerTreeProp = $this->getConfig()->getOfferTreeProps();
        }

        $data['PROPERTIES'] = ($selectProperties ? $this->getPropertyValues([$id], $data['IBLOCK_ID'], $selectProperties)[$id] : []);
        $data['PRODUCT'] = $product[$id];
        $data['PRICES'] = $this->getProductPrices($product)[$id];
        $data['OFFERS'] = $this->getProductOffers([$id], $iblockData['CATALOG_TYPE'], self::TYPE_DETAIL)[$id];

        if($data['PRODUCT']['TYPE_IS_OFFER'] === 'Y') {
            $data['PRODUCT']['OFFER_TREE_PROPS'] = [];
        }

        if($data['PRODUCT']['TYPE_IS_OFFER'] === 'Y' && $offerTreeProp /*&& array_keys($data['PROPERTIES'])*/) {
           // $data['OFFER_TREE_PROPS'] = array_intersect(array_keys($data['PROPERTIES']), $offerTreeProp);
            $data['PRODUCT']['OFFER_TREE_PROPS'] = $offerTreeProp;
        }

        // amount store
        /*$productAmount = $this->getStoreProduct(array_keys($data));
        if(is_array($productAmount) && count($productAmount)) {
            foreach($productAmount as $v) {
                $data[$v['PRODUCT_ID']]['AMOUNT_STORE'][$v['STORE_ID']] = array_diff_key($v, array_flip(['STORE_ID', 'PRODUCT_ID']));
            }
        }*/

        // collect data
        $result['data'] = $data ?: [];

        return $result;
    }

    /**
     * Product list
     * @param  array  $params
     *
     * @return array
     * @throws CatalogException
     */
    public function list(array $params): array
    {
        if($this->getUserId() === null) {
            throw new CatalogException(l::get('EMPTY_USER_ID'), StatusCode::STATUS_UNAUTHORIZED);
        }


        $result = [];
        $data = [];
        $collect = [];

        // checking the selected infoblock for type
        $iblockId  = (int) $params['filter']['IBLOCK_ID'];
        $sectionId = (int) $params['filter']['SECTION_ID'];

        $iblockData = \CCatalogSku::GetInfoByIBlock($iblockId);
        $allowedTypes = $this->getProductTypes($iblockData['CATALOG_TYPE']);
        if(empty($allowedTypes) || $iblockData['CATALOG'] !== 'Y') {
            throw new CatalogException(l::get('ERROR_IBLOCK_NOT_CATALOG'), StatusCode::STATUS_BAD_REQUEST);
        }
        $iblockOfferId = $iblockData['IBLOCK_ID'];

        /*if($iblockOfferId) {
            $params['filter']['IBLOCK_ID'] = [$iblockId, $iblockOfferId];
        }*/


        // Search
        // if search, return elements ids in filter
        if(!empty($params['search'])) {
            $searchSettings = [];
            $searchSettings['query'] = $params['search'];

            // config
            $searchSettings['iblockId'] = $this->getConfig()->getCatalogId() ?? $iblockId;
            $searchSettings['guessLanguage'] = $this->getConfig()->getSearchLanguageGuess() ?? self::SEARCH_DEFAULT_GUESS_LANGUAGE;
            $searchSettings['noWordLogic'] =  $this->getConfig()->getSearchNoWordLogic() ?? self::SEARCH_DEFAULT_NO_WORD_LOGIC;
            $searchSettings['withoutMorphology'] = $this->getConfig()->getSearchWithoutMorphology() ?? self::SEARCH_DEFAULT_WITHOUT_MORPHOLOGY;


            $searchElementIds = $this->search->setSettings($searchSettings)->execute();

            if($searchElementIds) {
                $params['filter']['ID'] = $searchElementIds;
            } else {
                $params['filter']['=ID'] = 0;
            }
        }

        $selectProperties = [];
        if($this->isPropertyFeature()) {

            $selectProperties = Iblock\Model\PropertyFeature::getListPageShowPropertyCodes(
                $iblockId,
                ['CODE' => 'Y']
            );
            if($iblockOfferId) {
                $offerTreeProp = Catalog\Product\PropertyCatalogFeature::getOfferTreePropertyCodes(
                    $iblockOfferId,
                    ['CODE' => 'Y']
                );
            }


            /*$selectProperties = Iblock\Model\PropertyFeature::getDetailPageShowProperties(
                $iblockId,
                ['CODE' => 'Y']
            );*/
        } else {
            // config
            $selectProperties = $this->getConfig()->getSectionProperties();
            $offerTreeProp = $this->getConfig()->getOfferTreeProps();

        }


        // prices preparation
        $this->prices->setUserId($this->getUserId());

        // iblock elements
        $collect['ELEMENTS'] = $this->getElements($params);

        // elements IDS
        $elementIds = $collect['ELEMENTS'] ? array_keys($collect['ELEMENTS']) : [];



        // products
        $collect['PRODUCTS'] = $this->getProducts($elementIds);

        // prices
        $collect['PRICES'] = $this->getProductPrices($collect['PRODUCTS']);

        // properties
        $collect['PROPERTIES'] = ($selectProperties ? $this->getPropertyValues($elementIds, $iblockId, $selectProperties) : []);


        // offers
        //$collect['OFFERS'] = $this->getProductOffers($elementIds, $iblockData['CATALOG_TYPE'], self::TYPE_DETAIL);


        // collect all information
        foreach($collect['ELEMENTS'] as $elementId => $elementData) {
            $data[$elementId] = $elementData;

            $data[$elementId]['PROPERTIES'] = [];
            if(is_array($collect['PROPERTIES']) && count($collect['PROPERTIES'])) {
                $data[$elementId]['PROPERTIES'] = $collect['PROPERTIES'][$elementId];
            }

            $data[$elementId]['PRODUCT'] = [];
            if(isset($collect['PRODUCTS'][$elementId])) {
                $data[$elementId]['PRODUCT'] = $collect['PRODUCTS'][$elementId];
            }

            $data[$elementId]['PRICES'] = [];
            if(isset($collect['PRICES'][$elementId])) {
                $data[$elementId]['PRICES'] = $collect['PRICES'][$elementId];
            }


            if($data[$elementId]['PRODUCT']['TYPE_IS_OFFER'] === 'Y') {
                $data[$elementId]['PRODUCT']['OFFER_TREE_PROPS'] = [];
            }

            if($data[$elementId]['PRODUCT']['TYPE_IS_OFFER'] === 'Y' && $offerTreeProp /* && array_keys($data['PROPERTIES'])*/) {
                // $data['OFFER_TREE_PROPS'] = array_intersect(array_keys($data['PROPERTIES']), $offerTreeProp);
                $data[$elementId]['PRODUCT']['OFFER_TREE_PROPS'] = $offerTreeProp;
            }

            /*$data[$elementId]['OFFERS'] = [];
            if(is_array($collect['OFFERS']) && count($collect['OFFERS'])) {
                $data[$elementId]['OFFERS'] = $collect['OFFERS'][$elementId];
            }*/
        }

        // amount store
        /*$productAmount = $this->getStoreProduct(array_keys($collect));
        if(is_array($productAmount) && count($productAmount)) {
            foreach($productAmount as $v) {
                $collect[$v['PRODUCT_ID']]['AMOUNT_STORE'][$v['STORE_ID']] = array_diff_key($v, array_flip(['STORE_ID', 'PRODUCT_ID']));
            }
        }*/


        // count all
        //$countAll = \CIBlockElement::GetList([], $params['filter_default'], false, false, ['ID']);
        $countAll = \CIBlockElement::GetList([], $params['filter'], []);

        // data
        $result['data'] = $data ?: [];

        // info
        $result['info']['count_select'] = count($data) ?: 0;
        $result['info']['count_all'] = (int) $countAll;

        return $result;
    }

    /**
     * @param $params
     *
     * @return array
     */
    public function getElements($params): array
    {
        $elements = [];

        /*
$data = [
    'ID', 'IBLOCK_ID', 'CODE', 'XML_ID', 'NAME', 'ACTIVE', 'DATE_ACTIVE_FROM', 'DATE_ACTIVE_TO', 'SORT',
    'PREVIEW_TEXT', 'PREVIEW_TEXT_TYPE', 'DETAIL_TEXT', 'DETAIL_TEXT_TYPE', 'DATE_CREATE', 'CREATED_BY', 'TAGS',
    'TIMESTAMP_X', 'MODIFIED_BY', 'IBLOCK_SECTION_ID', 'DETAIL_PAGE_URL', 'DETAIL_PICTURE', 'PREVIEW_PICTURE'
];
*/
//        $filterObject = new Filter();
//        $filterList = $filterObject->setUserId($this->getUserId())->filter($params['filter'])->execute();
//
//        foreach($params['filter'])
//
//        var_dump($filterList);exit;
//
//        var_dump($params['filter']);



        $navParams = ['nPageSize' => $params['limit'], 'iNumPage' => $params['page']];
        $params['select'] = empty($params['select'])? self::FIELD_ELEMENT : array_unique(array_merge($params['select'], self::FIELD_ELEMENT_REQUEST));

        // config
        switch($this->getConfig()->getHideNotAvailable()) {
            case 'Y':
                $params['filter']['AVAILABLE'] = 'Y';
                break;
            case 'L':
                $params['order'] = array_merge(['CATALOG_AVAILABLE' => 'desc'], $params['order'] ?? []);
                break;
        }


        $req = \CIBlockElement::GetList($params['order'], $params['filter'], false,  $navParams, $params['select']);

        while ($element = $req->fetch()) {
            /*\Bitrix\Iblock\Component\Tools::getFieldImageData(
                $l,
                array('PREVIEW_PICTURE', 'DETAIL_PICTURE'),
                \Bitrix\Iblock\Component\Tools::IPROPERTY_ENTITY_ELEMENT,
                ''
            );*/
            $elements[$element['ID']] = $this->prepareReturn($element, self::TYPE_DETAIL);
        }


        // delete offers



        return $elements;
    }

    protected function getElementPrices(array $elementIds): array
    {
        $prices = [];

        if(count($elementIds)) {
            // prices type
            $priceIds = $this->prices->getPricesType();

            // product prices
            if(count($priceIds)) {
                $prices = $this->prices->list(
                    [
                        'select' => ['ID', 'PRODUCT_ID', 'PRICE', 'CURRENCY', 'QUANTITY_FROM', 'QUANTITY_TO'],
                        'filter' => [
                            '@PRODUCT_ID'       => $elementIds,
                            '@CATALOG_GROUP_ID' => array_keys($priceIds),
                        ],
                    ]
                );
                $prices = $prices['data'] ?? [];
            }
        }

        return $prices;
    }

    public function getProducts(array $elementIds): array
    {
        $products = [];

        if(count($elementIds)) {


            $existOffers = \CCatalogSKU::getExistOffers($elementIds);

            // offers id
            $arOffersIds = $existOffers ? array_keys(array_filter($existOffers)) : [];

            // no offers id
            $arNoOffersIds = array_diff($elementIds, $arOffersIds);

            // ratio
            $productRatioList = ProductTable::getCurrentRatioWithMeasure($arNoOffersIds);


            // products
            $select = ['ID', 'TYPE', 'AVAILABLE',
                'QUANTITY', 'QUANTITY_TRACE', 'CAN_BUY_ZERO',
                'WEIGHT', 'WIDTH', 'HEIGHT', 'LENGTH',
                'BARCODE_MULTI',
                'MEASURE',

                'VAT_ID', 'VAT_INCLUDED'
            ];
            $select = array_merge($select, \Bitrix\Catalog\Product\SystemField::getFieldList());

            $req = ProductTable::getList(
                [
                    'select' => $select,
                    'filter' => ['@ID' => $elementIds],
                ]
            );

            while($product = $req->fetch()) {

                if(in_array($product['ID'], $elementIds)) {

                    $product['TYPE_NAME'] = null;
                    $product['TYPE_IS_OFFER'] = "N";

                    // product type
                    if(isset($product['TYPE'], $this->productTypes[$product['TYPE']])) {
                        // type in words
                        $product['TYPE_NAME'] = $this->productTypes[$product['TYPE']];

                        // check type offers
                        $product['TYPE_IS_OFFER'] = ((int)$product['TYPE'] === \Bitrix\Catalog\ProductTable::TYPE_SKU)
                            ? 'Y' : 'N';
                    }


                    // product ratio
                    if(!empty($productRatioList) && isset($productRatioList[$product['ID']])) {
                        $product['MEASURE_RATIO']
                            = $product['DEFAULT_QUANTITY'] = $productRatioList[$product['ID']]['RATIO'];
                        $product['MEASURE_NAME'] = $productRatioList[$product['ID']]['MEASURE']['~SYMBOL_RUS'];
                    }
                }

                // config: show quantity
                $product['QUANTITY'] = $this->showQuantity($product['QUANTITY'], $product['MEASURE_RATIO']);

                // sort array
                if(is_array($product)) {
                    ksort($product);
                }

                // collect all information
                $products[$product['ID']] =  $product;
            }
        }

        return $products;
    }

    protected function getProductPrices(&$products): array
    {
        $result = [];
        $currencies = [];

        if(!$products) {
            return $result;
        }

        $baseCurrency = Currency\CurrencyManager::getBaseCurrency();
        $userGroups = $this->getUserGroups();


        $productPrices = $this->getElementPrices(array_keys($products));

        foreach($products as $productId => &$product) {
            // prices
            if(isset($productPrices[$productId])) {

                // vat rate and name
                if(isset($product['TYPE'], $this->productTypes[$product['TYPE']])) {
                    $product['VAT_RATE'] = !empty($product['VAT_ID'])
                        ? (float)$this->vatList[$product['VAT_ID']]['RATE'] * 0.01 : 0.0;

                    if(!empty($product['VAT_ID'])) {
                        $product['VAT_NAME'] = $this->vatList[$product['VAT_ID']]['NAME'];
                    }
                }

                $productPrice = $productPrices[$productId];

                // if isset offers, get minimal discounted prices
                if($productOffers = \CCatalogSku::IsExistOffers($productId)) {
                    $offers = \CCatalogSKU::getOffersList($productId);
                    if($offers && isset($offers[$productId])) {
                        if(($offerProducts = $this->getProducts(array_keys($offers[$productId])))
                            && $offerPrices = $this->getProductPrices($offerProducts)
                        ) {
                            usort($offerPrices, function($a, $b) {
                                return $a['MINIMAL_PRICE']['PRICE'] <=> $b['MINIMAL_PRICE']['PRICE'];
                            });

                            $result[$productId] = $offerPrices[0];
                            continue;
                        }
                    }
                }


                $baseCurrency = Currency\CurrencyManager::getBaseCurrency();
                /** @var null|array $minimalPrice */
                $minimalPrice = null;
                /** @var null|array $minimalBuyerPrice */
                $minimalBuyerPrice = null;
                $fullPrices = array();


                $currencyConvertId = false;
                $currencyConvert = false;

                // config
                if($this->getConfig()->getCurrencyConvert()) {
                    $currencyConvertId = $this->getConfig()->getCurrencyConvert();
                    $currencyConvert = true;
                }

                $resultCurrency = ($currencyConvert ? $currencyConvertId : null);

                $percentVat = $vatRate = (float)$product['VAT_RATE'];
                $percentPriceWithVat = 1 + $percentVat;
                $vatInclude = $product['VAT_INCLUDED'] === 'Y';

                foreach($productPrice as $_productPrice) {


                    $priceType = (int)$_productPrice['CATALOG_GROUP_ID'];
                    $price = (float)$_productPrice['PRICE'];



                    if (!$vatInclude)
                        $price *= $percentPriceWithVat;
                    $currency = $_productPrice['CURRENCY'];

                    $changeCurrency = $currencyConvert && $currency !== $resultCurrency;
                    if ($changeCurrency)
                    {
                        $price = \CCurrencyRates::ConvertCurrency($price, $currency, $resultCurrency);
                        $currency = $resultCurrency;
                    }

                    $discounts = array();
                    if (\CIBlockPriceTools::isEnabledCalculationDiscounts())
                    {
                        \CCatalogDiscountSave::Disable();
                        $product['IBLOCK_ID'] = \CIBlockElement::GetIBlockByID($product['ID']);

                        $discounts = \CCatalogDiscount::GetDiscount(
                            $product['ID'],
                            $product['IBLOCK_ID'],
                            array($priceType),
                            $userGroups,
                            'N',
                            $this->getSiteId(),
                            array()
                        );
                        \CCatalogDiscountSave::Enable();
                    }
                    $discountPrice = \CCatalogProduct::CountPriceWithDiscount(
                        $price,
                        $currency,
                        $discounts
                    );


                    if ($discountPrice !== false)
                    {
                        $priceWithVat = array(
                            'UNROUND_BASE_PRICE' => $price,
                            'UNROUND_PRICE' => $discountPrice,
                            'BASE_PRICE' => \Bitrix\Catalog\Product\Price::roundPrice(
                                $priceType,
                                $price,
                                $currency
                            ),
                            'PRICE' => \Bitrix\Catalog\Product\Price::roundPrice(
                                $priceType,
                                $discountPrice,
                                $currency
                            )
                        );

                        $price /= $percentPriceWithVat;
                        $discountPrice /= $percentPriceWithVat;

                        $priceWithoutVat = array(
                            'UNROUND_BASE_PRICE' => $price,
                            'UNROUND_PRICE' => $discountPrice,
                            'BASE_PRICE' => \Bitrix\Catalog\Product\Price::roundPrice(
                                $priceType,
                                $price,
                                $currency
                            ),
                            'PRICE' => \Bitrix\Catalog\Product\Price::roundPrice(
                                $priceType,
                                $discountPrice,
                                $currency
                            )
                        );

                        if ($vatInclude)
                            $priceRow = $priceWithVat;
                        else
                            $priceRow = $priceWithoutVat;
                        $priceRow['ID'] = $_productPrice['ID'];
                        $priceRow['NAME'] = $_productPrice['NAME'] ?? '';
                        $priceRow['PRICE_TYPE_ID'] = $_productPrice['CATALOG_GROUP_ID'];
                        $priceRow['CURRENCY'] = $currency;

                        if (
                            empty($discounts)
                            || ($priceRow['BASE_PRICE'] <= $priceRow['PRICE'])
                        )
                        {
                            $priceRow['BASE_PRICE'] = $priceRow['PRICE'];
                            $priceRow['DISCOUNT'] = 0;
                            $priceRow['PERCENT'] = 0;
                        }
                        else
                        {
                            $priceRow['DISCOUNT'] = round($priceRow['BASE_PRICE'] - $priceRow['PRICE'], 2);
                            $priceRow['PERCENT'] = roundEx(100*$priceRow['DISCOUNT']/$priceRow['BASE_PRICE'], 0);
                        }
                        //if ($this->arParams['PRICE_VAT_SHOW_VALUE'])
                            $priceRow['VAT'] = ($vatRate > 0 ? round($priceWithVat['PRICE'] - $priceWithoutVat['PRICE'], 2) : 0);






                        //if ($this->arParams['FILL_ITEM_ALL_PRICES'])
                            $fullPrices[$priceType] = $priceRow;

                        // collect all use currencies for format info
                        $currencies[$priceRow['CURRENCY']] = [];

                        $priceRow['QUANTITY_FROM'] = $_productPrice['QUANTITY_FROM'];
                        $priceRow['QUANTITY_TO'] = $_productPrice['QUANTITY_TO'];
                        $priceRow['PRICE_SCALE'] = \CCurrencyRates::ConvertCurrency(
                            $priceRow['PRICE'],
                            $priceRow['CURRENCY'],
                            $baseCurrency
                        );

                        if ($minimalPrice === null || $minimalPrice['PRICE_SCALE'] > $priceRow['PRICE_SCALE'])
                            $minimalPrice = $priceRow;
                        if (isset($productPrices[$product['ID']][$priceRow['PRICE_TYPE_ID']]))
                        {
                            if ($minimalBuyerPrice === null || $minimalBuyerPrice['PRICE_SCALE'] > $priceRow['PRICE_SCALE'])
                                $minimalBuyerPrice = $priceRow;
                        }

                    }
                    unset($discounts);
                    unset($priceType);

                    $minimalPriceId = null;
                    if (is_array($minimalBuyerPrice))
                        $minimalPrice = $minimalBuyerPrice;
                    if (is_array($minimalPrice))
                    {
                        unset($minimalPrice['PRICE_SCALE']);
                        $minimalPriceId = $minimalPrice['PRICE_TYPE_ID'];
                        $prepareFields = array(
                            'BASE_PRICE', 'PRICE', 'DISCOUNT', 'VAT'
                        );

                        foreach ($prepareFields as $fieldName)
                        {
                            $minimalPrice['PRINT_'.$fieldName] = \CCurrencyLang::CurrencyFormat(
                                $minimalPrice[$fieldName],
                                $minimalPrice['CURRENCY'],
                                true
                            );
                            $minimalPrice['RATIO_'.$fieldName] = $minimalPrice[$fieldName]*$ratio;
                            $minimalPrice['PRINT_RATIO_'.$fieldName] = \CCurrencyLang::CurrencyFormat(
                                $minimalPrice['RATIO_'.$fieldName],
                                $minimalPrice['CURRENCY'],
                                true
                            );
                        }
                        unset($fieldName);

                        //if ($this->arParams['FILL_ITEM_ALL_PRICES'])
                        if (1)
                        {
                            foreach (array_keys($fullPrices) as $priceType)
                            {
                                foreach ($prepareFields as $fieldName)
                                {
                                    $fullPrices[$priceType]['PRINT_'.$fieldName] = \CCurrencyLang::CurrencyFormat(
                                        $fullPrices[$priceType][$fieldName],
                                        $fullPrices[$priceType]['CURRENCY'],
                                        true
                                    );
                                    $fullPrices[$priceType]['RATIO_'.$fieldName] = $fullPrices[$priceType][$fieldName]*$ratio;
                                    $fullPrices[$priceType]['PRINT_RATIO_'.$fieldName] = \CCurrencyLang::CurrencyFormat(
                                        $minimalPrice['RATIO_'.$fieldName],
                                        $minimalPrice['CURRENCY'],
                                        true
                                    );
                                }
                                unset($fieldName);
                            }
                            unset($priceType);
                        }

                        unset($prepareFields);
                    }

                    if ($minimalPrice['QUANTITY_FROM'] === null)
                    {
                        $minimalPrice['MIN_QUANTITY'] = $product['MEASURE_RATIO'];
                    }
                    else
                    {
                        $minimalPrice['MIN_QUANTITY'] = $product['MEASURE_RATIO'] * ((int)($minimalPrice['QUANTITY_FROM']/$product['MEASURE_RATIO']));
                        if ($minimalPrice['MIN_QUANTITY'] < $minimalPrice['QUANTITY_FROM'])
                            $minimalPrice['MIN_QUANTITY'] += $product['MEASURE_RATIO'];
                    }


                    //if (!$this->arParams['FILL_ITEM_ALL_PRICES'])
                    //    return $minimalPrice;

                    // currencies format
                    $format = [];
                    if(is_array($currencies)) {
                        $format = $this->getCurrencyFormat(array_keys($currencies));
                    }

                    $a =  array(
                        'FORMAT' => $format,
                        'MINIMAL_PRICE' => $minimalPrice,
                        'ALL_PRICES' => array(
                            'QUANTITY_FROM' => $minimalPrice['QUANTITY_FROM'],
                            'QUANTITY_TO' => $minimalPrice['QUANTITY_TO'],
                            'PRICES' => $fullPrices
                        )
                    );

                    $result[$productId] = $a;



/*

                    $priceId = (int)$price['CATALOG_GROUP_ID'];

                    $price['QUANTITY_FROM_SORT'] = ($price['QUANTITY_FROM'] === null ? 0
                        : (int)$price['QUANTITY_FROM']);
                    $price['QUANTITY_TO_SORT'] = ($price['QUANTITY_TO'] === null ? INF
                        : (int)$price['QUANTITY_TO']);
                    $price['QUANTITY_FROM'] = (int)$price['QUANTITY_FROM'];
                    $price['QUANTITY_TO'] = (int)$price['QUANTITY_TO'];

                    $ratio = $product['MEASURE_RATIO'];
                    if($ratio > $price['QUANTITY_TO_SORT']) {
                        continue;
                    }
                    if($ratio < $price['QUANTITY_FROM_SORT']) {
                        $newRatio = $ratio * ((int)($price['QUANTITY_FROM_SORT'] / $ratio));
                        if($newRatio < $price['QUANTITY_FROM_SORT']) {
                            $newRatio += $ratio;
                        }
                        if($newRatio > $price['QUANTITY_TO_SORT']) {
                            continue;
                        }
                        $ratio = $newRatio;
                    }

                    if(
                        !isset($productPrice[$price['ID']])
                        || ($productPrice[$price['ID']]['QUANTITY_FROM']
                            > $price['QUANTITY_FROM'])
                    ) {
                        $product['DEFAULT_QUANTITY'] = $ratio;


                        // vat
                        $priceWithVat = 1 + $product['VAT_RATE'];
                        $vatIncluded = $product['VAT_INCLUDED'] === 'Y';



                        if(!$vatIncluded) {
                            $price['PRICE'] *= $priceWithVat;
                            $price['DISCOUNT_PRICE'] *= $priceWithVat;
                        }

                        // covert price
                        $isCurrencyConvert = false;
                        $currencyConvert = '';
                        $convertCurrency = $this->currencyConvert($price['PRICE'], $price['CURRENCY'], $currencyConvert);

                        $price['PRICE'] = $convertCurrency['PRICE'];
                        if($price['DISCOUNT_PRICE']) {
                            $price['DISCOUNT_PRICE'] = $this->currencyConvert($price['DISCOUNT_PRICE'], $price['CURRENCY'], $currencyConvert)['PRICE'];
                        }
                        $price['CURRENCY'] = $convertCurrency['CURRENCY'];

                        if($baseCurrency !== $convertCurrency['CURRENCY']) {
                            $isCurrencyConvert = true;
                        }

                        if(!$this->vatIncludeComponent) {
                            $price['PRICE'] /= $priceWithVat;
                            if($price['DISCOUNT_PRICE']) {
                                $price['DISCOUNT_PRICE'] /= $priceWithVat;
                            }
                        }



                        // rounding rule
                        if(isset($this->roundingRule[$priceId]['ROUND_PRECISION'])) {
                            $price['PRICE'] = \Bitrix\Catalog\Product\Price::roundValue(
                                (float) $price['PRICE'],
                                $this->roundingRule[$priceId]['ROUND_PRECISION'],
                                $this->roundingRule[$priceId]['ROUND_TYPE']
                            );

                            $price['DISCOUNT_PRICE'] = \Bitrix\Catalog\Product\Price::roundValue(
                                (float) $price['DISCOUNT_PRICE'],
                                $this->roundingRule[$priceId]['ROUND_PRECISION'],
                                $this->roundingRule[$priceId]['ROUND_TYPE']
                            );
                        } else {
                            $price['PRICE'] = round($price['PRICE'], 2);
                            $price['DISCOUNT_PRICE'] = round($price['DISCOUNT_PRICE'], 2);
                        }



//                        if (
//                            empty($price['DISCOUNT_PRICE'])
//                            || ($price['PRICE'] <= $price['DISCOUNT_PRICE'])
//                        )
//                        {
//                            $price['DISCOUNT'] = 0;
//                            $price['PERCENT'] = 0;
//                        }
//                        else
//                        {
//                            $price['DISCOUNT'] = $price['PRICE'] - $price['DISCOUNT_PRICE'];
//                            $price['PERCENT'] = roundEx(100*$price['DISCOUNT_PRICE']/$priceRow['PRICE'], 0);
//                        }

                        // price print
                        $pricePrint = \CCurrencyLang::CurrencyFormat(
                            $price['PRICE'],
                            $price['CURRENCY'],
                            true
                        );
                        $discountPricePrint = \CCurrencyLang::CurrencyFormat(
                            $price['DISCOUNT_PRICE'],
                            $price['CURRENCY'],
                            true
                        );



                        $result[$productId]['ALL_PRICES'][$priceId] = [
                            'PRICE'                => $priceRounding,
                            'PRICE_TYPE_ID'        => $price['CATALOG_GROUP_ID'],
                            'DISCOUNT_PRICE'       => $discountRounding,
                            'DISCOUNT'             => $price['DISCOUNT'],
                            'PERCENT'              => $price['PERCENT'],

                            'CURRENCY'             => $price['CURRENCY'],
                            'CAN_BUY'              => $productPrice[$priceId]['CAN_BUY'],

                            'PRICE_PRINT'          => $pricePrint,
                            'DISCOUNT_PRICE_PRINT' => $discountPricePrint,

                            'QUANTITY_FROM'        => $price['QUANTITY_FROM'],
                            'QUANTITY_TO'          => $price['QUANTITY_TO'],
                        ];
                    }


                // get min price
                $minPriceCurrency = $isCurrencyConvert ? $price['CURRENCY'] : false;
                $result[$productId]['MIN_PRICE'] = $this->prices->getMinPrice((int)$productId, (float)$product['DEFAULT_QUANTITY'], $minPriceCurrency, $productPrice);
*/
                }
            }
        }

        return $result;
    }


    protected function getProductOffers(array $elementIds, $catalogType, $typeView = false): array
    {
        $offers = [];
        if(count($elementIds) && $this->getProductTypes($catalogType)) {

            $existOffers = \CCatalogSKU::getExistOffers($elementIds);

            if(!$existOffers) {
                return $offers;
            }

            // offers id
            $arOffersIds = $existOffers ? array_keys(array_filter($existOffers)) : [];



            $offerListFilter = [
                'ACTIVE' => 'Y',
                'ACTIVE_DATE' => 'Y',
                //'CATALOG_AVAILABLE' => 'Y',
                "CHECK_PERMISSIONS" => "Y",
                'MIN_PERMISSION'    => 'R',
                'PERMISSIONS_BY'    => $this->getUserId(),
            ];

            // config
            if($this->getConfig()->getHideNotAvailableOffers() === 'Y') {
                $offerListFilter['AVAILABLE'] = 'Y';
            }

            $offerList = \CCatalogSku::getOffersList($arOffersIds, 0, $offerListFilter, ['*']);


            foreach($elementIds as $elementId) {
                if(is_array($offerList[$elementId]) && count($offerList[$elementId])) {
                    // iblock id for offers
                    $iblockId = \CIBlockElement::GetIBlockByID(reset(array_keys($offerList[$elementId])));

                    // get product data
                    $product['PRODUCT'] = $this->getProducts(array_keys($offerList[$elementId]));

                    // get product prices
                    $product['PRICES'] = [];
                    if($product['PRODUCT']) {
                        $product['PRICES'] = $this->getProductPrices($product['PRODUCT']);
                    }

                    // get property offers
                    $product['PROPERTIES'] = [];
                    if($iblockId) {
                        $selectProperties = [];


                        if($this->isPropertyFeature()) {
                            if($typeView === self::TYPE_DETAIL) {
                                $selectProperties = Iblock\Model\PropertyFeature::getDetailPageShowProperties(
                                    $iblockId,
                                    ['CODE' => 'Y']
                                );
                            } else {
                                $selectProperties = Iblock\Model\PropertyFeature::getListPageShowProperties(
                                    $iblockId,
                                    ['CODE' => 'Y']
                                );
                            }

                        // config
                        } else {
                            if($typeView === self::TYPE_DETAIL) {
                                $selectProperties = $this->getConfig()->getDetailOfferProperties();
                            } else {
                                $selectProperties = $this->getConfig()->getSectionOfferProperties();
                            }
                        }

                        $product['PROPERTIES'] = $this->getPropertyValues(array_keys($offerList[$elementId]), $iblockId, $selectProperties);
                    }


                    // collect all data in array
                    $offers[$elementId] = $offerList[$elementId];
                    foreach($offers[$elementId] as $offerId => $offerData) {

                        // prepare images
                        $offers[$elementId][$offerId] = $this->prepareReturn($offerData, self::TYPE_DETAIL);

                        $offers[$elementId][$offerId]['PROPERTIES'] = [];
                        if(isset($product['PROPERTIES'][$offerId])) {
                            $offers[$elementId][$offerId]['PROPERTIES'] = $product['PROPERTIES'][$offerId];
                        }

                        $offers[$elementId][$offerId]['PRODUCT'] = [];
                        if(isset($product['PRODUCT'][$offerId])) {
                            $offers[$elementId][$offerId]['PRODUCT'] = $product['PRODUCT'][$offerId];
                        }

                        $offers[$elementId][$offerId]['PRICES'] = [];
                        if(isset($product['PRICES'][$offerId])) {
                            $offers[$elementId][$offerId]['PRICES'] = $product['PRICES'][$offerId];
                        }
                    }
                }
            }
        }

        return $offers;
    }


    protected function getPropertyValues(array $elementIds, $iblockId, $selectProperties = []): array
    {
        // $usePropertyFeatures = Iblock\Model\PropertyFeature::isEnabledFeatures();

        /**
        $list = Iblock\Model\PropertyFeature::getListPageShowPropertyCodes(
        $iblockId,
        ['CODE' => 'Y']
        );
        if ($list === null)
        $list = [];
        $this->storage['IBLOCK_PARAMS'][$iblockId]['PROPERTY_CODE'] = $list;
        if ($this->useCatalog)
        {
        $list = Iblock\Model\PropertyFeature::getListPageShowPropertyCodes(
        $this->getOffersIblockId($iblockId),
        ['CODE' => 'Y']
        );
        if ($list === null)
        $list = [];
        $this->storage['IBLOCK_PARAMS'][$iblockId]['OFFERS_PROPERTY_CODE'] = $list;
        }
        unset($list);
         */
        $properties = [];

        // Get all HL for get properties
        if(!$this->listHL) {
            $this->listHL = Core\HighloadHelper::getInstance()->getAll();
        }


        $options = [];
        $options['USE_PROPERTY_ID'] = 'N';
        //$options['PROPERTY_FIELDS'] = ['ID', 'NAME', 'CODE', ''];

        $propertyFilter = [];
        $propertyFilter['CODE'] = $selectProperties ?: [];

        if($iblockId > 0 && count($elementIds)) {

            $propertyValues = array_flip($elementIds);

            \CIBlockElement::GetPropertyValuesArray(
                $propertyValues,
                $iblockId,
                ['@ID' => $elementIds, 'ACTIVE' => 'Y'],
                $propertyFilter,
                $options
            );

            foreach($elementIds as $elementId) {
                if(isset($propertyValues[$elementId])) {
                    foreach($propertyValues[$elementId] as $propCode => $fields) {


                        /*// check property feature in basket
                        if(is_array($propertiesIdInBasket) && in_array($propCode, $propertiesIdInBasket)) {
                            $fields['IN_BASKET'] = 'Y';
                        } else {
                            $fields['IN_BASKET'] = 'N';
                        }

                        // check more photo field
                        if($codeMorePhoto && $codeMorePhoto == $propCode) {
                            $fields['IS_MOREPHOTO'] = 'Y';
                        } else {
                            $fields['IS_MOREPHOTO'] = 'N';
                        }
                        */

                        /*if(isset($fields['PROPERTY_VALUE_ID'])) {

                            if(
                                $fields['PROPERTY_TYPE'] === 'S' &&
                                $fields['USER_TYPE'] === 'directory' &&
                                \CIBlockPriceTools::checkPropDirectory($fields)) {


                                *//*if($this->listHL && $fields['USER_TYPE_SETTINGS']['TABLE_NAME'] && $this->listHL[$fields['USER_TYPE_SETTINGS']['TABLE_NAME']]) {
                                    //$a = Core\HighloadHelper::getInstance()->getElementList(
                                    //    $this->listHL[$fields['USER_TYPE_SETTINGS']['TABLE_NAME']], 'UF_NAME', $fields['VALUE'][0]);
                                    $displayValue = \CIBlockFormatProperties::GetDisplayValue($elementId, $fields, "catalog_out"));
                                }*//*

                                $displayValue = \CIBlockFormatProperties::GetDisplayValue($elementId, $fields, "catalog_out");

                                if($displayValue) {
                                    $value = is_array($displayValue['DISPLAY_VALUE']) ? $displayValue['DISPLAY_VALUE'] : [$displayValue['DISPLAY_VALUE']];
                                } else {
                                    $value = [];
                                }

                                unset($fields['USER_TYPE_SETTINGS']);

                            } else if($fields['PROPERTY_TYPE'] === 'L') {
                                // list
                                if($fields['MULTIPLE'] === 'Y') {
                                    foreach($fields['PROPERTY_VALUE_ID'] as $i => $item) {
                                        $value[] = [
                                            'VALUE'    => $fields['VALUE_ENUM_ID'][$i],
                                            'VALUE_ID' => $fields['PROPERTY_VALUE_ID'][$i],
                                        ];
                                    }
                                } else {
                                    $value = [
                                        'VALUE'    => $fields['VALUE_ENUM_ID'],
                                        'VALUE_ID' => $fields['PROPERTY_VALUE_ID'],
                                    ];
                                }
                            } else {
                                if($fields['MULTIPLE'] === 'Y') {
                                    if(is_array($fields['PROPERTY_VALUE_ID'])) {
                                        foreach($fields['PROPERTY_VALUE_ID'] as $i => $item) {

                                            // is file, create url
                                            if($fields['PROPERTY_TYPE'] === 'F') {
                                                $fields['VALUE'][$i] = self::getPictureSrc((int) $fields['VALUE'][$i]);
                                            }

                                            $value[] = [
                                                'VALUE'    => $fields['VALUE'][$i],
                                                'VALUE_ID' => $fields['PROPERTY_VALUE_ID'][$i],
                                            ];
                                        }
                                    }
                                } else {

                                    // is file, create url
                                    if($fields['PROPERTY_TYPE'] === 'F') {
                                        $fields['VALUE'][$i] = self::getPictureSrc((int) $fields['VALUE'][$i]);
                                    }

                                    $value = [
                                        'VALUE'    => $fields['VALUE'],
                                        'VALUE_ID' => $fields['PROPERTY_VALUE_ID'],
                                    ];
                                }
                            }
                        }*/

                        $displayValue = \CIBlockFormatProperties::GetDisplayValue($elementId, $fields, "catalog_out");
                        if(!$displayValue['DISPLAY_VALUE']) {
                            continue;
                        }

                        // File
                        if($fields['PROPERTY_TYPE'] === 'F') {
                            if($fields['MULTIPLE'] === 'Y') {
                                if(is_array($fields['PROPERTY_VALUE_ID'])) {
                                    foreach($fields['PROPERTY_VALUE_ID'] as $i => $item) {
                                        // is file, create url
                                        $fields['VALUE'][$i] = self::getPictureSrc((int)$fields['VALUE'][$i]);
                                    }
                                }
                            } else {
                                // is file, create url
                                $fields['VALUE'][$i] = self::getPictureSrc((int)$fields['VALUE'][$i]);
                            }

                            $properties[$elementId][$propCode] = $fields;

                        } else {
                            $properties[$elementId][$propCode] = $displayValue;

                            // HL
                            if(
                                $fields['PROPERTY_TYPE'] === 'S' &&
                                $fields['USER_TYPE'] === 'directory' &&
                                \CIBlockPriceTools::checkPropDirectory($fields)) {

                                // get all fields
                                if($this->listHL !== null && $fields['USER_TYPE_SETTINGS']['TABLE_NAME'] && $this->listHL[$fields['USER_TYPE_SETTINGS']['TABLE_NAME']]) {
                                    $properties[$elementId][$propCode]['UF_FIELDS'] = Core\HighloadHelper::getInstance()->getElementList(
                                        $this->listHL[$fields['USER_TYPE_SETTINGS']['TABLE_NAME']],
                                        ['UF_XML_ID' => $fields['VALUE']],
                                        ["ID" => "ASC"]);
                                }

                                // get file
                                if(!empty($properties[$elementId][$propCode]['UF_FIELDS']) && is_array($properties[$elementId][$propCode]['UF_FIELDS'])) {
                                    foreach($properties[$elementId][$propCode]['UF_FIELDS'] as &$v) {
                                        if(!empty($v['UF_FILE'])) {
                                            $v['UF_FILE'] = self::getPictureSrc((int)$v['UF_FILE']);
                                        }
                                    }
                                    unset($v);
                                }
                            }
                        }





                        //$properties[$elementId][$propCode] = $fields;
                        //$properties[$elementId][$propCode]['VALUES'] = $value;
                    }
                }
            }
        }

        return $properties;
    }


    protected function getStoreProduct(array $productIds)
    {
        $result = [];
        $rsStoreProduct = \Bitrix\Catalog\StoreProductTable::getList(
            [
                'filter' => ['@PRODUCT_ID' => $productIds, '=STORE.ACTIVE' => 'Y'],
                'select' => ['PRODUCT_ID', 'AMOUNT', 'STORE_ID', 'STORE_TITLE' => 'STORE.TITLE'],
            ]
        );

        while($arStoreProduct = $rsStoreProduct->fetch()) {
            $result[$arStoreProduct['PRODUCT_ID']] = $arStoreProduct;
        }

        return $result;
    }

    protected function getProductTypes($catalogType): array
    {
        //TODO: remove after create \Bitrix\Catalog\Model\CatalogIblock

        $result = array();

        switch ($catalogType)
        {
            case \CCatalogSku::TYPE_CATALOG:
                $result = array(
                    ProductTable::TYPE_PRODUCT => true,
                    ProductTable::TYPE_SET => true
                );
                break;
            case \CCatalogSku::TYPE_OFFERS:
                $result = array(
                    ProductTable::TYPE_OFFER => true,
                    ProductTable::TYPE_FREE_OFFER => true
                );
                break;
            case \CCatalogSku::TYPE_FULL:
                $result = array(
                    ProductTable::TYPE_PRODUCT => true,
                    ProductTable::TYPE_SET => true,
                    ProductTable::TYPE_SKU => true,
                    ProductTable::TYPE_EMPTY_SKU => true
                );
                break;
            case \CCatalogSku::TYPE_PRODUCT:
                $result = array(
                    ProductTable::TYPE_SKU => true,
                    ProductTable::TYPE_EMPTY_SKU => true
                );
                break;
        }

        return $result;
    }

    protected function getAllowedFieldsProduct()
    {
        return [
            'TYPE',
            'AVAILABLE',
            'BUNDLE',
            'QUANTITY',
            'QUANTITY_RESERVED',
            'QUANTITY_TRACE',
            'CAN_BUY_ZERO',
            'SUBSCRIBE',
            'VAT_ID',
            'VAT_INCLUDED',
            'PURCHASING_PRICE',
            'PURCHASING_CURRENCY',
            'BARCODE_MULTI',
            'WEIGHT',
            'LENGTH',
            'WIDTH',
            'HEIGHT',
            'MEASURE',
            'RECUR_SCHEME_LENGTH',
            'RECUR_SCHEME_TYPE',
            'TRIAL_PRICE_ID',
            'WITHOUT_ORDER',
            'QUANTITY_TRACE_RAW',
            'PAYMENT_TYPE',
            'SUBSCRIBE_RAW',
            'CAN_BUY_ZERO_RAW'
        ];
    }

    /**
     * @param $old
     * @param $new
     *
     * @return mixed
     * @throws \Bitrix\Main\LoaderException
     */
    protected function checkCurrencyConvert($old, $new)
    {
        if (Loader::includeModule('currency'))
        {
            if(Currency\CurrencyManager::isCurrencyExist($new)) {
                return $new;
            }
        }

        return $old;
    }

    /**
     * @param $price
     * @param $currency
     * @param  string  $newCurrency
     *
     * @return float|int
     */
    protected function currencyConvert($price, $currency, $newCurrency = '')
    {

        // config
        if(!$newCurrency) {
            $newCurrency = (string) $this->getConfig()->getCurrencyConvert();
        }

        if($newCurrency && $currency !== $newCurrency && $this->checkCurrencyConvert($currency, $newCurrency)) {
            return [
                'PRICE' => \CCurrencyRates::ConvertCurrency(
                    $price,
                    $currency,
                    $newCurrency
                ),
                'CURRENCY' => $newCurrency
            ];
        }

        return [
            'PRICE' => $price,
            'CURRENCY' => $newCurrency ?: $currency
        ];

    }

    /**
     * Check iblock element
     *
     * @param  int  $id
     * @param  int  $userId
     */
    public static function checkElement(int $id, int $userId, array $select = [])
    {
        if(!$select) {
            $select = [
                "ID",
                "IBLOCK_ID",
                "XML_ID",
                "NAME",
            ];
        }

        $filter = array(
            '=ID' => $id,
            'ACTIVE' => 'Y',
            'GLOBAL_ACTIVE' => 'Y',
            'ACTIVE_DATE' => 'Y',
            'CHECK_PERMISSIONS' => 'Y',
            'MIN_PERMISSION' => 'R',
            'PERMISSIONS_BY' => $userId,
        );

        $req = \CIBlockElement::GetList([], $filter, false,  ['nPageSize' => 1], $select);
        if($res = $req->GetNext()) {
            return $res;
        }

        return false;
    }

    /**
     * Check product in table
     *
     * @param  int  $id
     * @param  int  $userId
     */
    public static function checkProduct(int $id, int $userId, array $select = [])
    {
        if(!$select) {
            $select = [
                'ID', 'TYPE', 'AVAILABLE', 'CAN_BUY_ZERO', 'QUANTITY_TRACE', 'QUANTITY',
                'WEIGHT', 'WIDTH', 'HEIGHT', 'LENGTH',
                'MEASURE', 'BARCODE_MULTI', 'NAME' => 'IBLOCK_ELEMENT.NAME'
            ];
        }
        $req = ProductTable::getList([
             'select' => $select,
             'filter' => ['=ID' => $id],
         ]);
        if($res = $req->fetch()) {
            return $res;
        }

        return false;
    }

    public static function checkOffer(int $id)
    {
        return \CCatalogSku::GetProductInfo($id);
    }
}