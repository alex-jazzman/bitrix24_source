<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings;

use Bitrix\Main\EventManager;
use Bitrix\Main\Localization\Loc;
use CSite;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;
use Rarus\Sms4b\Sendings\Messages\Message;
use Rarus\Sms4b\Sendings\SendingInQueue;
use Rarus\Sms4b\Sendings\Source;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Encoding;
use Rarus\Sms4b\Address;
use \Rarus\Sms4b\Exceptions\Sms4bException;


class Sender
{
    private const PHONE_PATTERN = "/^[+]?[78]?[(]?([93]{1}\d{2})[)]?(\d{7})$/";
    /**
     * @var Validator
     */
    private $validator;
    /**
     * @var Repository
     */
    private $repository;
    /**
     * @var SendingInQueue\Repository
     */
    private $queueRepository;
    /**
     * @var Config\Service
     */
    private $config;
    /**
     * @var Encoding\Service
     */
    private $encoding;
    /**
     * @var Address\Service
     */
    private $addressService;

    public function __construct()
    {
        $this->validator = new Validator();
        $this->repository = new Repository();
        $this->queueRepository = new SendingInQueue\Repository();
        $this->config = new Config\Service();
        $this->encoding = new Encoding\Service();
        $this->addressService = new Address\Service();
    }

