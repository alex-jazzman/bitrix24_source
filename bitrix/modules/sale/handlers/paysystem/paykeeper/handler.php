<?php

namespace Sale\Handlers\PaySystem;

use Bitrix\Sale;
use Bitrix\Catalog;
use Bitrix\Catalog\Mysql\CCatalogVat;
use Bitrix\Main\Application;
use Bitrix\Main\Web\Uri;
use Bitrix\Main\Error;
use Bitrix\Main\Request;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\Localization\Loc;
use Bitrix\Sale\PaySystem;
use Bitrix\Sale\Payment;
use Bitrix\Sale\PriceMaths;
use Bitrix\Sale\Shipment;
use Bitrix\Main\Web;
use PaykeeperPayment;

// Подключаем файл с классом PaykeeperPayment
require_once __DIR__ . '/lib/paykeeper.class.php';

define('LOG_FILE', realpath(dirname(__FILE__)) . "/logs/paykeeper.log");

class PayKeeperHandler extends PaySystem\ServiceHandler implements PaySystem\IRefund
{
    const log_file = LOG_FILE;
    private static $service_name = 'paykeeper_payment_system';
    private $convert_full_tax_rate = false;
    private $delivery_name_fixed = '';
    private $tru_code_name = '';
    private $basket_item_type = 'goods';
    private $basket_payment_type = 'prepay';
    private $delivery_item_type = 'service';
    private $delivery_payment_type = 'prepay';
    private $basket_measure = 'pcs';
    private $discount = false;
    private $logging = false;
    private $vat = 'none';
    private $vat_priority = false;
    private $vat_delivery = 'none';
    private $vat_delivery_priority = false;
    private $pk_obj = null;

