<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Forgottenbaskets;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use CSaleOrderProps;
use Rarus\Sms4b\DateTimeConverter;
use Rarus\Sms4b\Exceptions\Sms4bException;
use Csms4b;
use Rarus\Sms4b\Tables\SendingsTable;

class
Service
{
    const MODULE_NAME = 'rarus.sms4b';

    use DateTimeConverter;

    /**
     * @var \Csms4b
     */
    private Csms4b $sms4b;

    /**
     * @var \Rarus\Sms4b\Sendings\Service
     */
    private \Rarus\Sms4b\Sendings\Service $sendingService;

    public function __construct()
    {
        $this->sms4b = new Csms4b();
        $this->sendingService = new \Rarus\Sms4b\Sendings\Service();
    }

    /**
     * @param string $interval
     * @param string $siteId
     *
     * @return array
     */
    public function getOrderData(string $interval, string $siteId): array
    {
        $result = [];
        try {
            if (\CModule::IncludeModule('sale')) {
                $dateNow = new \DateTime('now');

                $dateForgotten = ConvertTimeStamp($dateNow->modify('-' . $interval . ' minute')->getTimestamp(),
                    'FULL');

                $dateNow = new \DateTime('now');
                $intervalEnd = $interval * 10; //  Чтоб не отправлять тем кто не оплатил давно, например год назад
                $dateIntervalEnd = ConvertTimeStamp($dateNow->modify('-' . $intervalEnd . ' minute')->getTimestamp(),
                    'FULL');

                $parameters = [
                    'filter' => [
                        'PAYED'         => 'N',
                        '><DATE_INSERT' => [$dateIntervalEnd, $dateForgotten],
                        'LID' => $siteId
                    ]
                ];

                $ordersf = \Bitrix\Sale\Order::loadByFilter($parameters);

                $result = [];
                foreach ($ordersf as $order) {
                    $arOrder = $order->toArray();
                    $arOrderParams = [];
                    foreach($arOrder as $propertyCode => $value) {
                        if(is_string($value) || is_null($value) || is_float($value) || is_integer($value)){
                            $arOrderParams[$propertyCode] = $value;
                        }
                    }

                    foreach($arOrder['PROPERTIES'] as $arProp) {
                        $arOrderParams[$arProp['CODE']] = $arProp['VALUE'];
                    }
                    $result[(int)$order->getId()] = $arOrderParams;
                }
            }

        } catch (Sms4bException $e) {
            $debug = new \Debug\Service();
            $debug->writeToLogFile(Loc::getMessage('SMS4B_ORDER_GET_DATA_ERROR'));
            $debug->writeToLogFile($e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine() . PHP_EOL);
        }

        return $result;

    }

    /**
     * @param array  $ordersData
     * @param string $event
     * @param string $siteId
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    //Обходим коллекцию, формируем arParams, Запускаем отправку по шаблону
    public function sendOrderData(array $ordersData, string $event, string $siteId ): void
    {

        if (count($ordersData) > 0) {

            foreach ($ordersData as $orderId => $order) {

                if ($this->isSmsForgottenBasketNotSentYet($orderId, $event)) {

                    $sender = \COption::GetOptionString('rarus.sms4b', 'defsender', '', $order['LID']);
                    $this->sms4b->sendSmsForgottenBasketByTemplate(
                        $sender,
                        $order['PHONE'],
                        $event,
                        $order,
                        $event,
                        (int)$order['ID'],
                        $siteId
                    );
                }

            }

        }

    }

    /**
     * Возвращает ID сайта, на котором был сделан заказ
     *
     * @param int $id - id заказа
     *
     * @return bool|string - ID сайта
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function getOrderLid(int $id): bool|string
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
     * Возвращает свойства заказа
     *
     * @return array - свойства заказа
     * @throws Sms4bException
     */
    public function getSaleOrderProps(): array
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
     * Если отправок по фильтру не было - возвращаем true
     * Если были - false
     *
     * @param int    $orderId
     * @param string $event
     *
     * @return bool
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function isSmsForgottenBasketNotSentYet(int $orderId, string $event): bool
    {
        $arFiltr = [
            SendingsTable::ENTITY_ID  => $orderId,
            SendingsTable::MAIL_EVENT => $event
        ];
        $res = $this->sendingService->getSendingsByFilter($arFiltr);

        if ($res->count() > 0) {
            return false;
        } else {
            return true;
        }

    }

    /**
     * Возвращает массив SiteId
     * @return array
     */
    public function getArSiteId(): array
    {
        $arSite = [];
        $rsSites = \CSite::GetList($by = 'sort', $order = 'asc', []);
        while ($arRes = $rsSites->GetNext()) {
            $arSite[] = $arRes['ID'];
        }

        return $arSite;
    }

    /**
     * Выбираем символьные коды полей заказа и пользовательских свойств заказа
     *
     * @return array
     */
    public function getArOrderProps(): array
    {
        $arRes = [];
        if (\CModule::IncludeModule('sale')) {
            $arRes = \Bitrix\Sale\OrderBase::getAvailableFields();

            $dbRes = \Bitrix\Sale\Property::getList();
            while ($property = $dbRes->fetch()) {
                $arRes[] = $property['CODE'];
            }
            $arRes[] = 'PAY_SYSTEM_ID';
        }

        return $arRes;
    }

    /**
     * @return string
     */
    public function getMacros(): string
    {
        $arProps = $this->getArOrderProps();
        $result = '';
        foreach ($arProps as $items) {
            $result .= '#' . $items . '#' . PHP_EOL;
        }
        return $result;
    }

    /**
     * Функция выбирает настройки активных отправок о забытых заказах.
     * Используется в агенте
     *
     * @param string $siteId
     *
     * @return array
     */
    public function getArForgottenBaskets(string $siteId): array
    {
        $arForgottenBaskets = [];
        if (\CModule::IncludeModule('main')){
            $arOptions = Option::getForModule(
                self::MODULE_NAME,
                $siteId
            );
            foreach ($arOptions as $optionKey => $optionValue) {
                if(str_contains($optionKey, 'send_forgotten_baskets_active_') && $optionValue === 'Y') {
                    $ForgottenBasketsIndex = str_replace('send_forgotten_baskets_active_', '', $optionKey);
                    $arForgottenBaskets[$ForgottenBasketsIndex] = [
                        'active' =>  $optionValue,
                        'minutes' =>  $arOptions['send_forgotten_baskets_minutes_'.$ForgottenBasketsIndex],
                        'event_type' =>  'SMS4B_SEND_FORGOTTEN_BASKETS_'.$ForgottenBasketsIndex
                    ];
                }
            }

        }

        return $arForgottenBaskets;

    }

    /**
     * Функция позволяет добавить больше 2х стандартных напоминаний о забытой корзине.
     * Выполнить можно например в консоле (в примере ниже 47 - минуты)
     * \Bitrix\Main\Loader::includeModule('rarus.sms4b');
     * $forgottenbaskets = new Rarus\Sms4b\Forgottenbaskets\Service();
     * $forgottenbaskets->addForgottenBasket(47, 's1');
     *
     * @param int $minutes - через сколько минут после не оплыты заказа отправлять СМС
     * @param string $siteId
     *
     * @return array
     */
    public function addForgottenBasket (int $minutes, string $siteId): array
    {
        $number = $this->getNewForgottenBasketNumber();
        if (\CModule::IncludeModule('main')){
            Option::set(self::MODULE_NAME, 'send_forgotten_baskets_active_'.$number, 'Y', $siteId);
            Option::set(self::MODULE_NAME, 'send_forgotten_baskets_minutes_'.$number, $minutes, $siteId);
        }

        // Добавить тип почтового события и почтовые шаблоны
        $templateId = $this->addEventTypeForgottenBasket($number, $siteId);

        return [
            'send_forgotten_baskets_active_'.$number => 'Y',
            'send_forgotten_baskets_minutes_'.$number => $minutes,
            'EventType' => 'SMS4B_SEND_FORGOTTEN_BASKETS_'.$number,
            'templateId' => $templateId
        ];
    }

    /**
     * Возвращает номер следующего напоминания
     *
     * @return int
     */
    public function getNewForgottenBasketNumber(): int
    {
        $arSites = [];
        $arForgottenBasketsActive = [];
        $sites = \CSite::GetList(($b = ''), ($o = ''), ['LANGUAGE_ID' => $lid]);
        while ($site = $sites->Fetch()) {
            $arSites[] = $site['LID'];
            $arOptions = Option::getForModule(
                self::MODULE_NAME,
                $site['LID']
            );
            foreach ($arOptions as $optionKey => $optionValue) {
                if(str_contains($optionKey, 'send_forgotten_baskets_active_')) {
                    $arForgottenBasketsActive[] = $optionKey;
                }
            }
        }

        rsort($arForgottenBasketsActive, SORT_NATURAL);
        $number = str_replace('send_forgotten_baskets_active_', '', $arForgottenBasketsActive[0]);

        return (int)$number + 1;
    }

    /**
     * Добавляет почтовое событие и почтовый шаблон
     *
     * @param int    $number
     * @param string $siteId
     *
     * @return int
     */
    public function addEventTypeForgottenBasket(int $number, string $siteId): int
    {
        $type = 'SMS4B_SEND_FORGOTTEN_BASKETS_'.$number;
        $templateId = 0;
        $rsET = \CEventType::GetList(['TYPE_ID' => $type]);
        if (!$rsET->Fetch())
        {
            $langs = \CLanguage::GetList(($b = ''), ($o = ''));
            while ($lang = $langs->Fetch()) {
                $lid = $lang['LID'];
                IncludeModuleLangFile(__FILE__, $lid);

                \CEventType::Add([
                    'LID'         => $lid,
                    'EVENT_NAME'  => $type,
                    'NAME'        => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE'),
                    'DESCRIPTION' => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC') . $this->getMacros()
                ]);

            }

            $em = new \CEventMessage;
            $templateId = $em->Add([
                'ACTIVE'     => 'Y',
                'EVENT_NAME' => $type,
                'LID'        => [$siteId],
                'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                'EMAIL_TO'   => '#PHONE_TO#',
                'BCC'        => '',
                'SUBJECT'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_SUBJECT'),
                'MESSAGE'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_MESSAGE'),
                'BODY_TYPE'  => 'text'
            ]);
        }

        return $templateId;
    }

    /**
     * Функция выбирает настройки всех отправок о забытых заказах.
     * В случае, если нет первых 2 отправок - добавляет в массив значения по умолчанию
     *
     * @param string $siteId
     *
     * @return array
     */
    public function getArForgottenBasketsAll(string $siteId): array
    {
        $arForgottenBaskets = [];
        if (\CModule::IncludeModule('main')){
            $arOptions = Option::getForModule(
                self::MODULE_NAME,
                $siteId
            );
            foreach ($arOptions as $optionKey => $optionValue) {
                if(str_contains($optionKey, 'send_forgotten_baskets_active_')) {
                    $ForgottenBasketsIndex = str_replace('send_forgotten_baskets_active_', '', $optionKey);
                    $arForgottenBaskets[$ForgottenBasketsIndex] = [
                        'active' =>  $optionValue,
                        'minutes' =>  $arOptions['send_forgotten_baskets_minutes_'.$ForgottenBasketsIndex],
                        'event_type' =>  'SMS4B_SEND_FORGOTTEN_BASKETS_'.$ForgottenBasketsIndex
                    ];
                }
            }

        }

        if(!isset($arForgottenBaskets[1])){
            $arForgottenBaskets[1] = [
                'active' =>  '',
                'minutes' => '30',
                'event_type' => 'SMS4B_SEND_FORGOTTEN_BASKETS_1'
                ];
        }

        if(!isset($arForgottenBaskets[2])){
            $arForgottenBaskets[2] = [
                'active' =>  '',
                'minutes' => '1440',
                'event_type' => 'SMS4B_SEND_FORGOTTEN_BASKETS_2'
            ];
        }

        ksort($arForgottenBaskets, SORT_NATURAL);

        return $arForgottenBaskets;

    }

}