    /**
     * @param array       $arPhonesMessages
     * @param array       $orderId
     * @param string|null $mailEvent
     *
     * @param string      $siteId
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function saleSendSms(
        array $arPhonesMessages,
        array $orderId,
        string $mailEvent,
        string $siteId
    ): void {
        $source = new Source\Sale(Source\Sale::SALE);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, $siteId, $source, $mailEvent, $orderId);
    }

    /**
     * @param array  $arPhonesMessages
     * @param int    $ticketId
     * @param string $mailEvent
     * @param string $siteId
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function supportSendSms(
        array $arPhonesMessages,
        int $ticketId,
        string $mailEvent,
        string $siteId
    ): void {
        $source = new Source\Support(Source\Support::SUPPORT);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, $siteId, $source, $mailEvent, [$ticketId]);
    }

    /**
     * @param array  $arPhonesMessages
     * @param array  $userId
     * @param string $sender
     * @param string $mailEvent
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function userSendSms(
        array $arPhonesMessages,
        array $userId,
        string $sender,
        string $mailEvent
    ): void {
        $source = new Source\User(Source\User::USER);
        $this->sendSms($arPhonesMessages, '', $source, $mailEvent, $userId, $sender);
    }

    /**
     * @param array          $arPhonesMessages
     * @param string         $siteId
     * @param \DateTime|null $dateStart
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function crmSendSms(
        array $arPhonesMessages,
        string $siteId,
        ?\DateTime $dateStart = null
    ): void {
        $source = new Source\Crm(Source\Crm::CRM);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, $siteId, $source, null, [], null, $dateStart);
    }

    /**
     * @param array  $arPhonesMessages
     * @param int    $taskId
     * @param string $siteId
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function taskSendSms(
        array $arPhonesMessages,
        int $taskId,
        string $siteId
    ): void {
        $source = new Source\Task(Source\Task::TASK);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, '', $source, null, [$taskId]);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $mailEvent
     * @param string $siteId
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function mailEventSendSms(
        array $arPhonesMessages,
        string $mailEvent,
        string $siteId
    ): void {
        $source = new Source\MailEvent(Source\MailEvent::MAIL_EVENT);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, $siteId, $source, $mailEvent);
    }

    /**
     * @param array $arPhonesMessages
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function telephonySendSms(array $arPhonesMessages): void
    {
        $source = new Source\Telephony(Source\Telephony::MODULE_VOXIMPLANT);
        $this->sendSms($arPhonesMessages, '', $source);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $siteId
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function componentContactSendSms(array $arPhonesMessages, string $siteId): void
    {

        $source = new Source\ContactBySms(Source\ContactBySms::CONTACT_BY_SMS);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, '', $source);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $siteId
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function calendarSendSms(array $arPhonesMessages, string $siteId): void
    {
        $source = new Source\Calendar(Source\Calendar::CALENDAR);
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages,
            $this->config->getTranslitSetting($siteId) === 'Y');
        $this->sendSms($arPhonesMessages, '', $source);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $sender
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function subscriptionsSendSms(array $arPhonesMessages, string $sender): void
    {
        $source = new Source\Subscribe(Source\Subscribe::SUBSCRIBE);
        $this->sendSms($arPhonesMessages, '', $source, '', [], $sender);
    }

    /**
     * @param array          $arPhonesMessages
     * @param string         $sender
     * @param bool           $translitNeeded
     * @param Source\Source  $source
     * @param \DateTime|null $dateStart
     * @param \DateTime|null $dateActual
     * @param string|null    $allowedDeliveryInterval
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function formSendSms(
        array $arPhonesMessages,
        string $sender,
        bool $translitNeeded,
        Source\Source $source,
        ?\DateTime $dateStart,
        ?\DateTime $dateActual = null,
        ?string $allowedDeliveryInterval = null
    ): void {
        $arPhonesMessages = $this->translitIsNeeded($arPhonesMessages, $translitNeeded);
        $this->sendSms($arPhonesMessages, '', $source, null, [], $sender, $dateStart, $dateActual,
            $allowedDeliveryInterval);
    }

    /**
     * @param array          $arPhonesMessages
     * @param string         $sender
     * @param \DateTime      $dateStart
     * @param \DateTime|null $dateActual
     * @param string|null    $allowedDeliveryInterval
     *
     * @return SendingInQueue\SendingInQueue
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function delaySendSms(
        array $arPhonesMessages,
        string $sender,
        \DateTime $dateStart,
        ?\DateTime $dateActual = null,
        ?string $allowedDeliveryInterval = null
    ): SendingInQueue\SendingInQueue {
        return $this->sendSms($arPhonesMessages, '', null, null, [], $sender, $dateStart, $dateActual,
            $allowedDeliveryInterval);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $sender
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     * @throws \Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError
     */
    public function bxMessageServicesSendSms(
        array $arPhonesMessages,
        string $sender
    ): void {
        $source = new Source\BxMessageServices(Source\BxMessageServices::BX_MESSAGE_SERVICES);
        $this->sendSms($arPhonesMessages, '', $source, null, [], $sender);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $sender
     *
     * @throws Exceptions\Sms4bValidationError
     * @throws Sms4bException
     */
    public function customSendSms(
        array $arPhonesMessages,
        string $sender
    ): void {
        $this->sendSms($arPhonesMessages, '', null, null, [], $sender);
    }

    /**
     * @param array  $arPhonesMessages
     * @param string $sender
     * @param string $forgottenBasketEvent
     * @param int    $orderId
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     * @throws \Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError
     */
    public function forgottenBasketsSendSms(
        array $arPhonesMessages,
        string $sender,
        string $forgottenBasketEvent,
        int $orderId
    ): void {
        $source = new Source\ForgottenBasket(Source\ForgottenBasket::FORGOTTEN_BASKET);
        $this->sendSms($arPhonesMessages, '', $source, $forgottenBasketEvent, [$orderId], $sender);
    }

    /**
     * @param array              $arPhonesMessages
     * @param string             $siteId
     * @param Source\Source|null $source
     * @param string|null        $mailEvent
     * @param array              $entitiesId
     * @param string|null        $sender
     * @param \DateTime|null     $dateStart
     * @param \DateTime|null     $dateActual
     * @param string|null        $allowedDeliveryInterval
     *
     * @return \Rarus\Sms4b\Sendings\SendingInQueue\SendingInQueue|null
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     * @throws \Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError
     */
    private function sendSms(
        array $arPhonesMessages,
        string $siteId,
        ?Source\Source $source = null,
        ?string $mailEvent = null,
        array $entitiesId = [],
        ?string $sender = null,
        ?\DateTime $dateStart = null,
        ?\DateTime $dateActual = null,
        ?string $allowedDeliveryInterval = null
    ): ?SendingInQueue\SendingInQueue {
        $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'BeforeSmsSend');
        foreach ($arEvents as $arEvent) {
            $arPhonesMessages = ExecuteModuleEventEx($arEvent,
                [$arPhonesMessages, &$sender, $mailEvent, $source, $entitiesId]);
            if (empty($arPhonesMessages)) {
                return null;
            }
        }
        $source = $source ?? Source\Source::createSourceInstance(Source\Custom::CUSTOM);
        if(empty($sender)) {
            $this->checkDefaultSender();
            $sender = $this->config->getDefaultSender($siteId);
        }
        $dateStartForUser = $dateStart ?? new \DateTime('now');
        $allowedDeliveryInterval = $allowedDeliveryInterval ?? $this->config->getAllowedDeliveryInterval($siteId);

        $message = $this->createMessageFromData($arPhonesMessages, $entitiesId);

        $sending = new Sending(
            $sender,
            $message,
            $dateStartForUser,
            $source,
            $dateStart,
            $dateActual,
            $allowedDeliveryInterval,
            $mailEvent
        );

        $this->validator->validate($sending);
        try {
            $sending = $this->repository->save($sending);

            $sendingInQueue = $this->createSendingForQueue($sending);
            $this->queueRepository->save($sendingInQueue);
        } catch (Sms4bRepositoryException $e) {
            throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
        }

        $sendingForEvent = clone $sending;

        $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'AfterSmsSend');
        foreach ($arEvents as $arEvent) {
            ExecuteModuleEventEx($arEvent, [$sendingForEvent]);
        }

