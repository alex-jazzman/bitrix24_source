<?php

namespace Bitrix\Modules\Sale\Handler\Paysystem\Paykeeper;

use Bitrix\Sale\BusinessValue;
use Bitrix\Sale\Order;
use Bitrix\Sale\PaySystem\Service;
use Bitrix\Main\Web\HttpClient;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;
use Bitrix\Main\EventManager;
use Bitrix\Main\Loader;
use Bitrix\Main\Context;

use Bitrix\Sale\Internals\PaymentTable;
use Bitrix\Sale\Internals\PayableItemTable;

// Registering the event handler for the 'OnSaleStatusOrder' event in the 'sale' module.
EventManager::getInstance()->addEventHandler(
    'sale',
    'OnSaleStatusOrder',
    [__NAMESPACE__ . '\PaykeeperEventHandler','OnSaleStatusOrderChange']
);

define('LOG_FILE', realpath(dirname(__FILE__)) . "/logs/paykeeper.log");

/**
 * Class PaykeeperEventHandler
 * Handles events and actions related to Paykeeper integration.
 */
class PaykeeperEventHandler {

    const log_file = LOG_FILE;
    private static $logging = false;

    /**
     * Event handler for the OnSaleStatusOrderChange event.
     *
     * This method is triggered when the order status changes. It handles the final receipt generation
     * and interaction with the Paykeeper API if certain conditions are met.
     *
     * @param int $orderId The ID of the order whose status has changed.
     * @return EventResult Returns an EventResult object, indicating the success of the operation.
     */
    static function OnSaleStatusOrderChange($orderId)
    {
        $order = Order::load($orderId);
        if (!$order->isPaid()) {
            return self::getSuccessEventResult();
        }

        $paySystemId = $order->getField('PAY_SYSTEM_ID');
        $personTypeId = $order->getField('PERSON_TYPE_ID');

        $paykeeper_hold_funds_enable = self::getBusVal('PAYKEEPER_HOLD_FUNDS_ENABLE', $order);
        $paykeeper_print_final_receipt = self::getBusVal('PAYKEEPER_PRINT_FINAL_RECEIPT', $order);
        $paykeeper_login = self::getBusVal('PAYKEEPER_LK_LOGIN', $order);
        $paykeeper_password = self::getBusVal('PAYKEEPER_LK_PASSWORD', $order);
        self::$logging = (self::getBusVal('PAYKEEPER_LOGGING', $order) === 'Y');

        if (!$paykeeper_login
            || !$paykeeper_password
            || ($paykeeper_print_final_receipt !== 'Y' && $paykeeper_hold_funds_enable !== 'Y'))
        {
            return self::getSuccessEventResult();
        }

        $paykeeper_url = self::getBusVal('PAYKEEPER_FORM_URL', $order);
        if (!$paykeeper_url) {
            return self::getSuccessEventResult();
        }
        if ($pos = strrpos($paykeeper_url, '/create') ?: strrpos($paykeeper_url, '/order')) {
            $paykeeper_url = substr($paykeeper_url, 0, $pos);
        }

        $paykeeper_hold_debit_after_status = self::getBusVal('PAYKEEPER_HOLD_DEBIT_AFTER_STATUS', $order);
        $paykeeper_hold_cancel_after_status = self::getBusVal('PAYKEEPER_HOLD_CANCEL_AFTER_STATUS', $order);
        $paykeeper_print_after_status = self::getBusVal('PAYKEEPER_PRINT_AFTER_STATUS', $order);

        $order_status_id = $order->getField('STATUS_ID');

        $paykeeper_is_receipt = $paykeeper_print_final_receipt === 'Y'
            && $paykeeper_print_after_status == $order_status_id;
        $paykeeper_is_hold_debit = $paykeeper_hold_funds_enable === 'Y'
            && $paykeeper_hold_debit_after_status == $order_status_id;
        $paykeeper_is_hold_cancel = $paykeeper_hold_funds_enable === 'Y'
            && $paykeeper_hold_cancel_after_status == $order_status_id;

        if (!$paykeeper_is_receipt && !$paykeeper_is_hold_debit && !$paykeeper_is_hold_cancel) {
            return self::getSuccessEventResult();
        }

        // Получаем ID платежа РК
        $paymentCollection = $order->getPaymentCollection();
        $paymentId = 0;
        foreach ($paymentCollection as $payment) {
            if ($payment->getField('PAY_SYSTEM_ID') != $paySystemId) {
                continue;
            }
            $paymentId = preg_replace('/\D/', '', $payment->getField('PS_STATUS_MESSAGE'));
        }

        if (!$paymentId) {
            return self::getSuccessEventResult();
        }

        $params_log = [];
        $error_data = [];

        // Get token

        $base64 = base64_encode("$paykeeper_login:$paykeeper_password");
        $headers = [
            'Content-Type' => 'application/x-www-form-urlencoded',
            'Authorization' => "Basic $base64"
        ];
        $sendResult = self::Send("$paykeeper_url/info/settings/token/", [], $headers);
        $sendResult = isset($sendResult[0]) ? $sendResult[0] : $sendResult;
        if (self::$logging) {
            $response_hidden = $sendResult;
            if (isset($response_hidden['token'])) {
                $response_hidden['token'] = '--hidden-for-log--';
            }
            self::paykeeperLogger([
                'TITLE' => 'PAYMENT_TOKEN',
                'URL' => "$paykeeper_url/info/settings/token/",
                'METHOD' => 'GET',
                'RESPONSE' => $response_hidden
            ]);
        }
        $tokenResult = isset($sendResult['token']) ? $sendResult['token'] : '';

        if (isset($sendResult['errorCode']) || !$tokenResult) {
            $error_data[] = [
                'event_code' => 'TOKEN',
                'event_name' => 'getToken',
                'log_name' => 'ПОЛУЧЕНИЕ ТОКЕНА',
                'log_info' => "Заказ $orderId. Ошибка получения токена!"
            ];
        } else {

            // Event Hold Debit
            if ($paykeeper_is_hold_debit) {
                $paykeeper_uri = '/change/payment/capture/';
                $sendResult = self::Send("$paykeeper_url$paykeeper_uri",
                    ['id' => $paymentId, 'token' => $tokenResult], $headers);
                $sendResult = isset($sendResult[0]) ? $sendResult[0] : $sendResult;
                if (self::$logging) {
                    self::paykeeperLogger([
                        'TITLE' => 'PAYMENT_CAPTURE',
                        'URL' => "$paykeeper_url$paykeeper_uri",
                        'METHOD' => 'POST',
                        'DATA' => ['id' => $paymentId, 'token' => '--hidden-for-log--'],
                        'RESPONSE' => $sendResult
                    ]);
                }
                $error_flag = false;
                if (isset($sendResult['msg'])) {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Ошибка: {$sendResult['msg']}";
                } else if (isset($sendResult['errorCode'])) {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Ошибка: {$sendResult['errorMessage']}";
                } else if (isset($sendResult['result']) && $sendResult['result'] == 'success') {
                    $infoLog = "Заказ $orderId. Списание средств!";
                } else {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Неизвестная ошибка!";
                }

                if ($error_flag) {
                    $error_data[] = [
                        'event_code' => 'CAPTURE',
                        'event_name' => 'onHoldDebitPaykeeper',
                        'log_name' => 'СПИСАНИЕ СРЕДСТВ',
                        'log_info' => $infoLog
                    ];
                }

                $params_log[] = [
                    'SEVERITY' => 'INFO',
                    'AUDIT_TYPE_ID' => 'Списание средств по ранее проведённой авторизации PayKeeper',
                    'MODULE_ID' => 'sale',
                    'ITEM_ID' => "API запрос $paykeeper_uri",
                    'DESCRIPTION' => $infoLog,
                ];
            }

            // Event Print Receipt
            if ($paykeeper_is_receipt) {
                // Создаем новую группу свойств и свойство для чека окончательного расчета, если их нет
                $propertyCode = 'PAYKEEPER_RECEIPT_ID';
                $propertyName = 'Номер запроса на генерацию чека в PK';
                self::createOrderPropertyForAllPersonTypes($propertyName, $propertyCode);

                $paykeeper_uri = '/change/payment/post-sale-receipt/';
                $sendResult = self::Send("$paykeeper_url$paykeeper_uri",
                    ['id' => $paymentId, 'token' => $tokenResult], $headers);
                $sendResult = isset($sendResult[0]) ? $sendResult[0] : $sendResult;
                if (self::$logging) {
                    self::paykeeperLogger([
                        'TITLE' => 'PAYMENT_RECEIPT',
                        'URL' => "$paykeeper_url$paykeeper_uri",
                        'METHOD' => 'POST',
                        'DATA' => ['id' => $paymentId, 'token' => '--hidden-for-log--'],
                        'RESPONSE' => $sendResult
                    ]);
                }
                $error_flag = false;
                if (isset($sendResult['receipt_id'])) {
                    $receipt_id = $sendResult['receipt_id'];
                    $infoLog = "Заказ $orderId. ID чека $receipt_id";

                    // Записываем значение номера запроса печати чека
                    /** @var \Bitrix\Sale\PropertyValueCollection $propertyCollection */
                    $propertyCollection = $order->getPropertyCollection();
                    $property = $propertyCollection->getItemByOrderPropertyCode($propertyCode);

                    if($property && $property->getValue() != $receipt_id) {
                        $property->setField('VALUE', $receipt_id);
                        $order->save();
                    }
                } else if (isset($sendResult['msg'])) {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Ошибка: {$sendResult['msg']}";
                } else if (isset($sendResult['errorCode'])) {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Ошибка: {$sendResult['errorMessage']}";
                } else {
                    $error_flag = true;
                    $infoLog = 'Заказ ' . $orderId . '. Неизвестная ошибка!';
                }

                if ($error_flag) {
                    $error_data[] = [
                        'event_code' => 'RECEIPT',
                        'event_name' => 'onPrintCheckPaykeeper',
                        'log_name' => 'ГЕНЕРАЦИЯ ЧЕКА',
                        'log_info' => $infoLog
                    ];
                }

                $params_log[] = [
                    'SEVERITY' => 'INFO',
                    'AUDIT_TYPE_ID' => 'Печать чека окончательного расчёта PayKeeper',
                    'MODULE_ID' => 'sale',
                    'ITEM_ID' => "API запрос $paykeeper_uri",
                    'DESCRIPTION' => $infoLog,
                ];
            }

            // Event Hold Cancel
            if ($paykeeper_is_hold_cancel) {
                $paykeeper_uri = '/change/payment/reverse/';
                $sendResult = self::Send("$paykeeper_url$paykeeper_uri",
                    [
                        'id' => $paymentId,
                        'amount' => self::getBusVal('PAYKEEPER_FORM_URL', $order),
                        'partial' => false,
                        'token' => $tokenResult
                    ], $headers);
                $sendResult = isset($sendResult[0]) ? $sendResult[0] : $sendResult;
                if (self::$logging) {
                    self::paykeeperLogger([
                        'TITLE' => 'PAYMENT_REVERSE',
                        'URL' => "$paykeeper_url$paykeeper_uri",
                        'METHOD' => 'POST',
                        'DATA' => [
                            'id' => $paymentId,
                            'amount' => self::getBusVal('PAYKEEPER_FORM_URL', $order),
                            'partial' => false,
                            'token' => '--hidden-for-log--'
                        ],
                        'RESPONSE' => $sendResult
                    ]);
                }
                $error_flag = false;
                if (isset($sendResult['msg'])) {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Ошибка: {$sendResult['msg']}";
                } else if (isset($sendResult['errorCode'])) {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Ошибка: {$sendResult['errorMessage']}";
                } else if (isset($sendResult['result']) && $sendResult['result'] == 'success') {
                    $infoLog = "Заказ $orderId. Отмена авторизации!";
                } else {
                    $error_flag = true;
                    $infoLog = "Заказ $orderId. Неизвестная ошибка!";
                }

                if ($error_flag) {
                    $error_data[] = [
                        'event_code' => 'REVERSE',
                        'event_name' => 'onHoldCancelPaykeeper',
                        'log_name' => 'ОТМЕНА АВТОРИЗАЦИИ',
                        'log_info' => $infoLog
                    ];
                }

                $params_log[] = [
                    'SEVERITY' => 'INFO',
                    'AUDIT_TYPE_ID' => 'Отмена авторизации средств PayKeeper',
                    'MODULE_ID' => 'sale',
                    'ITEM_ID' => "API запрос $paykeeper_uri",
                    'DESCRIPTION' => $infoLog,
                ];
            }
        }

        // Добавляем запись в журнал событий об API-запросе
        if (!empty($params_log)) {
            foreach ($params_log as $log) {
                \CEventLog::Add($log);
            }
        }

        // Добавляем всплывающее уведомление в административной панели
        if (!empty($error_data)) {
            foreach ($error_data as $error) {
                self::triggerPaykeeperEventError($error['log_info'], $orderId, $error['event_name']);

                \CAdminNotify::Add([
                    'TAG' => "PAYKEEPER_{$orderId}_{$error['event_code']}",
                    'MESSAGE' => "{$error['log_name']} PAYKEEPER. {$error['log_info']}",
                    'NOTIFY_TYPE' => 'E'
                ]);
            }
        }

        return self::getSuccessEventResult();
    }

