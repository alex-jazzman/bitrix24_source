<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\MethodExecutor;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\Exceptions\Sms4bException;

abstract class MethodExecutor
{
    /**
     * @var string Адрес главного сервиса
     */
    private $mainAddressService = 'https://sms4b.ru/ws/sms.asmx?wsdl';
    /**
     * @var string Адрес резервного сервиса
     */
    private $reserveAddressService = 'https://s.sms4b.ru/ws/sms.asmx';
    protected $client;

    /**
     * @throws Sms4bException
     */
    public function __construct()
    {
        try {
            $this->client = new \SoapClient($this->mainAddressService, ['exceptions'=>true]);
        } catch (\SoapFault $e) {
            try {
                $this->client = new \SoapClient($this->reserveAddressService, ['exceptions'=>true]);
            } catch (\SoapFault $e) {
                throw new Sms4bException(Loc::getMessage('SMS4B_MAIN_ERROR_CONNECT'));
            }
        }
    }

    /**
     * @return string
     */
    abstract protected function getMethodName(): string;


    /**
     * @param array $requestArguments
     *
     * @return array
     */
    protected function prepareRequestArguments(array $requestArguments): array
    {
        return $requestArguments;
    }

    /**
     * @param string $methodName
     * @param array  $requestArguments
     *
     * @return mixed
     * @throws Sms4bException
     */
    final protected function performRequest(string $methodName, array $requestArguments)
    {
        try{
            return $this->client->__soapCall($methodName, [$requestArguments]);
        } catch (\SoapFault $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_MAIN_CALL_METHOD_ERROR',
                ['#METHOD#' => $methodName]), $e->getCode(), $e->getPrevious());
        }
    }

    /**
     *
     * @param $rawResponse
     *
     */
    abstract protected function prepareResponse($rawResponse);

    /**
     * @param array $requestArguments
     *
     * @throws Sms4bException
     */

    /**
     * @param array $requestArguments
     *
     * @return mixed
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    final public function execute(array $requestArguments)
    {
        $requestArguments = $this->prepareRequestArguments($requestArguments);

        $rawResponse = $this->performRequest($this->getMethodName(), $requestArguments);

        return $this->prepareResponse($rawResponse);
    }

}