<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Methods\StartSession;

use Rarus\Sms4b\RemoteService;

class MethodExecutor extends RemoteService\MethodExecutor\MethodExecutor
{

    /**
     * {@inheritdoc}
     */
    protected function getMethodName(): string
    {
        return 'StartSession';
    }

    /**
     * {@inheritdoc}
     */
    protected function prepareResponse($rawResponse)
    {
        return new Response($rawResponse->{$this->getMethodName() . 'Result'});
    }

}