    /**
     * Creates an order property for all person types.
     *
     * This method checks if a property with a specific code exists for each person type in the system.
     * If not, it creates the property and assigns it to a property group.
     *
     * @param string $propertyName The name of the property to be created.
     * @param string $propertyCode The unique code of the property.
     * @return void
     */
    private static function createOrderPropertyForAllPersonTypes($propertyName, $propertyCode)
    {
        // Получаем все типы плательщиков
        $personTypes = [];
        $dbPersonTypes = \CSalePersonType::GetList( ['SORT' => 'ASC'], [] );
        while ($personType = $dbPersonTypes->Fetch()) {
            $personTypes[] = $personType['ID'];
        }

        foreach ($personTypes as $personTypeId) {
            // Проверяем, существует ли уже свойство с таким кодом для данного типа плательщика
            $dbProps = \CSaleOrderProps::GetList(
                [],
                [ 'CODE' => $propertyCode, 'PERSON_TYPE_ID' => $personTypeId ]
            );

            if ($dbProps->Fetch())
                continue;

            // Создаем новую группу свойства
            $groupExists = false;
            $propsGroupId = null;
            $nameGroup = 'Генерация чека окончательного расчета';
            $groupCheck = \CSaleOrderPropsGroup::GetList( [],
                [ 'NAME' => $nameGroup, 'PERSON_TYPE_ID' => $personTypeId ]
            );

            if ($group = $groupCheck->Fetch()) {
                $groupExists = true;
                $propsGroupId = $group['ID'];
            }

            if (!$groupExists) {
                $groupFields = [
                    'NAME' => $nameGroup,
                    'PERSON_TYPE_ID' => $personTypeId,
                    'SORT' => 500
                ];
                $propsGroupId = \CSaleOrderPropsGroup::Add($groupFields);
            }

            // Создаем новое свойство
            $propertyFields = [
                'NAME' => $propertyName,
                'TYPE' => 'STRING', // Тип свойства: STRING, NUMBER, FILE, etc.
                'REQUIRED' => 'N', // Обязательное: Y или N
                'DEFAULT_VALUE' => '',
                'SORT' => 500,
                'USER_PROPS' => 'Y', // Включить в свойства пользователя: Y или N
                'IS_LOCATION' => 'N',
                'IS_LOCATION4TAX' => 'N',
                'IS_EMAIL' => 'N',
                'IS_PROFILE_NAME' => 'N',
                'IS_PAYER' => 'N',
                'IS_FILTERED' => 'N',
                'CODE' => $propertyCode,
                'ACTIVE' => 'Y',
                'UTIL' => 'Y',
                'INPUT_FIELD_LOCATION' => '',
                'PROPS_GROUP_ID' => $propsGroupId, // ID группы свойств
                'SIZE1' => 0,
                'SIZE2' => 0,
                'DESCRIPTION' => '',
                'PERSON_TYPE_ID' => $personTypeId // Тип плательщика
            ];
            \CSaleOrderProps::Add($propertyFields);
        }
    }