    /**
     * @param Payment $payment
     * @param Request|null $request
     * @return PaySystem\ServiceResult
     */
    public function initiatePay(Payment $payment, Request $request = null)
    {
        $this->pk_obj = new PaykeeperPayment();
        $paykeeper_url = $this->getBusinessValue($payment, 'PAYKEEPER_FORM_URL');

        $paykeeper_url = rtrim($paykeeper_url, '/');
        if (strpos($paykeeper_url, '/create') === false && strpos($paykeeper_url, '/order') === false) {
            $paykeeper_url = $paykeeper_url . '/create';
        }

        $secret = $this->getBusinessValue($payment, 'PAYKEEPER_SECRET');
        $service_name = $payment->getField('ID') . '|' . self::$service_name;
        $ordernum =  $this->getBusinessValue($payment, 'PAYKEEPER_ORDER_NUMBER');
        $orderid = (strpos($paykeeper_url, '/create')) ? $ordernum : $ordernum . '|' . $service_name;
        $order = Sale\Order::load($payment->getOrderId());
        $propertyCollection = $order->getPropertyCollection();
        $this->pk_obj->setOrderTotal(floatval($this->getBusinessValue($payment, 'PAYKEEPER_ORDER_AMOUNT')));
        $clientid = is_null($propertyCollection->getPayerName()) ? '' : $propertyCollection->getPayerName()->getValue();
        $client_email = is_null($propertyCollection->getUserEmail()) ? '' : $propertyCollection->getUserEmail()->getValue();
        $client_phone = is_null($propertyCollection->getPhone()) ? '' : $propertyCollection->getPhone()->getValue();

        //set order parameters
        $this->pk_obj->setOrderParams(
            $this->pk_obj->getOrderTotal(),  // sum
            $clientid,                       // clientid
            $orderid,                        // orderid
            $client_email,                   // client_email
            $client_phone,                   // client_phone
            $service_name,                   // service_name
            $paykeeper_url,                  // payment form url
            $secret                          // secret key
        );

        if ($this->getBusinessValue($payment, 'PAYKEEPER_LOGGING') === 'Y') {
            $this->logging = true;
        }

        if ($this->getBusinessValue($payment, 'PAYKEEPER_CART') === 'Y') {
            // Receipt Options
            if ($this->getBusinessValue($payment, 'PAYKEEPER_USE_FIXED_NAME_DELIVERY') === 'Y'
                && !empty($this->getBusinessValue($payment, 'PAYKEEPER_FIXED_NAME_DELIVERY'))
            ){
                $this->delivery_name_fixed = $this->getBusinessValue($payment, 'PAYKEEPER_FIXED_NAME_DELIVERY');
            }
            if ($this->getBusinessValue($payment, 'PAYKEEPER_TRU_CODE_USE') === 'Y'
                && !empty($this->getBusinessValue($payment, 'PAYKEEPER_TRU_CODE_NAME'))
            ){
                $this->tru_code_name = $this->getBusinessValue($payment, 'PAYKEEPER_TRU_CODE_NAME');
            }
            $this->convert_full_tax_rate = $this->getBusinessValue($payment, 'PAYKEEPER_CONVERT_FULL_RATES') === 'Y';
            $this->discount = $this->getBusinessValue($payment, 'PAYKEEPER_DISCOUNT') === 'Y';
            $this->basket_item_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_BASKET_ITEM_TYPE'), 'item_type');
            $this->basket_payment_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_BASKET_PAYMENT_TYPE'), 'payment_type');
            $this->delivery_item_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_DELIVERY_ITEM_TYPE'), 'item_type');
            $this->delivery_payment_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_DELIVERY_PAYMENT_TYPE'), 'payment_type');
            $this->basket_measure = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_BASKET_MEASURE'), 'measure');
            $this->vat = self::_getValueTypeParamCart($this->getBusinessValue($payment, 'PAYKEEPER_VAT'), 'vat');
            $this->vat_priority = $this->getBusinessValue($payment, 'PAYKEEPER_VAT_PRIORITY') === 'Y';
            $this->vat_delivery = self::_getValueTypeParamCart($this->getBusinessValue($payment, 'PAYKEEPER_VAT_DELIVERY'), 'vat');
            $this->vat_delivery_priority = $this->getBusinessValue($payment, 'PAYKEEPER_VAT_DELIVERY_PRIORITY') === 'Y';
            $this->pk_obj->fiscal_cart = $this->_cart($order);
        } else {
            $this->pk_obj->fiscal_cart = [];
        }

        $params = array(
            'form_url' => $this->pk_obj->getOrderParams('form_url'),
            'sum' => $this->pk_obj->getOrderTotal(),
            'orderid' => $this->pk_obj->getOrderParams('orderid'),
            'clientid' => $this->pk_obj->getOrderParams('clientid'),
            'client_email' => $this->pk_obj->getOrderParams('client_email'),
            'client_phone' => $this->pk_obj->getOrderParams('client_phone'),
            'service_name' => $this->pk_obj->getOrderParams('service_name'),
            'phone' => $this->pk_obj->getOrderParams('client_phone'),
            'cart' => $this->pk_obj->getFiscalCartEncoded()
        );

        if ($this->getBusinessValue($payment, 'PAYKEEPER_PSTYPE') != '') {
            $params['pstype'] = $this->getBusinessValue($payment, 'PAYKEEPER_PSTYPE');
        }

        if ($this->getBusinessValue($payment, 'PAYKEEPER_SBP') === 'Y') {
            $params['sbp'] = true;
        }

        $request = Application::getInstance()->getContext()->getRequest();
        $uriString = $request->getRequestUri();
        $uri = new Uri($uriString);

        if ($this->getBusinessValue($payment, 'PAYKEEPER_REDIRECT_TO_ORDER') === 'Y'
            && $this->getBusinessValue($payment, 'PAYKEEPER_ORDER_PAGE'))
        {
            $params['user_result_callback'] = str_replace(
                [ '#order_id#' ],
                [ $payment->getOrderId() ],
                $this->getBusinessValue($payment, 'PAYKEEPER_ORDER_PAGE')
            );
        }

        // If the language is not English, default to Russian.
        $pf_lang = LANGUAGE_ID;
        if ($pf_lang !== 'en' && $pf_lang !== 'ru') {
            Loc::setCurrentLang('ru');
            $pf_lang = 'ru';
        }

        $params['contacts'] = false;
        $params['detail_page_message'] = Loc::getMessage('SALE_HPS_PAYKEEPER_BUTTON_REDIRECT');
        $params['redirect'] = true;

        $isPublicLink = strpos($uri->GetLocator(), 'access=') !== false;
        $isOrderPage = strpos($uri->GetLocator(), "/personal/orders/" . urlencode(urlencode($ordernum))) !== false;
        $formRedirectDisabled = $this->getBusinessValue($payment, 'PAYKEEPER_FORM_REDIRECT') !== 'Y';

        if ($isOrderPage || $isPublicLink || $formRedirectDisabled) {
            // If the payment page is accessed via a public link
            if ($isPublicLink) {
                $params['contacts'] = $this->getBusinessValue($payment, 'PAYKEEPER_ORDER_CONTACTS') === 'Y';
                $params['detail_page_message'] = Loc::getMessage('SALE_HPS_PAYKEEPER_BUTTON_PERSONAL');
            } else {
                $params['detail_page_message'] = Loc::getMessage('SALE_HPS_PAYKEEPER_BUTTON_PRESS');
            }
            $params['redirect'] = false;
        }

        $params['pay_button'] = Loc::getMessage('SALE_HPS_PAYKEEPER_BUTTON');

        if (LANG_CHARSET != 'UTF-8' && $pf_lang == 'ru') {
            $params['detail_page_message'] = iconv('UTF-8', LANG_CHARSET, $params['detail_page_message']);
            $params['pay_button'] = iconv('UTF-8', LANG_CHARSET, $params['pay_button']);
        }

        if ($this->pk_obj->getPaymentFormType() == 'create') { //create form
            $params['form_type'] = 'create';
            $to_hash = number_format($this->pk_obj->getOrderTotal(), 2, '.', '').
                $this->pk_obj->getOrderParams('clientid')     .
                $this->pk_obj->getOrderParams('orderid')      .
                $this->pk_obj->getOrderParams('service_name') .
                $this->pk_obj->getOrderParams('client_email') .
                $this->pk_obj->getOrderParams('client_phone') .
                $this->pk_obj->getOrderParams('secret_key');
            $sign = hash ('sha256' , $to_hash);
            $params['sign'] = $sign;
            $params['lang'] = $pf_lang;
        } else { //order form
            $payment_parameters = array(
                'clientid' => $this->pk_obj->getOrderParams('clientid'),
                'orderid' => $this->pk_obj->getOrderParams('orderid'),
                'sum' => $this->pk_obj->getOrderTotal(),
                'client_phone' => $this->pk_obj->getOrderParams('phone'),
                'phone' => $this->pk_obj->getOrderParams('phone'),
                'client_email' => $this->pk_obj->getOrderParams('client_email'),
                'cart' => $this->pk_obj->getFiscalCartEncoded()
            );

            $result = $this->_Send($this->pk_obj->getOrderParams('form_url'), $payment_parameters, [], 'text');
            if (isset($result['errorCode'])) {
                if (!$result['errorMessage']) {
                    $result['errorMessage'] = Loc::getMessage('SALE_HPS_PAYKEEPER_ERROR_FORM');
                }
                $form = '<p class="paykeeper__error">'."INTERNAL ERROR: {$result['errorMessage']}".'</p>';
            } else {
                $form = $result['msg'];
            }
            $params['detail_page_message'] = $form;
        }
        $this->setExtraParams($params);
        return $this->showTemplate($payment, 'template');
    }

