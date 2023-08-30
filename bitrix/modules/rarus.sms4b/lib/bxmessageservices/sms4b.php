<?php

namespace Rarus\Sms4b\bxMessageServices;

use Bitrix\Main\Error;
use Bitrix\MessageService\Sender\Base;
use Bitrix\MessageService\Sender\Result\SendMessage;
use Rarus\Sms4b\Sendings\Sender;
use Rarus\Sms4b\Debug;
use Rarus\Sms4b\Exceptions\Sms4bException;
use \Bitrix\Main\Config\Option;
use \Bitrix\Main\Localization\Loc;


/**
 * Class Sms4b - Отправка сообщений через службу сообщений Битрикса
 *
 * @package Rarus\Sms4b\bxMessageServices
 */
class Sms4b extends Base
{

    private $sms4b;

    /**
     * sms4b constructor.
     */
    public function __construct()
    {
        $this->sms4b = new \Csms4b();
    }

    /**
     * @return string
     */
    public function getShortName()
    {
        return 'sms4b.ru';
    }

    /**
     * @return string
     */
    public function getId()
    {
        return 'sms4bru';
    }

    /**
     * @return mixed
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function getName()
    {
        return Loc::getMessage('SMS4B_TMS_CONTENT');
    }

    /**
     * @param array $messageFields
     *
     * @return \Bitrix\MessageService\Sender\Result\SendMessage
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     * @throws \Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError
     */
    public function sendMessage(array $messageFields)
    {

        $addresses = Option::get('main', 'sms_default_sender');
        $sender = new Sender();
        $result = new SendMessage();
        try {
            $sender->bxMessageServicesSendSms([$messageFields['MESSAGE_TO'] => $messageFields['MESSAGE_BODY']], $addresses);
        } catch (Sms4bValidationError $e) {
            $result->addErrors($e->getMessage());
            throw new Sms4bException(Loc::getMessage('SMS4B_VALIDATION_ERROR'), $e->getCode(), $e);
        }

        return $result;
    }

    /**
     * @return bool
     */
    public function canUse()
    {
        return true;
    }

    /**
     * @return array
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function getFromList()
    {
        try {
            if ($this->isReadyToWorkModuleSms4b()) {
                $addresses = $this->sms4b->getAllSenders();
                $arAddr = [];
                foreach ($addresses as $addr) {
                    $arAddr[] = [
                        'id'   => $addr,
                        'name' => $addr
                    ];
                }

                return $arAddr;
            }
        } catch (Sms4bException $e) {
            $debug = new Debug\Service();
            $debug->writeToLogFile($e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine() . PHP_EOL);
        }
    }

    /**
     * @return bool
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function isReadyToWorkModuleSms4b(): bool
    {
        $config = new \Rarus\Sms4b\Config\Service();
        $addresses = $this->sms4b->getAllSenders();

        if (\CModule::IncludeModule('rarus.sms4b')
            && Option::get("rarus.sms4b", "module_enabled") === 'Y'
            && !empty($config->getLogin())
            && !empty($config->getPassword())
            && !empty($addresses[0])
        ) {
            return true;
        }
        return false;
    }
}
