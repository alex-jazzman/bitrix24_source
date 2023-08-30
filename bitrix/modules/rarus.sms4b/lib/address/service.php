<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Address;

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
     * @return array
     * @throws Sms4bException
     */
    public function getAllAddresses(): array
    {
        $this->remoteService->openConnectToService();
        $response = $this->remoteService->ParamSMS();
        if(!$response->isSuccess()) {
            throw new Sms4bException(Loc::getMessage('SMS4B_CHECK_MODULE_OPTION'));
        }
        return $response->getAddresses();
    }

    /**
     * @return bool
     * @throws Sms4bException
     */
    public function hasAccountDigitNumber(): bool
    {
        $addresses = $this->getAllAddresses();
        foreach ($addresses as $address) {
            if (is_numeric($address)) {
                return true;
            }
        }

        return false;
    }
}