    /**
     * @param Payment $payment
     * @param $refundableSum
     * @return PaySystem\ServiceResult
     * @throws Main\ArgumentException
     * @throws Main\ArgumentNullException
     * @throws Main\ArgumentOutOfRangeException
     * @throws Main\ArgumentTypeException
     * @throws Main\ObjectException
     */
    public function refund(Payment $payment, $refundableSum)
    {
        $this->pk_obj = new PaykeeperPayment();
        $result = new PaySystem\ServiceResult();
        $paykeeper_url = $this->getBusinessValue($payment, 'PAYKEEPER_FORM_URL');
        $paykeeper_login = $this->getBusinessValue($payment, 'PAYKEEPER_LK_LOGIN');
        $paykeeper_password = $this->getBusinessValue($payment, 'PAYKEEPER_LK_PASSWORD');
        foreach (['/create', '/order'] as $keyword) {
            if ($pos = strrpos($paykeeper_url, $keyword)) {
                $paykeeper_url = substr($paykeeper_url, 0, $pos);
                break;
            }
        }
        $paykeeper_url = rtrim($paykeeper_url, '/');
        $paykeeper_id = $payment->getField('PS_INVOICE_ID');
        $order = Sale\Order::load($payment->getOrderId());
        $this->pk_obj->setOrderTotal($refundableSum);

        if ($this->getBusinessValue($payment, 'PAYKEEPER_LOGGING') === 'Y') {
            $this->logging = true;
        }

        if ($this->getBusinessValue($payment, 'PAYKEEPER_CART') === 'Y') {
            // Receipt Options
            if ($this->getBusinessValue($payment, 'PAYKEEPER_USE_FIXED_NAME_DELIVERY') === 'Y'
                && !empty($this->getBusinessValue($payment, 'PAYKEEPER_FIXED_NAME_DELIVERY'))
            ){
                $this->delivery_name_fixed = $this->getBusinessValue($payment, 'PAYKEEPER_FIXED_NAME_DELIVERY');
            }
            if ($this->getBusinessValue($payment, 'PAYKEEPER_TRU_CODE_USE') === 'Y'
                && !empty($this->getBusinessValue($payment, 'PAYKEEPER_TRU_CODE_NAME'))
            ){
                $this->tru_code_name = $this->getBusinessValue($payment, 'PAYKEEPER_TRU_CODE_NAME');
            }
            $this->convert_full_tax_rate = $this->getBusinessValue($payment, 'PAYKEEPER_CONVERT_FULL_RATES') === 'Y';
            $this->discount = $this->getBusinessValue($payment, 'PAYKEEPER_DISCOUNT') === 'Y';
            $this->basket_item_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_BASKET_ITEM_TYPE'), 'item_type');
            $this->basket_payment_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_BASKET_PAYMENT_TYPE'), 'payment_type');
            $this->delivery_item_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_DELIVERY_ITEM_TYPE'), 'item_type');
            $this->delivery_payment_type = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_DELIVERY_PAYMENT_TYPE'), 'payment_type');
            $this->basket_measure = self::_getValueTypeParamCart(
                $this->getBusinessValue($payment, 'PAYKEEPER_BASKET_MEASURE'), 'measure');
            $this->vat = self::_getValueTypeParamCart($this->getBusinessValue($payment, 'PAYKEEPER_VAT'), 'vat');
            $this->vat_priority = $this->getBusinessValue($payment, 'PAYKEEPER_VAT_PRIORITY') === 'Y';
            $this->vat_delivery = self::_getValueTypeParamCart($this->getBusinessValue($payment, 'PAYKEEPER_VAT_DELIVERY'), 'vat');
            $this->vat_delivery_priority = $this->getBusinessValue($payment, 'PAYKEEPER_VAT_DELIVERY_PRIORITY') === 'Y';
            $this->pk_obj->fiscal_cart = $this->_cart($order);
        } else {
            $this->pk_obj->fiscal_cart = [];
        }

        // Get token
        $base64 = base64_encode("$paykeeper_login:$paykeeper_password");
        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded',
            'Authorization' => "Basic $base64"
        ];
        $uri = '/info/settings/token/';
        $sendResult = $this->_Send($paykeeper_url.$uri, [], $headers);
        if ($this->logging) {
            $response_hidden = $sendResult;
            if (isset($response_hidden['token'])) {
                $response_hidden['token'] = '--hidden-for-log--';
            }
            $log_params = [
                'TITLE' => 'REFUND',
                'URL' => $paykeeper_url.$uri,
                'METHOD' => 'POST',
                'RESPONSE' => $response_hidden
            ];
            $this->_paykeeperLogger($log_params);
        }
        $sendResult = isset($sendResult[0]) ? $sendResult[0] : $sendResult;
        $tokenResult = isset($sendResult['token']) ? $sendResult['token'] : '';

