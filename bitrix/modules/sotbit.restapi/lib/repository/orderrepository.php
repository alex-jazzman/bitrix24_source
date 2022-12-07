<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\OrderException,
    Sotbit\RestAPI\Core,
    Sotbit\RestAPI\Localisation as l;

use Bitrix\Sale,
    Bitrix\Main\Entity,
    Bitrix\Main\Loader,
    Bitrix\Main\Type\DateTime,
    Bitrix\Main\UserTable,
    Bitrix\Sale\Cashbox\CheckManager,
    Bitrix\Main\Config\Option;

class OrderRepository extends BaseRepository
{
    protected $order = [];
    protected $statuses = [];
    protected $paySystems = [];
    protected $deliveries = [];
    protected $error = [];
    protected $userId;

    /**
     * OrderRepository constructor.
     *
     * @throws \Bitrix\Main\LoaderException
     */
    public function __construct()
    {
        parent::__construct();
        if(!Loader::includeModule("sale")) {
            throw new OrderException(l::get('ERROR_MODULE_SALE'), StatusCode::HTTP_BAD_REQUEST);
        }
        if(!Loader::includeModule("catalog")) {
            throw new OrderException(l::get('ERROR_MODULE_CATALOG'), StatusCode::HTTP_BAD_REQUEST);
        }

        // order class name
        $this->order = Sale\Registry::getInstance(
            Sale\Registry::REGISTRY_TYPE_ORDER
        )->getOrderClassName();
    }

    /**
     * Get order by ID
     *
     * @param  int  $orderId
     * @param  int|null  $userId
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentNullException
     */
    public function getById(int $orderId, int $userId = null): array
    {
        $this->userId = $userId;

        $order = $this->order::load($orderId);

        return $this->getOrderDetail($order);
    }

    /**
     * Get order by account number
     *
     * @param  string  $accountNumber
     * @param  int|null  $userId
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentException
     * @throws \Bitrix\Main\ArgumentNullException
     * @throws \Bitrix\Main\NotImplementedException
     */
    public function getByAccountNumber(string $accountNumber, int $userId = null): array
    {
        $this->userId = $userId;
        $order = $this->order::loadByAccountNumber($accountNumber);

        return $this->getOrderDetail($order);
    }

    /**
     * Get list orders
     *
     * @param  array  $params
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentException
     */
    public function getList(array $params): array
    {
        $result = [];

        $params = $this->prepareNavigation($params);

        $filterParams = [
            'filter' => $params['filter'],
            'order'  => $params['order'],
            'limit'  => $params['limit'],
            'offset' => ($params['limit'] * ($params['page'] - 1)),
        ];

        // count
        $filterCount = array_merge(
            [
                'select'  => ['CNT'],
                'runtime' => [new Entity\ExpressionField('CNT', 'COUNT(*)')],
            ],
            $filterParams
        );

        // count all
        $filterCountAll = [
            'select'  => ['CNT'],
            'runtime' => [new Entity\ExpressionField('CNT', 'COUNT(*)')],
            'filter'  => ['USER_ID' => $params['user_id']],
        ];

        // query
        $filterQuery = array_merge(
            [
                'select' => $params['select'] ?? ['*'],
            ],
            $filterParams
        );


        // Count all
        $result['info']['count_select'] = (int)$this->order::getList($filterCount)->fetch()['CNT'];
        $result['info']['count_all'] = (int)$this->order::getList($filterCountAll)->fetch()['CNT'];

        // Query
        if($result['info']['count_select']) {
            $query = $this->order::getList($filterQuery);

            $fetch = [];
            while($order = $query->fetch()) {
                $fetch[$order['ID']] = $order;
            }
            if(!empty($fetch)) {
                $result['info']['count_select'] = count($fetch);
                $result['data'] = $fetch;
            }
        } else {
            $result['data'] = [];
            $result['info']['count_select'] = 0;
        }

        return $result;
    }

    /**
     * Check and get order detail
     *
     * @param $order
     *
     * @return array
     */
    public function getOrderDetail($order): array
    {
        $result = [];

        $order = $this->checkOrder($order);
        $this->statuses = $this->getStatuses();

        $result = [
            'main'     => $this->getOrderMainInfo($order),
            'buyer'    => $this->getOrderBuyer($order),
            'property' => $this->getOrderProperties($order),
            'basket'   => $this->getOrderBasket($order),
            'pay'      => $this->getOrderPayment($order),
            'delivery' => $this->getOrderDelivery($order),

        ];

        return $result;
    }

