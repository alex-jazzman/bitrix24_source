<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Balance;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Service
{
    /**
     * @var RemoteService\Service
     */
    private $remoteService;


    public function __construct()
    {
        $this->remoteService = new RemoteService\Service();
    }

    /**
     * @return float
     * @throws Sms4bException
     */
    public function getBalance(): float
    {
        $this->remoteService->openConnectToService();
        $response = $this->remoteService->ParamSMS();
        if(!$response->isSuccess()) {
            throw new Sms4bException(Loc::getMessage('SMS4B_CHECK_MODULE_OPTION'));
        }
        return $response->getRest();
    }
}