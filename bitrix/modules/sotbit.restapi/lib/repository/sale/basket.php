<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository\Sale;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\SaleException,
    Sotbit\RestAPI\Core,
    Sotbit\RestAPI\Localisation as l,
    Sotbit\RestAPI\Repository\SaleRepository,
    Sotbit\RestAPI\Repository\CatalogRepository,
    Sotbit\RestAPI\Repository\Catalog\Product;

use Bitrix\Sale,
    Bitrix\Sale\PriceMaths,
    Bitrix\Catalog,
    Bitrix\Main\Context,
    Bitrix\Main\Entity,
    Bitrix\Main\Loader,
    Bitrix\Main\Type\DateTime,
    Bitrix\Main\UserTable,
    Bitrix\Sale\Cashbox\CheckManager,
    Bitrix\Main\Config\Option,
    Bitrix\Iblock,
    Bitrix\Highloadblock as HL,
    Bitrix\Sale\Internals,
    Bitrix\Sale\Provider;

/**
 * Class Basket
 *
 * @package Sotbit\RestAPI\Repository\Sale
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 15.11.2022
 */
class Basket extends SaleRepository
{
    /**
     *
     */
    public const BASKET_MODULE = 'catalog';

    /**
     * @var mixed|string
     */
    public $weightUnit;
    /**
     * @var mixed|string
     */
    public $weightKoef;
    /**
     * @var string
     */
    public $currency;

    /**
     *
     */
    protected const BASKET_FIELDS
        = [
            'ID',
            'PRODUCT_ID',
            'NAME',
            '',
        ];


    /**
     * Product constructor.
     *
     *
     * @throws \Bitrix\Main\LoaderException
     */
    public function __construct()
    {
        parent::__construct();

        $this->weightKoef = htmlspecialcharsbx(\COption::GetOptionString('sale', 'weight_koef', 1, $this->getSiteId()));
        $this->weightUnit = htmlspecialcharsbx(
            \COption::GetOptionString('sale', 'weight_unit', '', $this->getSiteId())
        );
        $this->currency = Sale\Internals\SiteCurrencyTable::getSiteCurrency($this->getSiteId());
        $this->priceVatShowValue = 'Y';
    }


    /**
     * @param  array  $params
     *
     * @return array
     * @throws SaleException
     * @throws \Bitrix\Main\ArgumentException
     */
    public function get(array $params): array
    {
        $result = [];
        $basketItems = [];
        $basketTotal = [];

        if($this->getUserId() === null) {
            throw new SaleException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
        }

        // prepare params
        $params = $this->prepareNavigationSaleBasket($params);
        $params['filter']['=FUSER_ID'] = $this->getSaleFuserId($params['user_id']);
        $params['filter']['=LID'] = $this->getSiteId();
        $params['filter']['=ORDER_ID'] = null;
        //$params['filter']['=CAN_BUY'] = 'Y';

        //$params['select'] = $params['select'];


        // load basket
        $basket = $this->basketClass::loadItemsForFUser(
            $params['filter']['=FUSER_ID'],
            $params['filter']['=LID']
        );

        // refresh basket
        $refreshStrategy = Sale\Basket\RefreshFactory::create(Sale\Basket\RefreshFactory::TYPE_FULL);
        $basket->refresh($refreshStrategy);
        $basketSave = $basket->save();
        if(!$basketSave->isSuccess()) {
            throw new SaleException(
                is_array($basketSave->getErrors()) ? implode(', ', $basketSave->getErrors()) : $basketSave->getErrors(),
                StatusCode::HTTP_BAD_REQUEST
            );
        }

        /*
        // load basket items for pagenavigation
        $basketORM = $this->basketClass::getList(
            [
                'select' => ['ID'],//$params['select'],
                'filter' => $params['filter'],
                'order'  => $params['order'],
                'limit'  => $params['limit'],
                'offset' => ($params['limit'] * ($params['page'] - 1)),
            ]
        );*/

        // get info for basket items
        if(!$basket->isEmpty() /*&& $basketORM->getSelectedRowsCount()*/) {
            try {
                //$this->initializeBasketOrderIfNotExists($basket);
                $this->getDiscounts($basket);

                // get info for basket items
                $basketItems = $this->processBasketItems($basket);

                // get other info
                if($basketItems) {
                    $basketItems = \getMeasures($basketItems);
                    $basketItems = \getRatio($basketItems);

                    // get detail and preview images for basket items
                    $basketItems = $this->getBasketItemImages($basketItems);
                }


                // total
                $basketTotal = $this->getBasketTotal($basket);
            } catch(\Exception $e) {
                throw new SaleException(l::get('ERROR_QUERY'), StatusCode::HTTP_BAD_REQUEST);
            }
        }


        // data
        $result['data']['items'] = $basketItems;
        $result['data']['total'] = $basketTotal;

        // info
        $result['info']['count_select'] = count($result['data']['items']);
        $result['info']['count_all'] = $basket->count() ?? 0;


        return $result;
    }