        if ($this->config->getProcessingOldEvent() === 'Y') {
            $arParam = [];
            foreach ($sending->getMessages() as $message) {
                $arParam[] = [
                    'GUID'        => $message->getGuid(),
                    'SenderName'  => $sending->getSender(),
                    'Destination' => $message->getDestination(),
                    'StartSend'   => \Rarus\Sms4b\DateTimeConverter::phpDateTimeToBitrixDateTime($sending->getDateStartForUser()),
                    'CodeType'    => $message->getEncoding(),
                    'TextMessage' => $this->encoding->decodeMessage($message->getText(),
                        Encoding\Encoding::createInstanceByEncodingCode($message->getEncoding())),
                ];
            }

            $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'OnAfterSmsSend');
            foreach ($arEvents as $arEvent) {
                ExecuteModuleEventEx($arEvent, [$arParam]);
            }
        }

        $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'NewSending');
        foreach ($arEvents as $arEvent) {
            ExecuteModuleEventEx($arEvent, [$sendingInQueue->getSendingId()]);
        }
        return $sendingInQueue;

    }

    /**
     * @param array $arPhonesMessages
     *
     * @param array $entitiesId
     *
     * @return Messages\Collection
     */
    private function createMessageFromData(array $arPhonesMessages, array $entitiesId): Messages\Collection
    {
        $messages = new Messages\Collection();
        $status = new Messages\Status(Messages\Status::CREATE);

        $countEntitiesId = \count($entitiesId);

        foreach ($arPhonesMessages as $phone => $text) {
            $number = $this->normalizeNumberString($phone);
            if ($number === null) {
                continue;
            }
            $guid = $this->createGuid();
            $text = \trim($text);

            if ($countEntitiesId === 0) {
                $entityId = null;
            } elseif ($countEntitiesId === 1) {
                $entityId = $entitiesId[0];
            } else {
                $entityId = $entitiesId[array_search($phone, array_keys($arPhonesMessages))];
            }

            list($encodeMessage, $encoding) = $this->encoding->encodeMessage($text);

            $messages->attach(new Messages\Message(
                $number,
                $guid,
                $encodeMessage,
                $status,
                $encoding,
                (int)$entityId,
                new \DateTime('now')
            ));
        }

        return $messages;
    }

    /**
     * @return mixed|string
     */
    private function createGuid()
    {
        if (function_exists('com_create_guid')) {
            return str_replace(['{', '}'], '', com_create_guid());
        } else {
            mt_srand((int)microtime() * 10000);
            $charid = strtoupper(md5(uniqid((string)mt_rand(), true)));
            $hyphen = chr(45);// "-"
            $uuid = substr($charid, 0, 8) . $hyphen
                . substr($charid, 8, 4) . $hyphen
                . substr($charid, 12, 4) . $hyphen
                . substr($charid, 16, 4) . $hyphen
                . substr($charid, 20, 12);
            return $uuid;
        }
    }

    /**
     * @param $phone
     *
     * @return string|null
     */
    private function normalizeNumberString($phone): ?string
    {
        $number = preg_replace('/[\D]/', '', (string)$phone);

        if (preg_match(self::PHONE_PATTERN, $number)) {
            if (strlen($number) == 10) {
                $number = '7' . $number;
            } else {
                $number[0] = '7';
            }
            return $number;
        } else {
            return null;
        }
    }

    /**
     * @param Sending $sending
     *
     * @return SendingInQueue\SendingInQueue
     */
    private function createSendingForQueue(Sending $sending): SendingInQueue\SendingInQueue
    {
        $status = new SendingInQueue\Message\Status(SendingInQueue\Message\Status::NOT_PROCESSED);
        $collection = new SendingInQueue\Message\Collection();
        foreach ($sending->getMessages() as $item) {
            /**
             * @var Messages\Message $item
             */
            $messageInQueue = new SendingInQueue\Message\Message(
                $item->getGuid(),
                $item->getDestination(),
                $item->getText(),
                $item->getEncoding(),
                $status
            );
            $collection->attach(
                $messageInQueue
            );
        }

        return new SendingInQueue\SendingInQueue(
            $sending->getId(),
            $sending->getSender(),
            $sending->getDateStart(),
            $sending->getDateActual(),
            $sending->getAllowedDeliveryInterval(),
            $sending->getSource()->getDescriptionForService(),
            $collection
        );

    }

    /**
     * @param array $arPhoneMessage
     * @param bool  $translitSetting
     *
     * @return array
     */
    private function translitIsNeeded(array $arPhoneMessage, bool $translitSetting): array
    {
        if ($translitSetting) {
            foreach ($arPhoneMessage as $phone => $text) {
                $arPhoneMessage[$phone] = $this->translit($text);
            }
        }

        return $arPhoneMessage;
    }

    /**
     * @param $cyr_str
     *
     * @return mixed|string
     */
    private function translit($cyr_str)
    {
        $tr = [
            Loc::getMessage('SMS4B_MAIN_a')   => 'a',
            Loc::getMessage('SMS4B_MAIN_b')   => 'b',
            Loc::getMessage('SMS4B_MAIN_v')   => 'v',
            Loc::getMessage('SMS4B_MAIN_g')   => 'g',
            Loc::getMessage('SMS4B_MAIN_d')   => 'd',
            Loc::getMessage('SMS4B_MAIN_e')   => 'e',
            Loc::getMessage('SMS4B_MAIN_yo')  => 'yo',
            Loc::getMessage('SMS4B_MAIN_zh')  => 'zh',
            Loc::getMessage('SMS4B_MAIN_z')   => 'z',
            Loc::getMessage('SMS4B_MAIN_i')   => 'i',
            Loc::getMessage('SMS4B_MAIN_j')   => 'j',
            Loc::getMessage('SMS4B_MAIN_k')   => 'k',
            Loc::getMessage('SMS4B_MAIN_l')   => 'l',
            Loc::getMessage('SMS4B_MAIN_m')   => 'm',
            Loc::getMessage('SMS4B_MAIN_n')   => 'n',
            Loc::getMessage('SMS4B_MAIN_o')   => 'o',
            Loc::getMessage('SMS4B_MAIN_p')   => 'p',
            Loc::getMessage('SMS4B_MAIN_r')   => 'r',
            Loc::getMessage('SMS4B_MAIN_s')   => 's',
            Loc::getMessage('SMS4B_MAIN_t')   => 't',
            Loc::getMessage('SMS4B_MAIN_u')   => 'u',
            Loc::getMessage('SMS4B_MAIN_f')   => 'f',
            Loc::getMessage('SMS4B_MAIN_h')   => 'h',
            Loc::getMessage('SMS4B_MAIN_c')   => 'c',
            Loc::getMessage('SMS4B_MAIN_ch')  => 'ch',
            Loc::getMessage('SMS4B_MAIN_sh')  => 'sh',
            Loc::getMessage('SMS4B_MAIN_shh') => 'shh',
            Loc::getMessage("\"")             => "\"",
            Loc::getMessage('SMS4B_MAIN_y')   => 'y',
            Loc::getMessage("'")              => "'",
            Loc::getMessage('SMS4B_MAIN_ye')  => 'ye',
            Loc::getMessage('SMS4B_MAIN_yu')  => 'yu',
            Loc::getMessage('SMS4B_MAIN_ya')  => 'ya',

            Loc::getMessage('SMS4B_MAIN_A')   => 'A',
            Loc::getMessage('SMS4B_MAIN_B')   => 'B',
            Loc::getMessage('SMS4B_MAIN_V')   => 'V',
            Loc::getMessage('SMS4B_MAIN_G')   => 'G',
            Loc::getMessage('SMS4B_MAIN_D')   => 'D',
            Loc::getMessage('SMS4B_MAIN_E')   => 'E',
            Loc::getMessage('SMS4B_MAIN_YO')  => 'YO',
            Loc::getMessage('SMS4B_MAIN_ZH')  => 'ZH',
            Loc::getMessage('SMS4B_MAIN_Z')   => 'Z',
            Loc::getMessage('SMS4B_MAIN_I')   => 'I',
            Loc::getMessage('SMS4B_MAIN_J')   => 'J',
            Loc::getMessage('SMS4B_MAIN_K')   => 'K',
            Loc::getMessage('SMS4B_MAIN_L')   => 'L',
            Loc::getMessage('SMS4B_MAIN_M')   => 'M',
            Loc::getMessage('SMS4B_MAIN_N')   => 'N',
            Loc::getMessage('SMS4B_MAIN_O')   => 'O',
            Loc::getMessage('SMS4B_MAIN_P')   => 'P',
            Loc::getMessage('SMS4B_MAIN_R')   => 'R',
            Loc::getMessage('SMS4B_MAIN_S')   => 'S',
            Loc::getMessage('SMS4B_MAIN_T')   => 'T',
            Loc::getMessage('SMS4B_MAIN_U')   => 'U',
            Loc::getMessage('SMS4B_MAIN_F')   => 'F',
            Loc::getMessage('SMS4B_MAIN_H')   => 'H',
            Loc::getMessage('SMS4B_MAIN_C')   => 'C',
            Loc::getMessage('SMS4B_MAIN_CH')  => 'CH',
            Loc::getMessage('SMS4B_MAIN_SH')  => 'SH',
            Loc::getMessage('SMS4B_MAIN_SHH') => 'SHH',
            Loc::getMessage("\"\"")           => "\"",
            Loc::getMessage('SMS4B_MAIN_Y')   => 'Y',
            Loc::getMessage("''")             => "'",
            Loc::getMessage('SMS4B_MAIN_YE')  => 'YE',
            Loc::getMessage('SMS4B_MAIN_YU')  => 'YU',
            Loc::getMessage('SMS4B_MAIN_YA')  => 'YA',

            Loc::getMessage('SMS4B_MAIN_<') => '<',
            Loc::getMessage('SMS4B_MAIN_>') => '>',
            Loc::getMessage('SMS4B_MAIN_-') => '-'
        ];

        $str = strtr($cyr_str, $tr);

        $str = str_replace(['^', '`'], "'", $str);
        $str = str_replace(['?'], "\"", $str);
        $str = str_replace(['{', '['], '(', $str);
        $str = str_replace(['}', ']'], ')', $str);
        $str = str_replace(['\\'], '/', $str);
        $str = str_replace(['_', '~'], '-', $str);
        $str = str_replace(['|'], 'i', $str);
        $str = str_replace(['?'], 'N', $str);

        return $str;
    }

    /**
     * Функция проверяет актуальность имени по умолчанию для каждого сайта и в случае необходимости обновляет его.
     *
     * @throws Sms4bException
     */
    private function checkDefaultSender(): void
    {
        $arSenders = $this->addressService->getAllAddresses();
        $arSites = CSite::GetList($by = '', $order = '', []);
        while ($arSite = $arSites->Fetch()) {
            $defSender = $this->config->getDefaultSender($arSite['ID']);
            if (!in_array($defSender, $arSenders, true)) {
                $this->config->setDefaultSender($arSenders[0], $arSite['ID']);
            }
        }

    }
}