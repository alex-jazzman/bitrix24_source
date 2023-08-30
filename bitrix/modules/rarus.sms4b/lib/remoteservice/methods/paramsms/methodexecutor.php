<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Methods\ParamSMS;

use Rarus\Sms4b\RemoteService;
use Rarus\Sms4b\Debug;

class MethodExecutor extends RemoteService\MethodExecutor\MethodExecutor
{

    /**
     * {@inheritdoc}
     */
    protected function getMethodName(): string
    {
        return 'ParamSMS';
    }

    /**
     * {@inheritdoc}
     */
    protected function prepareResponse($rawResponse)
    {
        $response = $rawResponse->{$this->getMethodName() . 'Result'};
        $arAddresses = $response->Addresses === null ? [] : explode("\n", $response->Addresses);

        if (!(gettype($response->Rest) === 'double' || gettype($response->Rest) === 'NULL')) {
            $debugService = new Debug\Service();
            $debugService->writeToLogFile('ParamSMSresponseError $response = ' . var_export($response, true));
        }

        return new Response(
            (int)$response->Result,
            (float)$response->Rest,
            $arAddresses,
            (int)$response->AddrMask,
            (string)$response->UTC,
            (int)$response->Duration,
            (int)$response->Limit
        );
    }

}