        if (isset($sendResult['errorCode']) || !$tokenResult) {
            $error = isset($sendResult['errorMessage']) ? $sendResult['errorMessage'] : 'Ошибка получения токена';
            $result->addError(new Error($error));
            return $result;
        }

        // Send refund
        $uri = '/change/payment/reverse/';
        $fields = [
            'id' => $paykeeper_id,
            'amount' => $refundableSum,
            'partial' => false,
            'token' => $tokenResult,
            'refund_cart' => $this->pk_obj->getFiscalCartEncoded()
        ];
        $sendResult = $this->_Send($paykeeper_url.$uri, $fields, $headers);
        if ($this->logging) {
            $log_params = [
                'TITLE' => 'REFUND',
                'URL' => $paykeeper_url.$uri,
                'METHOD' => 'POST',
                'DATA' => $fields,
                'RESPONSE' => $sendResult
            ];
            $this->_paykeeperLogger($log_params);
        }
        $sendResult = isset($sendResult[0]) ? $sendResult[0] : $sendResult;
        $refundResult = isset($sendResult['msg']) ? $sendResult['msg'] : '';

        if (isset($sendResult['errorCode']) || $refundResult) {
            $error = isset($sendResult['errorMessage']) ? $sendResult['errorMessage'] : $refundResult;
            $result->addError(new Error($error));
            return $result;
        }