    /**
     * Triggers an event in case of an error in the Paykeeper API request.
     *
     * This method logs the error message and triggers the custom event 'onPrintCheckPaykeeper'.
     * Additional error handling can be performed in the event handler.
     *
     * @param string $errMessage The error message received from the Paykeeper API.
     * @param string $orderId The ID of the order that encountered the error.
     * @param string $nameEvent
     * @return void
     */
    private static function triggerPaykeeperEventError($errMessage, $orderId, $nameEvent) {
        $event = new Event('paykeeper', $nameEvent, [ $errMessage, $orderId ]);
        $event->send();

        foreach ($event->getResults() as $eventResult) {
            if ($eventResult->getType() == EventResult::ERROR && self::$logging) {
                $errorParams = $eventResult->getParameters();
                $log_params = [
                    'TITLE' => 'EVENT_ERROR',
                    'EVENT NAME' => $nameEvent,
                    'METHOD' => 'EVENT',
                    'DATA' => "ORDER ID $orderId MESSAGE $errMessage"
                ];
                if (!empty($errorParams['ERROR_MESSAGE'])) {
                    $log_params['TEXT ERROR'] = $errorParams['ERROR_MESSAGE'];
                }
                self::paykeeperLogger($log_params);
            }
        }
    }

    /**
     * Returns a successful event result.
     *
     * This method creates and returns an instance of `EventResult` with a success status.
     *
     * @return \Bitrix\Main\EventResult An event result object with a status of success.
     */
    private static function getSuccessEventResult() {
        return new EventResult(EventResult::SUCCESS);
    }

