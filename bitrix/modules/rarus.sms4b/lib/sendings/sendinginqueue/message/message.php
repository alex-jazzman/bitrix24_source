<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\SendingInQueue\Message;

class Message
{
    /**
     * @var int|null
     */
    private $id;
    /**
     * @var string
     */
    private $guid;
    /**
     * @var string
     */
    private $destination;
    /**
     * @var string
     */
    private $text;
    /**
     * @var int
     */
    private $encoding;
    /**
     * @var int|null
     */
    private $result;
    /**
     * @var Status
     */
    private $statusInQueue;

    /**
     * Message constructor.
     *
     * @param string $guid
     * @param string $destination
     * @param string $text
     * @param int    $encoding
     * @param Status $statusInQueue
     */
    public function __construct(
        string $guid,
        string $destination,
        string $text,
        int $encoding,
        Status $statusInQueue
    ) {
        $this->guid = $guid;
        $this->destination = $destination;
        $this->text = $text;
        $this->encoding = $encoding;
        $this->statusInQueue = $statusInQueue;
    }

    /**
     * @param int $id
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * @param int|null $result
     */
    public function setResult(?int $result): void
    {
        $this->result = $result;
    }

    /**
     * @param Status $statusInQueue
     */
    public function setStatusInQueue(Status $statusInQueue): void
    {
        $this->statusInQueue = $statusInQueue;
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
    public function getText(): string
    {
        return $this->text;
    }

    /**
     * @return int
     */
    public function getEncoding(): int
    {
        return $this->encoding;
    }

    /**
     * @return int|null
     */
    public function getResult(): ?int
    {
        return $this->result;
    }

    /**
     * @return Status
     */
    public function getStatusInQueue(): Status
    {
        return $this->statusInQueue;
    }

}