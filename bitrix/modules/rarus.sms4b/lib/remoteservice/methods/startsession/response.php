<?php

namespace Rarus\Sms4b\RemoteService\Methods\StartSession;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;

class Response extends RemoteService\Response\SimpleResponse
{
    /**
     * @param int $Result
     */
    public function __construct(int $Result)
    {
        parent::__construct($Result);
    }


    /**
     * @inheritdoc
     */
    protected function registerStates(): void
    {
        parent::registerStates();
        $this->registerState(0, Loc::getMessage('SMS4B_START_SESSION_RESPONSE_0'));
        $this->registerState(23, Loc::getMessage('SMS4B_START_SESSION_RESPONSE_23'));
    }

    /**
     * @return bool
     */
    public function isSuccess(): bool
    {
        return $this->getState()->getCode() > 0;
    }
}