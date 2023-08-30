<?php

namespace Rarus\Sms4b\RemoteService\Methods\ParamSMS;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;

class Response extends RemoteService\Response\ComplexResponse
{
    /**
     * @var double $rest
     */
    private $rest;
    /**
     * @var array $addresses
     */
    private $addresses;
    /**
     * @var int $addressMask
     */
    private $addressMask;
    /**
     * @var string $uts
     */
    private $uts;
    /**
     * @var int $duration
     */
    private $duration;
    /**
     * @var int $limit
     */
    private $limit;


    /**
     * Response constructor.
     *
     * @param int         $result
     * @param float|null  $rest
     * @param array|null  $addresses
     * @param int|null    $addressMask
     * @param string|null $uts
     * @param int|null    $duration
     * @param int|null    $limit
     */
    public function __construct(
        int $result,
        ?float $rest,
        ?array $addresses,
        ?int $addressMask,
        ?string $uts,
        ?int $duration,
        ?int $limit
    ) {
        parent::__construct($result);

        $this->rest = $rest;
        $this->addresses = $addresses;
        $this->addressMask = $addressMask;
        $this->uts = $uts;
        $this->duration = $duration;
        $this->limit = $limit;
    }


    /**
     * @inheritdoc
     */
    protected function registerStates(): void
    {
        parent::registerStates();
        $this->registerState(-2, Loc::getMessage('SMS4B_PARAM_SMS_RESPONSE_2'));
        $this->registerState(-20, Loc::getMessage('SMS4B_PARAM_SMS_RESPONSE_20'));
    }

    /**
     * @return bool
     */
    public function isSuccess(): bool
    {
        return $this->getState()->getCode() > 0;
    }

    /**
     * @return float
     */
    public function getRest(): float
    {
        return $this->rest;
    }

    /**
     * @return array
     */
    public function getAddresses(): array
    {
        return $this->addresses;
    }

    /**
     * @return int
     */
    public function getAddressMask(): int
    {
        return $this->addressMask;
    }

    /**
     * @return string
     */
    public function getUts(): string
    {
        return $this->uts;
    }

    /**
     * @return int
     */
    public function getDuration(): int
    {
        return $this->duration;
    }

    /**
     * @return int
     */
    public function getLimit(): int
    {
        return $this->limit;
    }


}