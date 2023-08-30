<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Methods\CheckSMS;

use Rarus\Sms4b\RemoteService;

class MethodExecutor extends RemoteService\MethodExecutor\MethodExecutor
{
    /**
     * {@inheritdoc}
     */
    protected function getMethodName(): string
    {
        return 'CheckSMS';
    }

    /**
     * {@inheritdoc}
     */
    protected function prepareResponse($rawResponse)
    {
        $response = $rawResponse->{$this->getMethodName() . 'Result'};
        $result = $response->Result;

        $smsResultCollection = new RemoteService\Dto\CheckSms\Collection();
        if (!empty($response->List)) {
            if (!is_array($response->List->{$this->getMethodName() . 'List'})) {
                $smsResult = new RemoteService\Dto\CheckSms\SmsResult(
                    $response->List->{$this->getMethodName() . 'List'}->G,
                    $response->List->{$this->getMethodName() . 'List'}->R
                );
                $smsResultCollection->attach($smsResult);
            } else {
                foreach ($response->List->{$this->getMethodName() . 'List'} as $item) {
                    $smsResult = new RemoteService\Dto\CheckSms\SmsResult(
                        $item->G,
                        $item->R
                    );
                    $smsResultCollection->attach($smsResult);
                }
            }
        }

        return new Response($result, $smsResultCollection);
    }
}