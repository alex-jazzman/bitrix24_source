<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Response;

use Bitrix\Main\Localization\Loc;

abstract class Response
{
    /**
     * @var integer Response status code.
     */
    private $Result;

    /**
     * @var ResponseState
     */
    private $state;

    /**
     * @param integer $Result
     */
    public function __construct($Result)
    {
        $this->constructState($Result);
    }

    /**
     * @param integer $stateCode
     * @return void
     */
    private function constructState($stateCode): void
    {
        $this->Result = $stateCode;
        $this->registerStates();
        if ($this->state === null) {
            $this->registerState($stateCode, Loc::getMessage('UNIDENTIFIED_SERVICE_RESPONSE'));
        }
    }

    /**
     * @return void
     */
    protected function registerStates(): void
    {
        $this->registerState(-1, Loc::getMessage('SMS4B_RESPONSE_1'));
        $this->registerState(-10, Loc::getMessage('METHOD_EXECUTION_FAILED'));
    }

    /**
     * @param integer $code
     * @param string $description
     * @return void
     */
    protected function registerState($code, $description): void
    {
        if ($code !== $this->Result) {
            return;
        }
        $this->state = new ResponseState($code, $description);
    }

    /**
     * @see state
     * @return ResponseState
     */
    public function getState(): ResponseState
    {
        return $this->state;
    }
}
