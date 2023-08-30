<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Dto\GroupSms;

class SmsResult
{
    /**
     * @var string $guid
     */
    protected $guid;

    /**
     * @var int $result
     */
    protected $result;

    public function __construct(
        string $guid,
        int $result
    ) {
        $this->guid = $guid;
        $this->result = $result;
    }

    /**
     * @return string
     */
    public function getGuid(): string
    {
        return $this->guid;
    }

    /**
     * @return int
     */
    public function getResult(): int
    {
        return $this->result;
    }


}