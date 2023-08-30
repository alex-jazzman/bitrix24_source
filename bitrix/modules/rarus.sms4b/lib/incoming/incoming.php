<?php

declare(strict_types=1);

namespace Rarus\Sms4b\Incoming;

use Rarus\Sms4b\RemoteService\Dto\LoadSms\LoadSms;

class Incoming
{
    /**
     * @var int $id
     */
    private $id;
    /**
     * @var string $guid
     */
    private $guid;
    /**
     * @var string $destination
     */
    private $destination;
    /**
     * @var string $body
     */
    private $body;
    /**
     * @var int $encoding
     */
    private $encoding;
    /**
     * @var int $allPartsCount
     */
    private $allPartsCount;
    /**
     * @var int $partNumber
     */
    private $partNumber;
    /**
     * @var \DateTime $moment
     */
    private $moment;
    /**
     * @var \DateTime $time
     */
    private $time;
    /**
     * @var string $source
     */
    private $source;

    /**
     * @param int|null    $id
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
        ?int $id = null,
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
        $this->id = $id;
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
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
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

    /**
     * @param int $id
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * @param LoadSms $loadSms
     *
     * @return Incoming
     */
    public static function createInstanceFromDto(LoadSms $loadSms): Incoming
    {
        return new Incoming(
            null,
            $loadSms->getGuid(),
            $loadSms->getDestination(),
            $loadSms->getBody(),
            $loadSms->getEncoding(),
            $loadSms->getAllPartsCount(),
            $loadSms->getPartNumber(),
            $loadSms->getMoment(),
            $loadSms->getTime(),
            $loadSms->getSource()
        );
    }

}