    /**
     * Retrieves the business value associated with a specified parameter for a given order.
     *
     * This method uses `BusinessValue::get()` to fetch the value of the provided parameter
     * based on the payment system ID and person type ID within the order.
     *
     * @param string $param The name of the business parameter to retrieve.
     * @param \Bitrix\Sale\Order $order The order object containing relevant payment system and person type IDs.
     *
     * @return mixed Returns the business value associated with the specified parameter for the payment system
     *               and person type in the order.
     */
    private static function getBusVal($param, $order)
    {
        return BusinessValue::get(
            $param,
            Service::PAY_SYSTEM_PREFIX . $order->getField('PAY_SYSTEM_ID'),
            $order->getField('PERSON_TYPE_ID')
        );
    }

    /**
     * Logs specified parameters to a log file with a timestamp.
     *
     * This method creates a log entry with the provided parameters and includes a timestamp.
     * If the log file exists and is less than 7 MB in size, the new log entry is prepended to the existing content.
     *
     * @param array $log_params An associative array of parameters to log, where each key is a parameter name and the value is its corresponding data.
     *
     * @return void
     */
    private static function paykeeperLogger($log_params)
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
     * Sends a request to the specified URL using cURL or HttpClient depending on availability.
     *
     * @param string $url The URL to send the request to.
     * @param array $data The data to send with the request.
     * @param array $headers Optional. Additional headers to include in the request. Default is an empty array.
     * @param string $datatype Optional. The format of the data, such as 'json'. Default is 'json'.
     * @return array|mixed
     */
    private static function Send($url, $data, $headers = [], $datatype = 'json')
    {

        global $APPLICATION;

        if (mb_strtoupper(SITE_CHARSET) != 'UTF-8') {
            $data = $APPLICATION->ConvertCharsetArray($data, 'windows-1251', 'UTF-8');
        }

        if(function_exists('curl_init')) {
            $response = self::SendCurl($url, $data, $headers, $datatype);
        } else {
            $response = self::SendHttpClient($url, $data, $headers, $datatype);
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
    private static function SendHttpClient($url, $data, $headers, $datatype)
    {

        global $APPLICATION;

        $httpClient = new HttpClient();
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
        if ($datatype == 'json' && self::isJson($response)) {
            $response =  Json::decode($response);
        } else if (empty($httpClient->getError())) {
            $response = [
                'status' => 'success',
                'msg' => $response
            ];
        } else {
            $response = [
                'errorCode' => 999,
                'errorMessage' => 'Server not available',
            ];
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
    private static function SendCurl($url, $data, $headers, $datatype)
    {

        $curl_opt = [
            CURLOPT_VERBOSE => true,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSL_VERIFYPEER =>false,
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => false
        ];
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

        if ($datatype == 'json' && self::isJson($response)) {
            $response = json_decode($response, true);
        } else if (empty($error)) {
            $response = [
                'result' => 'success',
                'msg' => $response
            ];
        } else {
            $response = [
                'errorCode' => 999,
                'errorMessage' => curl_error($ch),
            ];
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
    private static function isJson($json_data, $return_data = false)
    {
        $data = json_decode($json_data);
        return (json_last_error() == JSON_ERROR_NONE) ? ($return_data ? $data : true) : false;
    }
}