    /**
     * Get order main info
     *
     * @param  Sale\Order  $order
     * @param  array  $fields
     *
     * @return array
     */
    public function getOrderMainInfo(Sale\Order $order): array
    {
        $info = [
            'ID'                 => $order->getId(),
            'ACCOUNT_NUMBER'     => $order->getField("ACCOUNT_NUMBER"),
            'STATUS_ID'          => $order->getField("STATUS_ID"),
            'STATUS_DESCRIPTION' => $this->statuses[$order->getField("STATUS_ID")],
            //'PRICE'              => $order->getPrice(),
            //'DISCOUNT_PRICE'     => $order->getDiscountPrice(),
            'USE_VAT'            => $order->isUsedVat(),
            'VAT_RATE'           => $order->getVatRate(),
            'VAT_SUM'            => $order->getVatSum(),
            'CURRENCY'           => $order->getCurrency(),
            'WEIGHT'             => $this->getOrderWeight($order),
            'DATE_INSERT'        => $order->getDateInsert(),
            'DATE_UPDATE'        => $order->getField("DATE_UPDATE"),
            'CANCELED'           => $order->getField("CANCELED"),
            'REASON_CANCELED'    => $order->getField("REASON_CANCELED"),
            'LID'                => $order->getSiteId(),
            //'property' => $property,
        ];

        $info = array_merge($info, $this->getOrderTotalPrice($order));

        return $info;
    }

    /**
     * Get order buyer info
     *
     * @param  Sale\Order  $order
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentException
     * @throws \Bitrix\Main\ObjectPropertyException
     * @throws \Bitrix\Main\SystemException
     */
    public function getOrderBuyer(Sale\Order $order): array
    {
        $userId = (int)$order->getUserId();
        $buyerUserName = false;

        if($userId > 0) {
            $res = UserTable::getById($userId);
            if($buyer = $res->fetch()) {
                $buyerUserName = \CUser::FormatName(
                    \CSite::GetNameFormat(
                        null,
                        $order->getSiteId()
                    ),
                    $buyer,
                    true,
                    false
                );
            }
        }

        return [
            "USER_ID"          => (int)$order->getUserId(),
            "PERSON_TYPE_ID"   => $order->getPersonTypeId(),
            "PERSON_TYPE_NAME" => $this->getPersonTypeName($order->getPersonTypeId()),
            "BUYER_USER_NAME"  => $buyerUserName,
            "USER_DESCRIPTION" => $order->getField("USER_DESCRIPTION"),
        ];
    }


    /**
     * Get order property
     *
     * @param  Sale\Order  $order
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentException
     * @throws \Bitrix\Main\NotImplementedException
     * @throws \Bitrix\Main\ObjectPropertyException
     * @throws \Bitrix\Main\SystemException
     */
    public function getOrderProperties(Sale\Order $order): array
    {
        $propertyCollection = $order->getPropertyCollection();
        $result = [];

        foreach($propertyCollection->getGroups() as $group) {
            $resultBody = [];
            $groupProperties = $propertyCollection->getPropertiesByGroupId($group['ID']);
            if(!is_array($groupProperties)) {
                continue;
            }

            /** @var \Bitrix\Sale\PropertyValue $property */
            foreach($propertyCollection->getPropertiesByGroupId($group['ID']) as $property) {
                $propertyValue = $property->getValue();

                if(
                    !isset($propertyValue)
                    || (is_array($propertyValue) && empty($propertyValue))
                    || $propertyValue === ""

                ) {
                    continue;
                }

                $p = $property->getProperty();

                if($p['IS_PHONE'] === 'Y') {
                    $phoneVal = $property->getValue();

                    if($phoneVal != '') {
                        if(!is_array($phoneVal)) {
                            $phoneVal = [$phoneVal];
                        }

                        $propertyValue = '';

                        foreach($phoneVal as $number) {
                            $number = str_replace("'", "", htmlspecialcharsbx($number));

                            if(strlen($propertyValue) > 0) {
                                $propertyValue .= ', ';
                            }

                            $propertyValue .= $number;
                        }
                    } else {
                        $propertyValue = '';
                    }
                } elseif($p['IS_EMAIL'] === 'Y') {
                    $propertyValue = $property->getValue();
                } else {
                    $propertyValue = $property->getViewHtml();
                }
                $p['VALUE'] = $propertyValue;


                $resultBody[$property->getPropertyId()] = $p;
            }

            if(!empty($resultBody)) {
                $result[$group['ID']] = [
                    'title' => htmlspecialcharsbx($group['NAME']),
                    'sort'  => $group['SORT'],
                    'data'  => $resultBody,
                ];
            }
        }

        return $result;
    }

