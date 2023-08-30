<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Methods\CloseSession;

use Rarus\Sms4b\RemoteService;

class MethodExecutor extends RemoteService\MethodExecutor\MethodExecutor
{

    /**
     * {@inheritdoc}
     */
    protected function getMethodName(): string
    {
        return 'CloseSession';
    }

    /**
     * {@inheritdoc}
     */
    protected function prepareResponse($rawResponse)
    {
        return new Response($rawResponse->{$this->getMethodName() . 'Result'});
    }

}