<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Order;

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Sale\Internals\StatusLangTable;
use Bitrix\Sale\Internals\StatusTable;
use CSaleOrder;
use CSaleOrderProps;
use CSaleOrderPropsValue;
use \Rarus\Sms4b\Config;
use Rarus\Sms4b\DateTimeConverter;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Service
{
    use DateTimeConverter;
    /**
     * @var Config\Service
     */
    private $config;

    public function __construct()
    {
        $this->config = new Config\Service();
    }

    /**
     * ¬озвращает номер телефона заказа
     *
     * @param int    $id_order - id заказа
     * @param string $site     - идентификатор сайта
     *
     * @return string|bool - номер телефона из заказа или false если заказ не найден
     * @throws Sms4bException
     */
    public function getPhoneOrder($id_order, $site)
    {
        $code = $option = $this->config->getSettingByName('phone_number_code', $site);

        try {
            $dbOrderList = CSaleOrder::GetList(
                ['ID' => 'DESC'],
                ['ACCOUNT_NUMBER' => $id_order],
                false,
                false,
                ['ID', 'CANCELED', 'ACCOUNT_NUMBER']
            );
            while ($arSaleProp = $dbOrderList->GetNext()) {
                $id_order = $arSaleProp['ID'];
            }

            if (empty($option)) {
                $code = 'sms_events';
            }

            $db_vals = CSaleOrderPropsValue::GetList(
                ['SORT' => 'ASC'],
                [
                    'ORDER_ID' => $id_order,
                    'CODE'     => $code
                ]
            );
            if ($arrOrder = $db_vals->Fetch()) {
                return $arrOrder['VALUE'];
            } else {
                return false;
            }
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_ORDER_GET_DATA_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param $arIds
     *
     * @return array
     * @throws Sms4bException
     */
    public function getOrderData($arIds): array
    {
        try {
            $arResult = [];
            if (Loader::includeModule('sale')) {
                if (!is_array($arIds)) {
                    return $arResult;
                }

                //ќсновные свойства заказа
                // GetByID - это необходимость, т.к. он вернет все цены с учетом настроек (27,50). (getList возвращал 27,5000)
                foreach($arIds as $id) {
                    $arResult[$id] = \CSaleOrder::GetByID($id);
                    $arResult[$id]['ORDER_DATE'] = $arResult[$id]['DATE_INSERT'];
                    $arResult[$id]['ORDER_ID'] = $arResult[$id]['ACCOUNT_NUMBER'];
                }

                //ƒополнительные свойства заказа (по типам плательщика)
                $obRes = CSaleOrderPropsValue::GetList(['ID' => 'ASC'], ['ORDER_ID' => $arIds]);
                while ($arOrder = $obRes->Fetch()) {
                    $phoneCode = $this->config->getSettingByName('phone_number_code', $arResult[$arOrder['ID']]['LID']);
                    if ($phoneCode === $arOrder['CODE']) {
                        $arResult[$arOrder['ORDER_ID']]['PHONE_TO'] = $arOrder['VALUE'];
                    } elseif($arOrder['CODE'] === 'FIO') {
                        //в пользовательских шаблонах есть макрос #ORDER_USER#
                        $arResult[$arOrder['ORDER_ID']]['ORDER_USER'] = $arOrder['VALUE'];
                        $arResult[$arOrder['ORDER_ID']][$arOrder['CODE']] = $arOrder['VALUE'];
                    } else {
                        $arResult[$arOrder['ORDER_ID']][$arOrder['CODE']] = $arOrder['VALUE'];
                    }
                }

                //—остав корзины
                $obRes = \Bitrix\Sale\Basket::getList([
                    'select' => ['ORDER_ID', 'DATE_INSERT', 'NAME'],
                    'filter' => ['ORDER_ID' => $arIds]
                ]);

                while ($arOrder = $obRes->Fetch()) {
                    if (array_key_exists($arOrder['ORDER_ID'], $arResult)) {
                        $arResult[$arOrder['ORDER_ID']]['ORDER_LIST'] .= !empty($arResult[$arOrder['ORDER_ID']]['ORDER_LIST']) ? ', ' . $arOrder['NAME'] : $arOrder['NAME'];
                    }
                }
            }

        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_ORDER_GET_DATA_ERROR'), $e->getCode(), $e);
        }
        return $arResult;
    }

    /**
     * ¬озвращает массив статусов магазина определенного типа
     *
     * @param string $type - тип статуса ('O' - заказ, 'D' - отгрузка)
     * @param string $lid  - лид
     *
     * @return array - массив статусов
     * @throws Sms4bException
     */
    public function getSaleStatus($type = '', $lid = 'ru')
    {
        try {
            $arSt = $arFilter = [];
            if (!Loader::includeModule('sale')) {
                return $arSt;
            }

            if (!empty($type)) {
                $arFilter = ['TYPE' => $type];
            }

            $result = StatusTable::getList([
                'select' => ['ID', 'TYPE'],
                'filter' => $arFilter
            ]);
            while ($row = $result->fetch()) {
                $tmpSt[] = $row['ID'];
                $arSt[$row['ID']] = $row;
            }

            $result = StatusLangTable::getList([
                'select' => ['*'],
                'filter' => ['LID' => $lid, 'STATUS_ID' => $tmpSt]
            ]);

            while ($row = $result->fetch()) {
                $arSt[$row['STATUS_ID']]['NAME'] = $row['NAME'];
            }
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_ORDER_STATUS_ERROR'), $e->getCode(), $e);
        }
        return $arSt;
    }

    /**
     * ¬озвращает ID сайта, на котором был сделан заказ
     *
     * @param int $id - id заказа
     *
     * @return string - ID сайта
     * @throws Sms4bException
     */
    public function getOrderLid($id)
    {
        try {
            if (!Loader::includeModule('sale')) {
                return false;
            }
            $obRes = \Bitrix\Sale\Internals\OrderTable::getList([
                'select' => ['LID'],
                'filter' => ['ID' => $id]
            ]);
            $arResult = $obRes->fetch();

        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_ORDER_GET_DATA_ERROR'), $e->getCode(), $e);
        }
        return $arResult['LID'];
    }

    /**
     * ¬озвращает свойства заказа
     *
     * @return array - свойства заказа
     * @throws Sms4bException
     */
    public function getSaleOrderProps()
    {
        try {
            $orderProps = [];
            if (Loader::includeModule('sale')) {
                $obRes = CSaleOrderProps::GetList(
                    ['SORT' => 'ASC'],
                    [],
                    false,
                    false,
                    ['NAME', 'CODE', 'PERSON_TYPE_ID']
                );
                $orderProps = [];
                while ($props = $obRes->Fetch()) {
                    $orderProps[$props['CODE']][] = $props;
                }
            }
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_ORDER_GET_DATA_ERROR'), $e->getCode(), $e);
        }
        return $orderProps;
    }

    /**
     * ¬озвращает все типы плательщиков
     *
     * @return array - типы плательщиков
     * @throws Sms4bException
     */
    public function getPersonTypes(): array
    {
        try {
            $person = [];
            if (Loader::includeModule('sale')) {
                $person = [];
                $pType = \Bitrix\Sale\Internals\PersonTypeTable::getList([
                    'select' => ['ID', 'NAME']
                ]);
                while ($type = $pType->Fetch()) {
                    $person[$type['ID']] = $type['NAME'];
                }
            }
        }  catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage("SMS4B_ORDER_TYPE_PERSON_ERROR") .
                '', $e->getCode(), $e);
        }
        return $person;
    }
}