    /**
     * Get order basket
     *
     * @param  Sale\Order  $order
     * @param  null | array  $fields
     *
     * @return array
     */
    public function getOrderBasket(Sale\Order $order): array
    {
        $basketList = [];
        $productsList = [];
        $basket = $order->getBasket();
        if($basket) {
            $basketFormatText = $basket->getListOfFormatText();
            $basketItemsList = $basket->getBasketItems();

            /**  @var Sale\BasketItem $basketItem */
            foreach($basketItemsList as $basketItem) {
                $basketValues = $basketItem->getFieldValues();
                $basketPropertyCollection = $basketItem->getPropertyCollection();


                if(Loader::includeModule('catalog')) {
                    $parentList = \CCatalogSku::GetProductInfo($basketValues["PRODUCT_ID"]);
                    if(!empty($parentList)) {
                        $basketValues['PARENT'] = $parentList;
                    }
                }

                /**  @var Sale\BasketPropertyItem $basketProperty */
                foreach($basketPropertyCollection as $basketProperty) {
                    $basketPropertyList = $basketProperty->getFieldValues();
                    if($basketPropertyList['CODE'] !== "CATALOG.XML_ID"
                        && $basketPropertyList['CODE'] !== "PRODUCT.XML_ID"
                        && $basketPropertyList['CODE'] !== "SUM_OF_CHARGE"
                    ) {
                        $basketValues['PROPS'][$basketPropertyList['CODE']] = $basketPropertyList;
                    }
                }


                $basketValues['FORMATED_TEXT'] = $basketFormatText[$basketValues['ID']];
                $basketValues['FORMATED_SUM'] = SaleFormatCurrency(
                    $basketValues["PRICE"] * $basketValues['QUANTITY'],
                    $basketValues["CURRENCY"]
                );
                $basketValues['FORMATED_BASE_SUM'] = SaleFormatCurrency(
                    $basketValues["BASE_PRICE"] * $basketValues['QUANTITY'],
                    $basketValues["CURRENCY"]
                );

                $basketList[$basketValues['PRODUCT_ID']] = $basketValues;
            }

            // Images
            $basketList = $this->getProductsImage($basketList);
        }


        return $basketList;
    }


    /**
     * Get order payment
     *
     * @param  Sale\Order  $order
     * @param  array  $fields
     *
     * @return array
     */
    public function getOrderPayment(Sale\Order $order): array
    {
        $paymentList = [];
        $paymentCollection = $order->getPaymentCollection();
        foreach($paymentCollection as $payment) {
            $paymentId = $payment->getPaymentSystemId();
            $paymentList[$paymentId] = $payment->getFieldValues();
            $paymentList[$paymentId]['CHECK_DATA'] = CheckManager::getCheckInfo($payment);
            $paymentList[$paymentId]['SUM_FORMATED'] = SaleFormatCurrency(
                $paymentList[$paymentId]['SUM'],
                $paymentList[$paymentId]['CURRENCY']
            );
        }

        return $paymentList;
    }

