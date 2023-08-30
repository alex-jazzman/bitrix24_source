<?php

namespace Rarus\Sms4b\RemoteService\Methods\CheckSMS;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;

class Response extends RemoteService\Response\ComplexResponse
{
    /**
     * @var RemoteService\Dto\CheckSms\Collection $smsResultCollection
     */
    private $smsResultCollection;

    /**
     * @param int                                   $result
     * @param RemoteService\Dto\CheckSms\Collection $smsResultCollection
     */
    public function __construct(
        int $result,
        RemoteService\Dto\CheckSms\Collection $smsResultCollection
    ) {
        parent::__construct($result);

        $this->smsResultCollection = $smsResultCollection;
    }


    /**
     * @inheritdoc
     */
    protected function registerStates(): void
    {
        parent::registerStates();
        $this->registerState(-2, Loc::getMessage('SMS4B_CHECK_SMS_RESPONSE_2'));
        $this->registerState(-20, Loc::getMessage('SMS4B_CHECK_SMS_RESPONSE_20'));
        $this->registerState(-22, Loc::getMessage('SMS4B_CHECK_SMS_RESPONSE_22'));
    }

    /**
     * @return bool
     */
    public function isSuccess(): bool
    {
        return $this->getState()->getCode() >= 0;
    }

    /**
     * @return RemoteService\Dto\CheckSms\Collection
     */
    public function getSmsResultCollection(): RemoteService\Dto\CheckSms\Collection
    {
        return $this->smsResultCollection;
    }

    /**
     * @return array
     */
    public function resultToArray(): array
    {
        $result = [];
        foreach ($this->smsResultCollection as $item) {
            $result[$item->getGuid()] = $item->getResult();
        }

        return $result;
    }

}