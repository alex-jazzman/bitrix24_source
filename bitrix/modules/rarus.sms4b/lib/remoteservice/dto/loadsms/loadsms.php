<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Dto\LoadSms;


class LoadSms
{
    /**
     * @var string $guid
     */
    protected $guid;
    /**
     * @var string $destination
     */
    protected $destination;
    /**
     * @var string $body
     */
    protected $body;
    /**
     * @var int $encoding
     */
    protected $encoding;
    /**
     * @var int $allPartsCount
     */
    protected $allPartsCount;
    /**
     * @var int $partNumber
     */
    protected $partNumber;
    /**
     * @var \DateTime $moment
     */
    protected $moment;
    /**
     * @var \DateTime $time
     */
    protected $time;
    /**
     * @var string $source
     */
    protected $source;

    /**
     * LoadSms constructor.
     *
     * @param string $guid
     * @param string $destination
     * @param string $body
     * @param int    $encoding
     * @param int    $allPartsCount
     * @param int    $partNumber
     * @param \DateTime $moment
     * @param \DateTime $time
     * @param string $source
     */
    public function __construct(
        string $guid,
        string $destination,
        string $body,
        int $encoding,
        int $allPartsCount,
        int $partNumber,
        \DateTime $moment,
        \DateTime $time,
        string $source
    ) {
        $this->guid = $guid;
        $this->destination = $destination;
        $this->body = $body;
        $this->encoding = $encoding;
        $this->allPartsCount = $allPartsCount;
        $this->partNumber = $partNumber;
        $this->moment = $moment;
        $this->time = $time;
        $this->source = $source;
    }

    /**
     * @return string
     */
    public function getGuid(): string
    {
        return $this->guid;
    }

    /**
     * @return string
     */
    public function getDestination(): string
    {
        return $this->destination;
    }

    /**
     * @return string
     */
    public function getBody(): string
    {
        return $this->body;
    }

    /**
     * @return int
     */
    public function getEncoding(): int
    {
        return $this->encoding;
    }

    /**
     * @return int
     */
    public function getAllPartsCount(): int
    {
        return $this->allPartsCount;
    }

    /**
     * @return int
     */
    public function getPartNumber(): int
    {
        return $this->partNumber;
    }

    /**
     * @return \DateTime
     */
    public function getMoment(): \DateTime
    {
        return $this->moment;
    }

    /**
     * @return \DateTime
     */
    public function getTime(): \DateTime
    {
        return $this->time;
    }

    /**
     * @return string
     */
    public function getSource(): string
    {
        return $this->source;
    }
}