    /**
     * Get order delivery
     *
     * @param  Sale\Order  $order
     * @param  array  $fields
     *
     * @return array
     */
    public function getOrderDelivery(Sale\Order $order): array
    {
        $deliveryList = [];


        $shipmentOrder = [];
        /** @var Sale\Shipment $shipment */
        $shipmentCollection = $order->getShipmentCollection();

        $trackingManager = Sale\Delivery\Tracking\Manager::getInstance();

        foreach($shipmentCollection as $shipment) {
            if($shipment->isSystem()) {
                continue;
            }

            $shipmentItems = $shipment->getShipmentItemCollection();

            $shipmentFields = $shipment->getFieldValues();
            $shipmentFields['ITEMS'] = [];
            /** @var \Bitrix\Sale\ShipmentItem $item */
            foreach($shipmentItems as $item) {
                $basketItem = $item->getBasketItem();
                if($basketItem instanceof Sale\BasketItem) {
                    $quantity = Sale\BasketItem::formatQuantity($item->getQuantity());
                    $basketId = $basketItem->getId();

                    $shipmentFields['ITEMS'][$basketId] = [
                        'BASKET_ID' => $basketId,
                        'QUANTITY'  => $quantity,
                    ];
                }
            }

            if($shipmentFields["DELIVERY_ID"] > 0 && !empty($shipmentFields["TRACKING_NUMBER"])) {
                $shipmentFields["TRACKING_URL"] = $trackingManager->getTrackingUrl(
                    $shipmentFields["DELIVERY_ID"],
                    $shipmentFields["TRACKING_NUMBER"]
                );
            }
            $currency = $shipmentFields["CURRENCY"];
            if(empty($currency)) {
                $currency = $order->getCurrency();
            }

            if($shipmentFields['LOGOTIP']) {
                $shipmentFields["SRC_LOGOTIP"] = \CFile::GetPath($shipmentFields['LOGOTIP']);
            }

            $shipmentFields["PRICE_DELIVERY_FORMATTED"] = SaleFormatCurrency(
                $shipmentFields['PRICE_DELIVERY'],
                $currency
            );


            $deliveryList[$shipmentFields['ID']] = $shipmentFields;
        }

        return $deliveryList;
    }

    /**
     * @param  Sale\Order  $order
     * @param  bool  $needRecalculate
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentNullException
     */
    public function getOrderTotalPrice(Sale\Order $order, $needRecalculate = true): array
    {
        $currency = $order->getCurrency();
        $result = [
            'PRICE_TOTAL'               => $order->getPrice(),
            'TAX_VALUE'                 => $order->getTaxValue(),
            'PRICE_DELIVERY_DISCOUNTED' => $order->getDeliveryPrice(),
            'SUM_PAID'                  => $order->getSumPaid(),
            'ORDER_DISCOUNT_VALUE'      => $order->getField('DISCOUNT_VALUE'),
        ];

        $result["SUM_UNPAID"] = $result["PRICE_TOTAL"] - $result["SUM_PAID"];

        if(!$result["PRICE_DELIVERY_DISCOUNTED"]) {
            $result["PRICE_DELIVERY_DISCOUNTED"] = 0;
        }

        if(!$result["TAX_VALUE"]) {
            $result["TAX_VALUE"] = 0;
        }

        $orderDiscount = $order->getDiscount();

        if($orderDiscount) {
            $discountsList = self::getOrderDiscountsApplyResult($order, $needRecalculate);
        } else {
            $discountsList = [];
        }

        if(isset($discountsList["PRICES"]["DELIVERY"]["DISCOUNT"])) {
            $result['DELIVERY_DISCOUNT'] = $discountsList["PRICES"]["DELIVERY"]["DISCOUNT"];
        } else {
            $result['DELIVERY_DISCOUNT'] = 0;
        }

        $result['PRICE_DELIVERY'] = $result['PRICE_DELIVERY_DISCOUNTED'] + $result['DELIVERY_DISCOUNT'];
        $basketData = $this->getOrderPrices($order, $discountsList);
        $result["PRICE_BASKET_DISCOUNTED"] = $basketData["BASKET_PRICE"];
        $result["PRICE_BASKET"] = $basketData["BASKET_PRICE_BASE"];

        foreach($result as &$v) {
            $v = \CCurrencyLang::currencyFormat(
                (float)$v,
                $currency,
                true
            );
        }

        return $result;
    }

    /**
     * @param  Sale\Order  $order
     * @param  null  $discounts
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentNullException
     */
    public function getOrderPrices(Sale\Order $order, $discounts = null)
    {
        static $result = null;

        if($result === null) {
            $basketPrice = 0;
            $basketPriceBase = 0;
            $basket = $order->getBasket();

            if($basket) {
                if(!$discounts) {
                    $discounts = self::getOrderDiscountsApplyResult($this->order, true);
                }

                $basketPriceBase = $basket->getBasePrice();
                $basketPrice = $basket->getPrice();
            }

            $result = [
                "BASKET_PRICE_BASE" => $basketPriceBase,
                "BASKET_PRICE"      => $basketPrice,
            ];

            $result["DISCOUNT_VALUE"] = $result["BASKET_PRICE_BASE"] - $result["BASKET_PRICE"];
        }

        return $result;
    }

