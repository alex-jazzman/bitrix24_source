<?php

namespace Rarus\Sms4b\RemoteService\Methods\LoadSMS;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;

class Response extends RemoteService\Response\ComplexResponse
{
    /**
     * @var RemoteService\Dto\LoadSms\Collection $loadSmsCollection
     */
    private $loadSmsCollection;

    /**
     * @param int                                 $result
     * @param RemoteService\Dto\LoadSms\Collection $loadSmsCollection
     */
    public function __construct(
        int $result,
        RemoteService\Dto\LoadSms\Collection $loadSmsCollection
    ) {
        parent::__construct($result);

        $this->loadSmsCollection = $loadSmsCollection;
    }


    /**
     * @inheritdoc
     */
    protected function registerStates(): void
    {
        parent::registerStates();
        $this->registerState(-2, Loc::getMessage('SMS4B_LOAD_SMS_RESPONSE_2'));
        $this->registerState(-20, Loc::getMessage('SMS4B_LOAD_SMS_RESPONSE_20'));
    }

    /**
     * @return bool
     */
    public function isSuccess(): bool
    {
        return $this->getState()->getCode() >= 0;
    }

    /**
     * @return RemoteService\Dto\LoadSms\Collection
     */
    public function getLoadSmsCollection(): RemoteService\Dto\LoadSms\Collection
    {
        return $this->loadSmsCollection;
    }
}