        $result->setOperationType(PaySystem\ServiceResult::MONEY_LEAVING);
        return $result;
    }

    /**
     * @param $order
     * @return array
     */
    private function _cart($order)
    {
        /* BASKET */
        $basket = $order->getBasket();
        $last_index = 0;
        foreach ($basket as $item) {
            $name = $item->getField('NAME');
            $quantity = $item->getField('QUANTITY');

            // For correctPrecision()
            if ($quantity == 1 && $this->pk_obj->single_item_index < 0) {
                $this->pk_obj->single_item_index = $last_index;
            }
            if ($quantity > 1 && $this->pk_obj->more_then_one_item_index < 0) {
                $this->pk_obj->more_then_one_item_index = $last_index;
            }

            $price = (float) $item->getField('PRICE');
            $vat_rate = $item->getField('VAT_RATE');
            if ($this->vat_priority && $this->vat) {
                $vat = $this->vat;
            } else if (!is_null($vat_rate)) {
                $vat = $this->_getVat($vat_rate * 100, false, $this->convert_full_tax_rate);
            } else {
                $vat = $this->vat ? $this->vat : null;
            }

            $this->pk_obj->updateFiscalCart(
                $this->pk_obj->getPaymentFormType(),
                $name,
                $price,
                $quantity,
                0,
                $vat
            );
            $this->pk_obj->fiscal_cart[$last_index]['item_type'] = $this->basket_item_type;
            $this->pk_obj->fiscal_cart[$last_index]['payment_type'] = $this->basket_payment_type;
            $this->pk_obj->fiscal_cart[$last_index]['measure'] = $this->basket_measure;

            // Ловим код свойства торгового предложения, если он задан
            if($this->tru_code_name !== ''){
                // Проверяем, есть ли параметр в товаре
                // Если торговое предложение
                $productInfo = \CCatalogSKU::GetProductInfo($item->getField('PRODUCT_ID'));
                if (!$productInfo) {
                    // Если обычный товар
                    $productInfo = \CIBlockElement::GetByID($item->getField('PRODUCT_ID'))->GetNext();
                }
                if (is_array($productInfo)) {
                    $productProperty = \CIBlockElement::GetProperty($productInfo['IBLOCK_ID'], $productInfo['ID'], array(), array('CODE' => $this->tru_code_name));
                    if (($arProperty = $productProperty->GetNext()) && $arProperty['VALUE']) {
                        $this->pk_obj->fiscal_cart[$last_index]['tru_code'] = $arProperty['VALUE'];
                    }
                }

                // Проверяем, есть ли параметр в торговом предложении (приоритет)
                $basketPropertyCollection = $item->getPropertyCollection();
                foreach ($basketPropertyCollection as $propertyItem) {
                    if ($propertyItem->getField('CODE') == $this->tru_code_name && $propertyItem->getField('VALUE')) {
                        $this->pk_obj->fiscal_cart[$last_index]['tru_code'] = $propertyItem->getField('VALUE');
                        break;
                    }
                }
            }
            $last_index++;
        }

        /* DELIVERY */
        if ($order->getDeliveryPrice() > 0) {
            $dbSaleDelivery = Sale\Delivery\Services\Manager::getById($order->getField('DELIVERY_ID'));
            $delivery_name = $this->delivery_name_fixed !== '' ? $this->delivery_name_fixed : $dbSaleDelivery['NAME'];
            $delivery_price = floatval($order->getDeliveryPrice());
            $this->pk_obj->setShippingPrice($delivery_price);

            if (!$this->pk_obj->checkDeliveryIncluded($this->pk_obj->getShippingPrice(), $delivery_name)) {
                $vatDelivery = \CCatalogVat::GetByID($dbSaleDelivery['VAT_ID'])->Fetch();
                if ($vatDelivery) {
                    if ($this->vat_delivery_priority && $this->vat_delivery) {
                        $delivery_vat = $this->vat_delivery;
                    } else if (!is_null($vatDelivery['RATE'])) {
                        $delivery_vat = $this->_getVat($vatDelivery['RATE'], false, $this->convert_full_tax_rate);
                    } else {
                        $delivery_vat = $this->vat_delivery ? $this->vat_delivery : null;
                    }
                } else {
                    $delivery_vat = $this->vat_delivery ? $this->vat_delivery : null;
                }
                $this->pk_obj->setUseDelivery();
                $this->pk_obj->updateFiscalCart(
                    $this->pk_obj->getPaymentFormType(),
                    $delivery_name,
                    $delivery_price,
                    1,
                    0,
                    $delivery_vat
                );
                $this->pk_obj->delivery_index = $last_index;
                $this->pk_obj->fiscal_cart[$last_index]['item_type'] = $this->delivery_item_type;
                $this->pk_obj->fiscal_cart[$last_index]['payment_type'] = $this->delivery_payment_type;
            }
        }

        /* DISCOUNTS */
        $this->pk_obj->setDiscounts($this->discount || (floatval($order->getSumPaid()) > 0));

        // Correct possible difference between order sum and fiscal cart sum
        $this->pk_obj->correctPrecision();

        // Encode fiscal cart to utf-8 for json_encode
        return array_map(function($item) {
            return array_map(function($value) {
                $enc = mb_detect_encoding($value, 'ASCII, UTF-8, windows-1251', true);
                return ($enc == 'UTF-8') ? $value : iconv($enc, 'UTF-8', $value);
            }, $item);
        }, $this->pk_obj->getFiscalCart());
    }

    /**
     * @return array
     */
    public static function getIndicativeFields()
    {
        return array('id', 'sum', 'clientid', 'orderid', 'key');
    }
    /**
     * @param Request $request
     * @param $paySystemId
     * @return bool
     */
    static protected function isMyResponseExtended(Request $request, $paySystemId)
    {
        $order = self::_getOrderFromRequest($request);
        if (!$order) {
            return false;
        }
        if ($request->get('action') == 'paykeeper_cancel') {
            $order->setField('COMMENTS', 'CANCELED');
            $order->save();
            return false;
        }
        return true;
    }
    /**
     * @param Request $request
     * @return mixed
     */
    public function getPaymentIdFromRequest(Request $request)
    {
        $servicename_split = self::_getParseServiceName($request->get('orderid'));
        if (!$servicename_split) {
            $servicename_split = self::_getParseServiceName($request->get('service_name'));
        }
        $payment_id = is_array($servicename_split) && count($servicename_split) > 1
            ? $servicename_split[count($servicename_split) - 2]
            : 0;

        if (!$payment_id) {
            echo 'Payment with ID is empty.';
        } else {
            $order = self::_getOrderFromRequest($request);
            if ($order) {
                $paymentCollection = $order->getPaymentCollection();
                foreach ($paymentCollection as $payment) {
                    if($payment_id == $payment->getField('ID')) {
                        return $payment->getId();
                    }
                }
                echo 'Payment with ID not found in order.';
            } else {
                echo "Could not load order object by given orderid: {$request->get('orderid')}";
            }
        }
        return null;
    }

    /**
     * @param Payment $payment
     * @param Request $request
     * @return PaySystem\ServiceResult
     */
    public function processRequest(Payment $payment, Request $request)
    {
        if ($this->_getBusinessValue('PAYKEEPER_LOGGING', $payment) === 'Y') {
            $response_hidden = $request->getPostList()->toArray();
            // $request->getPostList()
            if (isset($response_hidden['key'])) {
                $response_hidden['key'] = '--hidden-for-log--';
            }
            $log_params = [
                'TITLE' => 'PAYMENT_NOTIFICATION',
                'URL' => '/bitrix/tools/sale_ps_result.php',
                'METHOD' => 'NOTIFICATION',
                'RESPONSE' => $response_hidden
            ];
            $this->_paykeeperLogger($log_params);
        }
        $result = new PaySystem\ServiceResult();

        $payment_id = (int) $request->get('id');
        $clientid = $request->get('clientid');
        $sum = (float) $request->get('sum');
        $ordernum = $request->get('orderid');
        $sign = $request->get('key');

        if ($payment_id == 0) {
            echo 'No payment specified!';
            return $result;
        }
        $totalsum = $payment->getField('SUM');
        if ($sum != $totalsum) {
            echo 'The sums are not equal!';
            return $result;
        }

        $service_name = '';
        $servicename_split = self::_getParseServiceName($ordernum);
        if (!$servicename_split) {
            $service_name = $request->get('service_name');
            $servicename_split = self::_getParseServiceName($service_name);
        }
        $service_name = is_array($servicename_split) ? end($servicename_split) : $service_name;

        if ($service_name != self::$service_name) {
            echo 'The service_name is incorrect!';
            return $result;
        }

        $secret = $this->_getBusinessValue('PAYKEEPER_SECRET', $payment);
        if ($this->_getBusinessValue('PAYKEEPER_HOLD_FUNDS_ENABLE', $payment) === 'Y') {
            $status_id_after_payment = $this->_getBusinessValue('PAYKEEPER_HOLD_FUNDS_AFTER_STATUS', $payment);
        } else {
            $status_id_after_payment = $this->_getBusinessValue('PAYKEEPER_STATUS_AFTER_PAYMENT', $payment);
        }

        $sum_format = number_format($sum, 2, '.', '');
        $hash = md5($payment_id . $sum_format . $clientid . $ordernum . $secret);
        if (!hash_equals($hash, $sign)) {
            echo 'Hash mismatch';
            return $result;
        }

        $fields = array(
            'PS_INVOICE_ID' => $payment_id,
            'PS_STATUS' => 'Y',
            'PS_STATUS_CODE' => 'Success',
            'PS_STATUS_DESCRIPTION' => 'Payment accepted',
            'PS_STATUS_MESSAGE' => "Payment id: $payment_id",
            'PS_SUM' => $sum,
            'PS_CURRENCY' => ''
        );
        $result->setOperationType(PaySystem\ServiceResult::MONEY_COMING);
        $result->setPsData($fields);

        // Change order status according setting
        // TODO протестировать проверку смены статуса
        if (!$result->isSuccess()) {
            echo 'Error set paysystem data';
            return $result;
        }

        $order = Sale\Order::load($payment->getOrderId());

        if ($status_id_after_payment){
            $arr_status = array();
            $dbStatusList = \CSaleStatus::GetList(Array('SORT' => 'ASC'), Array('LID' => LANGUAGE_ID), false, false, Array('ID', 'NAME', 'SORT'));
            while ($itemStatus = $dbStatusList->GetNext()) {
                $arr_status[$itemStatus['ID']] = '[' . $itemStatus['ID'] . '] ' . $itemStatus['NAME'];
            }
            if (array_key_exists($status_id_after_payment, $arr_status)) {
                $order->setField('STATUS_ID', $status_id_after_payment);
            } else {
                echo 'Error change order status';
            }
        }

        // Разрешаем несистемную отгрузку, если опция отмечена
        if($this->_getBusinessValue('PAYKEEPER_SHIPMENT', $payment) === 'Y') {
            $shipmentCollection = $order->getShipmentCollection();
            foreach ($shipmentCollection as $shipment){
                if (!$shipment->isSystem()) {
                    $shipment->allowDelivery();
                }
            }
        }

        $result_s = $order->save();

        if (!$result_s->isSuccess()) {
            // Если операция сохранения заказа не удалась
            $errors = $result_s->getErrors(); // Получаем массив ошибок
            $text_error = 'Error save order';
            foreach ($errors as $error) {
                $text_error .= PHP_EOL . $error->getMessage();
            }
            echo $text_error;
            if ($this->_getBusinessValue('PAYKEEPER_LOGGING', $payment) === 'Y') {
                $log_params = [
                    'TITLE' => 'PAYMENT_NOTIFICATION',
                    'URL' => '/bitrix/tools/sale_ps_result.php',
                    'METHOD' => 'SAVE_ORDER',
                    'RESPONSE' => $text_error
                ];
                $this->_paykeeperLogger($log_params);
            }
        } else {
            echo 'OK ' . md5($payment_id . $secret);
        }

        return $result;
    }

    /**
     * @return array
     */
    public function getCurrencyList()
    {
        return array('RUB');
    }

    /**
     * @param Request $request
     * @return Sale\Order
     */
    private static function _getOrderFromRequest(Request $request)
    {
        $ordernum = $request->get('orderid');
        $ordernum_split = self::_getParseServiceName($ordernum);
        if (is_array($ordernum_split)) {
            $ordernum = $ordernum_split[0];
        }
        $order = is_numeric($ordernum) ? Sale\Order::load($ordernum) : false;
        if (!$order) {
            $order = Sale\Order::loadByAccountNumber($ordernum);
        }
        return $order;
    }

    /**
     * @param $tax_rate
     * @param $zero_value_as_none - if variable is set, then when tax_rate is zero, tax is equal to none
     * @param $convert_tax_rate - converts tax rate
     * @return string
     */
    private function _getVat($tax_rate, $zero_value_as_none = true, $convert_tax_rate = false)
    {
        $vat = 'none';
        switch(number_format(floatval($tax_rate), 0, '.', '')) {
            case 0:
                $vat = $zero_value_as_none ? 'none' : 'vat0';
                break;
            case 5:
                $vat = $convert_tax_rate ? 'vat105' : 'vat5';
                break;
            case 7:
                $vat = $convert_tax_rate ? 'vat107' : 'vat7';
                break;
            case 10:
                $vat = $convert_tax_rate ? 'vat110' : 'vat10';
                break;
            case 18:
                $vat = $convert_tax_rate ? 'vat118' : 'vat18';
                break;
            case 20:
                $vat = $convert_tax_rate ? 'vat120' : 'vat20';
                break;
        }
        return $vat;
    }

    /**
     * Sends a request to the specified URL using cURL or HttpClient depending on availability.
     *
     * @param string $url The URL to send the request to.
     * @param array $data The data to send with the request.
     * @param array $headers Optional. Additional headers to include in the request. Default is an empty array.
     * @param string $datatype Optional. The format of the data, such as 'json'. Default is 'json'.
     * @return array|mixed
     */
    private function _Send($url, $data, $headers = [], $datatype = 'json')
    {

        global $APPLICATION;

        if (mb_strtoupper(SITE_CHARSET) != 'UTF-8') {
            $data = $APPLICATION->ConvertCharsetArray($data, 'windows-1251', 'UTF-8');
        }

        if(function_exists('curl_init')) {
            $response = $this->_SendCurl($url, $data, $headers, $datatype);
        } else {
            $response = $this->_SendHttpClient($url, $data, $headers, $datatype);
        }

        return $response;
    }

    /**
     * Sends an HTTP request using the HttpClient class.
     *
     * @param string $url The URL to send the request to.
     * @param array $data The data to send with the request. Can be null for GET requests.
     * @param array $headers Additional headers to include in the request.
     * @param string $datatype The format of the response data, e.g., 'json'. Default is 'json'.
     * @return array
     */
    private function _SendHttpClient($url, $data, $headers, $datatype)
    {

        global $APPLICATION;

        $httpClient = new Web\HttpClient();
        $httpClient->setCharset('utf-8');
        $httpClient->disableSslVerification();
        foreach ($headers as $param => $value) {
            $httpClient->setHeader($param, $value);
        }
        if ($data) {
            $httpClient->post($url, $data);
        } else {
            $httpClient->get($url);
        }

        $response =  $httpClient->getResult();
        if ($datatype == 'json' && $this->_isJson($response)) {
            $response =  Web\Json::decode($response);
        } else if (empty($httpClient->getError())) {
            $response = array(
                'status' => 'success',
                'msg' => $response
            );
        } else {
            $response = array(
                'errorCode' => 999,
                'errorMessage' => 'Server not available',
            );
        }

        if (mb_strtoupper(SITE_CHARSET) != 'UTF-8') {
            $APPLICATION->ConvertCharsetArray($response, 'UTF-8', 'windows-1251');
        }

        return $response;
    }

    /**
     * Sends an HTTP request using cURL.
     *
     * @param string $url The URL to send the request to.
     * @param array $data The data to send with the request. Can be null for GET requests.
     * @param array $headers Additional headers to include in the request.
     * @param string $datatype The format of the response data, such as 'json'. Default is 'json'.
     * @return array|mixed
     */
    private function _SendCurl($url, $data, $headers, $datatype)
    {

        $curl_opt = array(
            CURLOPT_VERBOSE => true,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSL_VERIFYPEER =>false,
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => false
        );
        $set_headers = [];
        foreach ($headers as $param => $value) {
            $set_headers[] = "$param: $value";
        }
        if ($set_headers) {
            $curl_opt[CURLOPT_HTTPHEADER] = $set_headers;
        }
        if ($data) {
            $curl_opt[CURLOPT_POST] = true;
            $curl_opt[CURLOPT_POSTFIELDS] = http_build_query($data);
        }
        $ch = curl_init();
        curl_setopt_array($ch, $curl_opt);
        $response = curl_exec($ch);
        $error = curl_error($ch);

        if ($datatype == 'json' && $this->_isJson($response)) {
            $response = json_decode($response, true);
        } else if (empty($error)) {
            $response = array(
                'result' => 'success',
                'msg' => $response
            );
        } else {
            $response = array(
                'errorCode' => 999,
                'errorMessage' => curl_error($ch),
            );
        }
        curl_close($ch);

        return $response;
    }

    /**
     * Checks if the given data is valid JSON.
     *
     * @param string $json_data The JSON data to validate.
     * @param bool $return_data Optional. If true, returns the decoded JSON data. Default is false.
     * @return bool|mixed
     */
    private function _isJson($json_data, $return_data = false)
    {
        $data = json_decode($json_data);
        return (json_last_error() == JSON_ERROR_NONE) ? ($return_data ? $data : true) : false;
    }

    /**
     * Parses the service name from the given text.
     *
     * This method checks if the specified service name exists within the text.
     * If found, it splits the text by the '|' character and returns an array of parts.
     *
     * @param string $text The text to be parsed for the service name.
     *
     * @return array|false Returns an array of parsed text parts if the service name is found,
     *                     otherwise returns false.
     */
    private static function _getParseServiceName($text)
    {
        if (strpos($text, self::$service_name) !== false) {
            return explode('|', $text);
        }
        return false;
    }

    /**
     * Logs specified parameters to a log file with a timestamp.
     *
     * This method creates a log entry containing the provided parameters with a timestamp.
     * If the log file exists and is smaller than 7 MB, the new log entry is prepended to the existing content.
     *
     * @param array $log_params An associative array of parameters to log, where keys are parameter names and values are their corresponding values.
     *
     * @return void
     */
    private function _paykeeperLogger($log_params)
    {
        $logText = '--------------START_' . date("Y-m-d_H:i:s") . '--------------' . "\n";
        foreach ($log_params as $key => $value) {
            $logText .= "$key: " . print_r($value,true) . "\n";
        }
        $logText .= "\n\n\n";
        $file = self::log_file;
        if (file_exists($file)) {
            $logSize = filesize($file);
            if ($logSize < (7 * 1024 * 1024)) {
                $logText .= file_get_contents($file);
            }
        }
        file_put_contents($file, $logText);
    }

    /**
     * Types of calculation
     * @param $value
     * @param $type
     * @return string
     */
    private static function _getValueTypeParamCart($value, $type)
    {
        return [
            'item_type' => [
                1 => 'goods',
                2 => 'service',
                3 => 'work',
                4 => 'excise',
                5 => 'ip',
                6 => 'payment',
                7 => 'agent'
            ],
            'payment_type' => [
                1 => 'prepay',
                2 => 'part_prepay',
                3 => 'advance',
                4 => 'full'
            ],
            'measure' => [
                1 => 'pcs',
                2 => 'g',
                3 => 'kg',
                7 => 'm',
                12 => 'l'
            ],
            'vat' => [
                1 => 'none',
                2 => 'vat0',
                7 => 'vat5',
                8 => 'vat7',
                3 => 'vat10',
                4 => 'vat20',
                9 => 'vat105',
                10 => 'vat107',
                5 => 'vat110',
                6 => 'vat120'
            ]
        ][$type][$value];
    }

    /**
     * Retrieves the business parameter value for the payment system.
     *
     * The method attempts to obtain the parameter value using `Sale\BusinessValue::get()`.
     * If the value is not found, it retrieves it using the `getBusinessValue()` method.
     *
     * @param string $param The name of the parameter whose value is being retrieved.
     * @param \Bitrix\Sale\Payment $payment The payment object for which the value is being retrieved.
     *
     * @return mixed Returns the business parameter value if found; otherwise, the default value
     *               obtained via the `getBusinessValue()` method.
     */
    private function _getBusinessValue($param, $payment)
    {
        $value = Sale\BusinessValue::get(
            $param,
            PaySystem\Service::PAY_SYSTEM_PREFIX . $payment->getField('PAY_SYSTEM_ID'),
            $payment->getCollection()->getOrder()->getField('PERSON_TYPE_ID')
        );
        if (!$value) {
            $value = $this->getBusinessValue($payment, $param);
        }
        return $value;
    }
}