    /**
     * Get order status
     *
     * @param  int  $orderId
     * @param  int|null  $userId
     *
     * @return string
     * @throws \Bitrix\Main\ArgumentNullException
     */
    public function getStatus(int $orderId, int $userId = null): string
    {
        $this->userId = $userId;
        $order = $this->order::load($orderId);
        $order = $this->checkOrder($order);

        return $order->getField("STATUS_ID");
    }

    /**
     * Order cancel
     *
     * @param  int  $orderId
     * @param  string  $reason
     * @param  int|null  $userId
     *
     * @return bool
     * @throws OrderException
     * @throws \Bitrix\Main\ArgumentNullException
     */
    public function cancel(string $orderId, string $reason = '', int $userId = null): ?array
    {
        global $APPLICATION;

        $this->userId = $userId;
        $ids = explode(',', $orderId);

        foreach($ids as $_ids) {
            if(!$_ids) {
                continue;
            }

            $order = $this->order::load((int)$_ids);
            $order = $this->checkOrderCancel($order);
            if($reason) {
                $reason = htmlspecialchars(Core\Helper::convertEncodingToSite($reason));
            }

            if(count($this->error) && array_key_exists($order->getId(), $this->error)) {
                continue;
            }

            $oldOrderObject = new \CSaleOrder();
            $oldOrderObject->CancelOrder($order->getId(), "Y", $reason);
            if($ex = $APPLICATION->GetException()) {
                $this->error[$order->getId()] = $ex->GetString();
            }
        }

        return count($this->error) ? $this->error : null;
    }


    /**
     * Get all active pay systems
     *
     * @return array
     * @throws \Bitrix\Main\ArgumentException
     */
    public function getPaySystems(): array
    {
        $query = Sale\PaySystem\Manager::getList(
            [
                'filter' => [
                    'ACTIVE' => 'Y',
                ],
            ]
        );
        while($paySystem = $query->Fetch()) {
            $this->paySystems[$paySystem['ID']] = $paySystem;
        }

        return $this->paySystems;
    }

    public function getDeliveries(): array
    {
        $query = Sale\Delivery\Services\Table::getList(
            [
                'filter' => [
                    'ACTIVE' => 'Y',
                ],
            ]
        );
        while($delivery = $query->Fetch()) {
            $this->deliveries[$delivery['ID']] = $delivery;
        }

        return $this->deliveries;
    }

    /**
     * Get all statuses from sale
     *
     * @return array
     */
    public function getStatuses(): array
    {
        $query = Sale\Internals\StatusLangTable::getList(
            [
                'order'  => ['STATUS.SORT' => 'ASC'],
                //'filter' => array('STATUS.TYPE'=>'O','LID'=>LANGUAGE_ID),
                'select' => ['STATUS_ID', 'NAME', 'DESCRIPTION'],
            ]
        );

        while($status = $query->fetch()) {
            $this->statuses[$status['STATUS_ID']] = $status['NAME'];
        }

        return $this->statuses;
    }

    /**
     * Get all person type from sale
     *
     * @return array
     */
    public function getPersonTypes(): array
    {
        return Sale\PersonType::load($this->siteId);
    }

    public function getPersonTypeName($id): string
    {
        if($personTypes = $this->getPersonTypes()) {
            return $personTypes[$id]['NAME'];
        }

        return '';
    }