    /**
     * @param  array  $params
     *
     * @return string
     */
    public function add(array $params)
    {
        if($this->getUserId() === null) {
            throw new SaleException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
        }

        $productId = $params['id'];
        $quantity = $params['quantity'];
        $userId = $this->getUserId();
        $fuser = $this->getSaleFuserId($userId);
        $options = [];

        if(!$productId) {
            throw new SaleException(l::get('ERROR_CATALOG_PRODUCT_ID_EMPTY'), StatusCode::HTTP_BAD_REQUEST);
        }
        if(!$elementFields = Product::checkElement($productId, $userId)) {
            throw new SaleException(l::get('ERROR_CATALOG_PRODUCT_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }
        if(!$productFields = Product::checkProduct($productId, $userId)) {
            throw new SaleException(l::get('ERROR_CATALOG_PRODUCT_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }
        /*if($productFields['AVAILABLE'] != Catalog\ProductTable::STATUS_YES) {
            throw new SaleException(l::get('ERROR_CATALOG_PRODUCT_BASKET_ERR_PRODUCT_RUN_OUT'),StatusCode::HTTP_BAD_REQUEST);
        }*/

        $iblockId = $elementFields['IBLOCK_ID'];


        // basket fields
        $basketFields = [];
        if($this->config->isBasketAddProperty()) {
            if($this->isPropertyFeature()) {
                /*$propertyFeature = \Bitrix\Iblock\Model\PropertyFeature::getDetailPageShowProperties(
                    $elementFields['IBLOCK_ID'],
                    ['CODE' => 'Y']
                );*/
                $basketFields = Catalog\Product\PropertyCatalogFeature::getBasketPropertyCodes(
                    $iblockId,
                    ['CODE' => 'Y']
                );
                /*$list = Catalog\Product\PropertyCatalogFeature::getOfferTreePropertyCodes(
                    $elementFields['IBLOCK_ID'],
                    ['CODE' => 'Y']
                );*/
            } else {
                $basketFields = ((int)$productFields['TYPE'] !== Catalog\ProductTable::TYPE_OFFER
                    && (int)$productFields['TYPE'] !== Catalog\ProductTable::TYPE_FREE_OFFER)
                    ? $this->config->getBasketProperty() : $this->config->getBasketOfferProperty();

                if(!$basketFields) {
                    $options['FILL_PRODUCT_PROPERTIES'] = 'Y';
                }
            }

            // prepare basket fields
            if($basketFields) {
                $basketFields = $this->getPropsValues($iblockId, $productId, $basketFields);
            }
        }

        // measure
        $productMeasureData = Catalog\MeasureRatioTable::getCurrentRatio($productId);
        $productMeasure = $productMeasureData[$productId] ?? 1;
        $productMeasure = $productMeasure <= 0 ? 1 : $productMeasure;

        // add max quantity, if avalible and can by zero
        if(
            $productFields['AVAILABLE'] === 'Y'
            && $productFields['CAN_BUY_ZERO'] === 'N'
            && (float)$quantity > (float)$productFields['QUANTITY']
        ) {
            $quantity = $productFields['QUANTITY'];
        }

        // check measure
        if($quantity && $productMeasure && (int)($quantity / $productMeasure) != (float)($quantity / $productMeasure)) {
            throw new SaleException(
                l::get(
                    'ERROR_BASKET_ADD_PRODUCT_QUANTITY',
                    ['#QUANTITY#' => $quantity]
                ), StatusCode::HTTP_BAD_REQUEST
            );
        }

        // product fields
        $product = [
            'NAME'                   => $productFields['NAME'],
            'PRODUCT_ID'             => $productId,
            'QUANTITY'               => $quantity,
            'MODULE'                 => self::BASKET_MODULE,
            'PRODUCT_PROVIDER_CLASS' => Catalog\Product\Basket::getDefaultProviderName(),
            'PROPS'                  => $basketFields ? : [],
            //'DELAY'                  => $productFields['DELAY'],
            //'CAN_BUY'                => $productFields['CAN_BUY'],
        ];

        // site id
        $siteId = $this->getSiteId();
        if(!empty($basketFields['LID'])) {
            $siteId = $basketFields['LID'];
        }


        // context fields
        $context = [
            'SITE_ID' => $siteId,
            'USER_ID' => $userId,
        ];

        // load basket for current user
        $registry = Sale\Registry::getInstance(Sale\Registry::REGISTRY_TYPE_ORDER);
        /** @var Sale\Basket $basketClass */
        $basketClass = $registry->getBasketClassName();
        $basket = $basketClass::loadItemsForFUser($fuser, $siteId);

        // check isset product
        $basketItem = $this->getBasketItemProductId($basket, $productId);

        // if product isset
        if($basketItem) {
            $setQuantity = $basketItem->setField('QUANTITY', $quantity);
            if(!$setQuantity->isSuccess()) {
                throw new SaleException(
                    l::get(
                        'ERROR_BASKET_ADD_PRODUCT_QUANTITY',
                        ['#QUANTITY#' => $fields['QUANTITY']]
                    ), StatusCode::HTTP_BAD_REQUEST
                );
            }
            /*$basketResult = $basketItem->delete();
            if(!$basketResult->isSuccess()) {
                throw new SaleException(
                    l::get('ERROR_BASKET_ADD_PRODUCT'), StatusCode::HTTP_BAD_REQUEST
                );
            }*/

            $refreshStrategy = Sale\Basket\RefreshFactory::create(Sale\Basket\RefreshFactory::TYPE_FULL);
            $basket->refresh($refreshStrategy);
            $saveResult = $basket->save();

            if($saveResult->isSuccess()) {
                return l::get('BASKET_ADD_PRODUCT', ['#NAME#' => $elementFields['NAME']]);
            }

            return l::get('ERROR_BASKET_ADD_PRODUCT_FIELDS');
        }

        // if product not isset
        $options['USE_MERGE'] = 'Y';
        $result = Catalog\Product\Basket::addProductToBasketWithPermissions($basket, $product, $context, $options);

        if($result->isSuccess()) {
            $saveResult = $basket->save();
            if($saveResult->isSuccess()) {
                $resultData = $result->getData();
                if(!empty($resultData['BASKET_ITEM'])) {
                    $item = $resultData['BASKET_ITEM'];
                    if($item instanceof Sale\BasketItemBase) {
                        if(Loader::includeModule('statistic')) {
                            \CStatistic::Set_Event(
                                'sale2basket',
                                'catalog',
                                $item->getField('DETAIL_PAGE_URL')
                            );
                        }
                        $result->setData(['ID' => $item->getId(),]);
                    } else {
                        throw new SaleException(l::get('ERROR_BASKET_ERR_UNKNOWN'), StatusCode::HTTP_BAD_REQUEST);
                    }
                    unset($item);
                } else {
                    throw new SaleException(l::get('ERROR_BASKET_ERR_UNKNOWN'), StatusCode::HTTP_BAD_REQUEST);
                }
                unset($resultData);
            } else {
                $result->addErrors($saveResult->getErrors());
            }
            unset($saveResult);
        }
        unset($basket, $context, $siteId);

        if($errors = $result->getErrorMessages()) {
            throw new SaleException(
                is_array($errors) ? implode(', ', $errors) : $errors,
                StatusCode::HTTP_BAD_REQUEST
            );
        }

        return l::get('BASKET_ADD_PRODUCT', ['#NAME#' => $elementFields['NAME']]);
    }

    /**
     * @param  array  $params
     *
     */
    public function delete(array $params)
    {
        if($this->getUserId() === null) {
            throw new SaleException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
        }

        $productIds = is_array($params['id']) ? array_map('intval', $params['id']) : [(int)$params['id']];
        if(empty($productIds) || !$productIds[0]) {
            throw new SaleException(l::get('ERROR_BASKET_ID'), StatusCode::HTTP_BAD_REQUEST);
        }

        $userId = $this->getUserId();
        $fuser = $this->getSaleFuserId($userId);

        $basket = Sale\Basket::loadItemsForFUser(
            $fuser,
            $this->getSiteId()
        );

        if($basket->isEmpty()) {
            throw new SaleException(l::get('ERROR_BASKET_EMPTY'), StatusCode::HTTP_BAD_REQUEST);
        }

        $basketItems = null;

        // delete basketItems
        /** @var Sale\BasketItem $basketItem */
        foreach($basket as $basketItem) {
            if($basketItem->getField('MODULE') !== self::BASKET_MODULE) {
                continue;
            }

            if($basketItem->isBundleParent() || $basketItem->isBundleChild()) {
                continue;
            }

            $basketItems[(int)$basketItem->getProductId()] = $basketItem;
        }

        foreach($productIds as $productId) {
            if($basketItems[$productId] !== null) {
                $basketItem = $basketItems[$productId];
                $actionDelete = $basketItem->delete();
                if(!$actionDelete->isSuccess()) {
                    throw new SaleException($actionDelete->getErrors(), StatusCode::HTTP_BAD_REQUEST);
                }
            } else {
                $productName = Product::checkProduct($productId, $userId);
                throw new SaleException(
                    l::get('ERROR_BASKET_REMOVE_PRODUCT', [' `#NAME#`' => $productName['NAME']]),
                    StatusCode::HTTP_BAD_REQUEST
                );
            }
        }


        // save basket
        $basketSave = $basket->save();
        if(!$basketSave->isSuccess()) {
            throw new SaleException($basketSave->getErrors(), StatusCode::HTTP_BAD_REQUEST);
        }

        return l::get('ERROR_BASKET_REMOVE_SUCCESS');
    }

    /**
     * @param  Sale\Basket  $basket
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentNullException
     */
    protected function getBasketTotal(Sale\Basket $basket)
    {
        $result = [];

        $basketPrice = $basket->getPrice();
        $basketWeight = $basket->getWeight();
        $basketBasePrice = $basket->getBasePrice();
        $basketVatSum = $basket->getVatSum();

        $result['CURRENCY'] = $this->currency;

        $result['allSum'] = PriceMaths::roundPrecision($basketPrice);
        $result['allSum_FORMATED'] = \CCurrencyLang::CurrencyFormat($result['allSum'], $this->currency, true);

        $result['allWeight'] = $basketWeight;
        $result['allWeight_FORMATED'] = roundEx($basketWeight / $this->weightKoef, SALE_WEIGHT_PRECISION).' '
            .$this->weightUnit;

        $result['PRICE_WITHOUT_DISCOUNT'] = \CCurrencyLang::CurrencyFormat($basketBasePrice, $this->currency, true);
        $result['DISCOUNT_PRICE_ALL'] = PriceMaths::roundPrecision($basketBasePrice - $basketPrice);
        $result['DISCOUNT_PRICE_FORMATED']
            = $result['DISCOUNT_PRICE_ALL_FORMATED'] = \CCurrencyLang::CurrencyFormat(
            $result['DISCOUNT_PRICE_ALL'],
            $this->currency,
            true
        );

        if($this->priceVatShowValue === 'Y') {
            $result['allVATSum'] = PriceMaths::roundPrecision($basketVatSum);
            $result['allVATSum_FORMATED'] = \CCurrencyLang::CurrencyFormat($result['allVATSum'], $this->currency, true);
            $result['allSum_wVAT_FORMATED'] = \CCurrencyLang::CurrencyFormat(
                $result['allSum'] - $result['allVATSum'],
                $this->currency,
                true
            );
        }

        return $result;
    }


    /**
     * @param  Sale\Basket  $basket
     *
     */
    protected function initializeBasketOrderIfNotExists(Sale\Basket $basket)
    {
        if(!$basket->getOrder()) {
            $userId = $this->getUserId() ?? 0;

            $registry = Sale\Registry::getInstance(Sale\Registry::REGISTRY_TYPE_ORDER);
            /** @var Sale\Order $orderClass */
            $orderClass = $registry->getOrderClassName();

            $order = $orderClass::create($this->getSiteId(), $userId);

            $result = $order->appendBasket($basket);
            if(!$result->isSuccess()) {
                $this->errorCollection->add($result->getErrors());
            }

            $discounts = $order->getDiscount();
            $showPrices = $discounts->getShowPrices();
            if(!empty($showPrices['BASKET'])) {
                foreach($showPrices['BASKET'] as $basketCode => $data) {
                    $basketItem = $basket->getItemByBasketCode($basketCode);
                    if($basketItem instanceof Sale\BasketItemBase) {
                        $basketItem->setFieldNoDemand('BASE_PRICE', $data['SHOW_BASE_PRICE']);
                        $basketItem->setFieldNoDemand('PRICE', $data['SHOW_PRICE']);
                        $basketItem->setFieldNoDemand('DISCOUNT_PRICE', $data['SHOW_DISCOUNT']);
                    }
                }
            }
        }
    }

    // \bitrix\components\bitrix\sale.basket.basket\class.php

    /**
     * @param  Sale\BasketItem  $item
     *
     * @return array
     */
    protected function processBasketItems(Sale\Basket $basket)
    {
        $basketItems = [];
        $productInfo = [];
        $productIds = $this->getBasketProductIds($basket);

        // get product info
        sort($productIds);
        $productIterator = Catalog\ProductTable::getList([
            'select' => ['ID', 'QUANTITY', 'QUANTITY_TRACE', 'CAN_BUY_ZERO'],
            'filter' => ['@ID' => $productIds],
        ]);
        while ($product = $productIterator->fetch())
        {
            $productInfo[$product['ID']] = $product;
        }

        foreach ($basket as $key => $item) {
            $basketItem = $item->getFieldValues();

            $basketItem['PROPERTIES'] = $this->getBasketItemProperties($item);
            //$basketItem['PROPS_ALL'] = $item->getPropertyCollection()->getPropertyValues();
            $basketItem['QUANTITY'] = $item->getQuantity();

            $basketItem['WEIGHT'] = (float)$basketItem['WEIGHT'];
            $basketItem['WEIGHT_FORMATED'] = roundEx($basketItem['WEIGHT'] / $this->weightKoef, SALE_WEIGHT_PRECISION).' '
                .$this->weightUnit;

            $basketItem['PRICE'] = PriceMaths::roundPrecision($basketItem['PRICE']);
            $basketItem['PRICE_FORMATED'] = \CCurrencyLang::CurrencyFormat(
                $basketItem['PRICE'],
                $basketItem['CURRENCY'],
                true
            );

            $basketItem['FULL_PRICE'] = PriceMaths::roundPrecision($basketItem['BASE_PRICE']);
            $basketItem['FULL_PRICE_FORMATED'] = \CCurrencyLang::CurrencyFormat(
                $basketItem['FULL_PRICE'],
                $basketItem['CURRENCY'],
                true
            );

            $basketItem['DISCOUNT_PRICE'] = PriceMaths::roundPrecision($basketItem['DISCOUNT_PRICE']);
            $basketItem['DISCOUNT_PRICE_FORMATED'] = \CCurrencyLang::CurrencyFormat(
                $basketItem['DISCOUNT_PRICE'],
                $basketItem['CURRENCY'],
                true
            );

            $basketItem['SUM_VALUE'] = $basketItem['PRICE'] * $basketItem['QUANTITY'];
            $basketItem['SUM'] = \CCurrencyLang::CurrencyFormat($basketItem['SUM_VALUE'], $basketItem['CURRENCY'], true);

            $basketItem['SUM_FULL_PRICE'] = $basketItem['FULL_PRICE'] * $basketItem['QUANTITY'];
            $basketItem['SUM_FULL_PRICE_FORMATED'] = \CCurrencyLang::CurrencyFormat(
                $basketItem['SUM_FULL_PRICE'],
                $basketItem['CURRENCY'],
                true
            );

            $basketItem['SUM_DISCOUNT_PRICE'] = $basketItem['DISCOUNT_PRICE'] * $basketItem['QUANTITY'];
            $basketItem['SUM_DISCOUNT_PRICE_FORMATED'] = \CCurrencyLang::CurrencyFormat(
                $basketItem['SUM_DISCOUNT_PRICE'],
                $basketItem['CURRENCY'],
                true
            );

            $basketItem['PRICE_VAT_VALUE'] = $basketItem['VAT_VALUE']
                = ($basketItem['PRICE'] * $basketItem['QUANTITY'] / ($basketItem['VAT_RATE'] + 1)) * $basketItem['VAT_RATE']
                / $basketItem['QUANTITY'];

            $basketItem['DISCOUNT_PRICE_PERCENT'] = 0;
            if($basketItem['CUSTOM_PRICE'] !== 'Y') {
                $basketItem['DISCOUNT_PRICE_PERCENT'] = Sale\Discount::calculateDiscountPercent(
                    $basketItem['FULL_PRICE'],
                    $basketItem['DISCOUNT_PRICE']
                );
                if($basketItem['DISCOUNT_PRICE_PERCENT'] === null) {
                    $basketItem['DISCOUNT_PRICE_PERCENT'] = 0;
                }
            }
            $basketItem['DISCOUNT_PRICE_PERCENT_FORMATED'] = $basketItem['DISCOUNT_PRICE_PERCENT'].'%';

            if($basketItem['CAN_BUY'] !== 'Y' && $basketItem['DELAY'] !== 'Y') {
                $basketItem['NOT_AVAILABLE'] = true;
            } else {
                $basketItem['NOT_AVAILABLE'] = false;
            }

            // offer info
            $basketItem['PARENT_PRODUCT_ID'] = null;
            $basketItem['IS_OFFER'] = false;
            $basketItemOfferInfo = Product::checkOffer($item->getProductId());
            if($basketItemOfferInfo) {
                $basketItem['IS_OFFER'] = true;
                $basketItem['PARENT_PRODUCT_ID'] = $basketItemOfferInfo['ID'];
            }

            // availible quantity
            $check = ($productInfo[$basketItem['PRODUCT_ID']]['QUANTITY_TRACE'] == 'Y' && $productInfo[$basketItem['PRODUCT_ID']]['CAN_BUY_ZERO'] == 'N');
            $basketItem['AVAILABLE_QUANTITY'] = $check ? $productInfo[$basketItem['PRODUCT_ID']]['QUANTITY'] : null;

            $basketItems[$item->getId()] = $basketItem;
        }



        return $basketItems;
    }

    /**
     * @param  Sale\Basket  $basket
     *
     */
    protected function getDiscounts(Sale\Basket $basket)
    {
        $context = new \Bitrix\Sale\Discount\Context\Fuser($basket->getFUserId());
        $discounts = \Bitrix\Sale\Discount::buildFromBasket($basket, $context);
        $r = $discounts->calculate();
        if(!$r->isSuccess()) {
            throw new SaleException($r->getErrorMessages());
        }

        $result = $r->getData();
        if(isset($result['BASKET_ITEMS'])) {
            $r = $basket->applyDiscount($result['BASKET_ITEMS']);
            if(!$r->isSuccess()) {
                throw new SaleException($r->getErrorMessages());
            }
        }

        //$this->initializeBasketOrderIfNotExists($basket);
        // get discount prices
        /*$basket->refreshData(array('PRICE', 'COUPONS'));
        \Bitrix\Sale\Compatible\DiscountCompatibility::stopUsageCompatible();
        $discounts = \Bitrix\Sale\Discount::buildFromBasket($basket, new \Bitrix\Sale\Discount\Context\Fuser($params['filter']['=FUSER_ID']));
        $discounts->calculate();
        $resultDiscounts = $discounts->getApplyResult(true);
        $basketPrices = $resultDiscounts['PRICES']['BASKET'];*/
    }


    /**
     * @param  Sale\BasketItem  $basketItem
     *
     * @return array
     */
    protected function getBasketItemProperties(Sale\BasketItem $basketItem)
    {
        $properties = [];
        /** @var Sale\BasketPropertiesCollection $propertyCollection */
        $propertyCollection = $basketItem->getPropertyCollection();
        $basketId = $basketItem->getBasketCode();

        foreach($propertyCollection->getPropertyValues() as $property) {
            if($property['CODE'] == 'CATALOG.XML_ID' || $property['CODE'] == 'PRODUCT.XML_ID'
                || $property['CODE'] == 'SUM_OF_CHARGE'
            ) {
                continue;
            }

            $property = array_filter($property, ['CSaleBasketHelper', 'filterFields']);
            //$property['BASKET_ID'] = $basketId;
            //$this->makeCompatibleArray($property);

            $properties[] = $property;
        }

        return $properties;
    }

    /**
     * @param $basketItems
     *
     * @return array
     */
    protected function getBasketItemImages($basketItems)
    {
        // image replace priority (if has SKU):
        // 1. offer 'PREVIEW_PICTURE' or 'DETAIL_PICTURE'
        // 2. offer additional picture from parameters
        // 3. parent product 'PREVIEW_PICTURE' or 'DETAIL_PICTURE'
        // 4. parent product additional picture from parameters

        // config
        if($this->config->getMorePhotoCode()) {
            $morePhoto = 'PROPERTY_'.$this->config->getMorePhotoCode();
        }
        if($this->config->getOfferMorePhotoCode()) {
            $morePhotoOffer = 'PROPERTY_'.$this->config->getOfferMorePhotoCode();
        }


        $elements = [];

        if($basketItems) {
            $elementIds = array_values(
                array_map(function($v) {
                    return $v['PRODUCT_ID'];
                }, $basketItems)
            );


            // get parents id
            $skuParent = [];
            $productList = \CCatalogSku::getProductList($elementIds);
            foreach($productList as $offerId => $offerInfo) {
                $skuParent[$offerId] = $offerInfo['ID'];
            }


            $q = \CIBlockElement::GetList(
                [],
                [
                    '=ID'               => array_merge($elementIds, array_unique(array_values($skuParent))),
                    'ACTIVE'            => 'Y',
                    'GLOBAL_ACTIVE'     => 'Y',
                    'ACTIVE_DATE'       => 'Y',
                    'CHECK_PERMISSIONS' => 'Y',
                    'MIN_PERMISSION'    => 'R',
                    'PERMISSIONS_BY'    => $this->getUserId(),
                ],
                false,
                false,
                ['ID', 'PREVIEW_PICTURE', 'DETAIL_PICTURE', $morePhoto, $morePhotoOffer]
            );
            $morePhoto = $morePhoto.'_VALUE';
            $morePhotoOffer = $morePhotoOffer.'_VALUE';

            while($req = $q->GetNextElement()) {
                $fields = $req->GetFields();
                $elements[$fields['ID']]['DETAIL_PICTURE'] = $fields['DETAIL_PICTURE'] ? $this->getPictureSrc(
                    (int)$fields['DETAIL_PICTURE']
                ) : null;
                $elements[$fields['ID']]['PREVIEW_PICTURE'] = $fields['PREVIEW_PICTURE'] ? $this->getPictureSrc(
                    (int)$fields['PREVIEW_PICTURE']
                ) : null;

                if($fields[$morePhoto]) {
                    $elements[$fields['ID']]['MORE_PHOTO'] = $fields[$morePhoto] ? $this->getPictureSrc(
                        (int)$fields[$morePhoto]
                    ) : null;
                } else {
                    if($morePhotoOffer) {
                        $elements[$fields['ID']]['MORE_PHOTO'] = $fields[$morePhotoOffer] ? $this->getPictureSrc(
                            (int)$fields[$morePhotoOffer]
                        ) : null;
                    }
                }
            }

            foreach($basketItems as $k => $v) {
                $productId = $v['PRODUCT_ID'];
                $parentId = $skuParent[$productId] ?? null;

                // get detail image
                if($elements[$productId]['DETAIL_PICTURE']) {
                    $basketItems[$k]['PICTURE'] = $elements[$productId]['DETAIL_PICTURE'];
                    // get preview image
                } else {
                    if($elements[$productId]['PREVIEW_PICTURE']) {
                        $basketItems[$k]['PICTURE'] = $elements[$productId]['PREVIEW_PICTURE'];
                        // get additional picture from parameters
                    } else {
                        if($elements[$productId]['MORE_PHOTO']) {
                            $basketItems[$k]['PICTURE'] = $elements[$productId]['MORE_PHOTO'];
                            // get parent detail image
                        } else {
                            if($parentId && $elements[$skuParent[$productId]]['DETAIL_PICTURE']) {
                                $basketItems[$k]['PICTURE'] = $elements[$skuParent[$productId]]['DETAIL_PICTURE'];
                                // get parent preview image
                            } else {
                                if($parentId && $elements[$skuParent[$productId]]['PREVIEW_PICTURE']) {
                                    $basketItems[$k]['PICTURE'] = $elements[$skuParent[$productId]]['PREVIEW_PICTURE'];
                                    // get parent additional picture from parameters
                                } else {
                                    if($parentId && $elements[$skuParent[$productId]]['MORE_PHOTO']) {
                                        $basketItems[$k]['PICTURE'] = $elements[$skuParent[$productId]]['MORE_PHOTO'];
                                    } else {
                                        $basketItems[$k]['PICTURE']['ORIGINAL']
                                            = $basketItems[$k]['PICTURE']['RESIZE']
                                            = Product::IMAGE_NOT_FOUND;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return $basketItems;
    }

    /**
     * @param $array
     */
    protected function makeCompatibleArray(&$array)
    {
        if(empty($array) || !is_array($array)) {
            return;
        }

        $arr = [];
        foreach($array as $key => $value) {
            if(is_array($value) || preg_match("/[;&<>\"]/", (string)$value)) {
                $arr[$key] = htmlspecialcharsEx($value);
            } else {
                $arr[$key] = $value;
            }

            $arr["~{$key}"] = $value;
        }

        $array = $arr;
    }

    protected function getPropsValues($iblockId, $productId, $props)
    {
        $return = [];
        if($props) {
            foreach($props as $code) {
                $propInfo = \CIBlockElement::GetProperty($iblockId, $productId, ["sort" => "asc"], ["CODE" => $code])
                    ->Fetch();

                if($propInfo) {
                    // HL
                    if(!empty($propInfo['USER_TYPE_SETTINGS']['TABLE_NAME'])) {
                        $HL = HL\HighloadBlockTable::getList(
                            [
                                "filter" => [
                                    'TABLE_NAME' => $propInfo['USER_TYPE_SETTINGS']['TABLE_NAME'],
                                ],
                            ]
                        )->Fetch();

                        $HLEntity = HL\HighloadBlockTable::compileEntity($HL)
                            ->getDataClass();
                        $HLProp = $HLEntity::getList(
                            [
                                'select' => [
                                    'UF_NAME',
                                ],
                                'filter' => ['UF_XML_ID' => $propInfo['VALUE']],
                                'order'  => [],
                                'limit'  => 1,
                            ]
                        )->fetch();

                        if(!$HLProp['UF_NAME']) {
                            continue;
                        }

                        $return[$code] = [
                            'CODE'  => $code,
                            'NAME'  => $propInfo['NAME'],
                            'VALUE' => $HLProp['UF_NAME'],
                            'SORT'  => $propInfo['SORT'],
                        ];
                        // link to element
                    } elseif($propInfo['PROPERTY_TYPE'] === Iblock\PropertyTable::TYPE_ELEMENT) {
                        if(!$propInfo['VALUE']) {
                            continue;
                        }

                        $checkProduct = Product::checkElement((int)$propInfo['VALUE'], $this->getUserId());

                        $return[$code] = [
                            'CODE'  => $code,
                            'NAME'  => $propInfo['NAME'],
                            'VALUE' => $checkProduct['NAME'] ?? $propInfo['VALUE'],
                            'SORT'  => $propInfo['SORT'],
                        ];
                        /*// link to section
                        } elseif($propInfo['PROPERTY_TYPE'] === Iblock\PropertyTable::TYPE_LIST) {

                            if(!$propInfo['VALUE']) {
                                continue;
                            }

                            $checkProduct = Product::checkElement((int)$propInfo['VALUE'], $this->getUserId());

                            $return[$code] = [
                                'CODE'  => $code,
                                'NAME'  => $propInfo['NAME'],
                                'VALUE' => $checkProduct['NAME'] ?? $propInfo['VALUE'],
                                'SORT'  => $propInfo['SORT'],
                            ];*/
                    } else {
                        if(!$propInfo['VALUE']) {
                            continue;
                        }

                        $return[$code] = [
                            'CODE'  => $code,
                            'NAME'  => $propInfo['NAME'],
                            'VALUE' => $propInfo['VALUE_ENUM'] ?? $propInfo['VALUE'],
                            'SORT'  => $propInfo['SORT'],
                        ];
                    }
                }
            }
        }

        return $return;
    }

    protected function getBasketItemProductId(Sale\Basket $basket, $productId)
    {
        $return = [];
        if(!$basket->isEmpty()) {
            foreach($basket as $basketItem) {
                if((int)$basketItem->getProductId() === $productId) {
                    return $basketItem;
                }
            }
        }

        return $return;
    }

    protected function getBasketProductIds(Sale\Basket $basket): array
    {
        $productIds = [];
        foreach($basket as $basketItem) {
            $productId = $basketItem->getProductId();
            if($productId) {
                $productIds[] = $productId;
            }
        }

        return $productIds;
    }


    /*public function getCoupons()
   {
       $result = [];

       if($this->getUserId() === null) {
           throw new SaleException(l::get('EMPTY_USER_ID'), StatusCode::HTTP_UNAUTHORIZED);
       }

       $userId = $this->getUserId();
       $fuser = $this->getSaleFuserId($userId);
       $basket = Sale\Basket::loadItemsForFUser(
           $fuser,
           Context::getCurrent()->getSite()
       );
       $discounts = Sale\Discount::loadByBasket($basket);

       $couponList = $discounts->getApplyResult();
       $result = $couponList['COUPON_LIST'];

       /*foreach($couponList['COUPON_LIST'] as $_coupon) {

       }*//*

        return $result;
    }*/

    /*public function addCoupon($coupon)
    {
        if(!$coupon) {
            throw new SaleException(l::get('ERROR_BASKET_COUPON_NOT_FOUND'), StatusCode::HTTP_BAD_REQUEST);
        }

        $userId = $this->getUserId();
        $fuser = $this->getSaleFuserId($userId);

        Sale\DiscountCouponsManager::init(
            Sale\DiscountCouponsManager::MODE_MANAGER,
            ['userId' => $userId]
        );
        Sale\DiscountCouponsManager::clear(true);


        /*$arCouponFields = array(
            "DISCOUNT_ID" => "4",
            "ACTIVE" => "Y",
            "ONE_TIME" => "Y",
            "COUPON" => $coupon,
            "DATE_APPLY" => false
        );

        $CID = \CCatalogDiscountCoupon::Add($arCouponFields);
        $CID = IntVal($CID);

        return [$CID];
            if($couponData = \Bitrix\Sale\DiscountCouponsManager::getData($coupon, true)) {
                if(Sale\DiscountCouponsManager::add($couponData['COUPON'])) {
                    $basket = Sale\Basket::loadItemsForFUser(
                        $fuser,
                        Context::getCurrent()->getSite()
                    );
                    $discounts = Sale\Discount::loadByBasket($basket);
                    $basket->refreshData(['PRICE','COUPONS']);
                    $discounts->calculate();
                    $basket->doFinalAction(true);
                    $basket->save();


                    \Bitrix\Sale\DiscountCouponsManager::saveApplied();
                    $result = $discounts->getApplyResult();
                    //$discounts->setApplyResult($result);


                    return $result['COUPON_LIST'];
                } else {
                    throw new SaleException(l::get('ERROR_BASKET_COUPON_NOT_FOUND'), StatusCode::HTTP_BAD_REQUEST);
                }
            } else {
                throw new SaleException(l::get('ERROR_BASKET_COUPON_NOT_FOUND'), StatusCode::HTTP_BAD_REQUEST);
            }


        }*/
}