    /**
     * Check order for the entity and user permission
     *
     * @param $order
     *
     * @return mixed
     */
    public function checkOrder($order)
    {
        if($order === null) {
            throw new OrderException(l::get('ERROR_ORDER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        if(!($order instanceof Sale\Order)) {
            throw new OrderException(l::get('ERROR_ORDER_OBJECT_INVALID'), StatusCode::HTTP_BAD_REQUEST);
        }
        $this->checkOrderPermissions($order, (int)$this->userId);

        return $order;
    }


    /**
     * Checking order before canceling
     *
     * @param $order
     *
     * @return Sale\Order|mixed
     * @throws OrderException
     */
    public function checkOrderCancel($order)
    {
        $order = $this->checkOrder($order);

        if($order->isPaid() || $order->isShipped()) {
            $this->error[$order->getId()] = l::get('ERROR_ORDER_CANCEL', ['#ID#' => $order->getId()]);
            /*throw new OrderException(
                l::get('ERROR_ORDER_CANCEL'),
                StatusCode::HTTP_BAD_REQUEST
            );*/
        }

        return $order;
    }

    /**
     * Check user permission
     *
     * @param  int  $userId
     * @param  int  $userIdLogged
     */
    protected function checkOrderPermissions(object $order, int $userIdLogged): void
    {
        if($userIdLogged && (int)$order->getUserId() !== $userIdLogged
            && (int)$order->getField('CREATED_BY') !== $userIdLogged
        ) {
            throw new OrderException(l::get('ERROR_ORDER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }
    }

    public static function getOrderDiscountsApplyResult(Sale\Order $order, $needRecalculate = false)
    {
        static $calcResults = null;

        if($order instanceof Sale\Archive\Order) {
            /** @var Sale\Archive\Order $order */
            return $order->getDiscountData();
        }

        if($calcResults === null || $needRecalculate) {
            $discounts = $order->getDiscount();

            if($needRecalculate) {
                /** @var Sale\Result $r */
                $r = $discounts->calculate();

                if($r->isSuccess()) {
                    $discountData = $r->getData();
                    $order->applyDiscount($discountData);
                }
            }

            $calcResults = $discounts->getApplyResult(true);
            unset($discounts);
        }

        return $calcResults === null ? [] : $calcResults;
    }


    protected function getOrderWeight(Sale\Order $order)
    {
        $weightKoef = (float)Option::get('sale', 'weight_koef', 1, $order->getSiteId());
        $weightUnit = htmlspecialcharsbx(Option::get('sale', 'weight_unit', "", $order->getSiteId()));

        if($weightKoef <= 0) {
            $weightKoef = 1;
        }

        $basket = $order->getBasket();

        if($basket) {
            $weight = $basket->getWeight();
        } else {
            $weight = 0;
        }


        return roundEx((float)($weight / $weightKoef), SALE_WEIGHT_PRECISION).' '.$weightUnit;
    }


    /**
     * Get images products
     *
     * @param $productsList
     *
     * @return mixed
     * @throws \Bitrix\Main\LoaderException
     */
    protected function getProductsImage($productsList)
    {
        if(Loader::includeModule("iblock") && !empty($productsList)) {
            $productsIds = [];
            $productsImages = [];

            // Collect all products ID
            foreach($productsList as $key => $val) {
                $productsIds[] = $val['PRODUCT_ID'];
                if(!empty($val['PARENT']['ID'])) {
                    $productsIds[] = $val['PARENT']['ID'];
                }
            }
            $productsIds = array_unique($productsIds);

            // Get images of collected items
            $arProducts = \CIBlockElement::GetList(
                [],
                ['=ID' => $productsIds],
                false,
                false,
                ['ID', 'DETAIL_PICTURE', 'PREVIEW_PICTURE']
            );
            while($arProduct = $arProducts->fetch()) {
                $productsImages[$arProduct['ID']] = $arProduct;
            }

            // Add field PICTURE_URL to the main array products
            foreach($productsList as $key => $product) {
                $imgCode = '';
                $imgUrl = '';

                if($productsImages[$key]["PREVIEW_PICTURE"]) {
                    $imgCode = $productsImages[$key]["PREVIEW_PICTURE"];
                } elseif($productsImages[$key]["DETAIL_PICTURE"] > 0) {
                    $imgCode = $productsImages[$key]["DETAIL_PICTURE"];
                }

                if(empty($imgCode) && is_array($product['PARENT']) && count($product['PARENT']) > 0) {
                    if($productsImages[$product['PARENT']['ID']]["PREVIEW_PICTURE"] > 0) {
                        $imgCode = $productsImages[$product['PARENT']['ID']]["PREVIEW_PICTURE"];
                    } elseif($productsImages[$product['PARENT']['ID']]["DETAIL_PICTURE"] > 0) {
                        $imgCode = $productsImages[$product['PARENT']['ID']]["DETAIL_PICTURE"];
                    }
                }

                if($imgCode > 0) {
                    $arFile = \CFile::GetFileArray($imgCode);
                    $arImgProduct = \CFile::ResizeImageGet(
                        $arFile,
                        ['width' => 80, 'height' => 80],
                        BX_RESIZE_IMAGE_PROPORTIONAL,
                        false,
                        false
                    );
                    if(is_array($arImgProduct)) {
                        $imgUrl = $arImgProduct["src"];
                    }
                }

                if(!empty($productsList[$key])) {
                    $productsList[$key]['PICTURE_URL'] = $imgUrl ? : null;
                }
            }
        }

        return $productsList;
    }
}
