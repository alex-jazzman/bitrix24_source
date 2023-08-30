<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Messages;

class Message {
    /**
     * @var int|null
     */
    private $id;
    /**
     * @var int|null
     */
    private $sendingId;
    /**
     * @var string
     */
    private $destination;
    /**
     * @var string
     */
    private $guid;
    /**
     * @var string
     */
    private $text;
    /**
     * @var Status
     */
    private $status;
    /**
     * @var int
     */
    private $encoding;
    /**
     * @var int
     */
    private $entityId;
    /**
     * @var \DateTime
     */
    private $lastModified;
    /**
     * @var string|null
     */
    private $result;

    /**
     * Message constructor.
     *
     * @param string    $destination
     * @param string    $guid
     * @param string    $text
     * @param Status    $status
     * @param int       $encoding
     * @param int|null  $entityId
     * @param \DateTime $lastModified
     */
    public function __construct(
        string $destination,
        string $guid,
        string $text,
        Status $status,
        int $encoding,
        ?int $entityId,
        \DateTime $lastModified
    ) {
        $this->destination = $destination;
        $this->guid = $guid;
        $this->text = $text;
        $this->status = $status;
        $this->encoding = $encoding;
        $this->entityId = $entityId;
        $this->lastModified = $lastModified;
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
    public function getDestination(): string
    {
        return $this->destination;
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
    public function getText(): string
    {
        return $this->text;
    }

    /**
     * @return Status
     */
    public function getStatus(): Status
    {
        return $this->status;
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
    public function getEntityId(): int
    {
        return $this->entityId;
    }

    /**
     * @return \DateTime
     */
    public function getLastModified(): \DateTime
    {
        return $this->lastModified;
    }

    /**
     * @return string|null
     */
    public function getResult(): ?string
    {
        return $this->result;
    }

    /**
     * @param Status $status
     */
    public function setStatus(Status $status): void
    {
        $this->status = $status;
    }

    /**
     * @param \DateTime $lastModified
     */
    public function setLastModified(\DateTime $lastModified): void
    {
        $this->lastModified = $lastModified;
    }

    /**
     * @param string|null $result
     */
    public function setResult(?string $result): void
    {
        $this->result = $result;
    }

    /**
     * @param int $id
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * @return int|null
     */
    public function getSendingId(): ?int
    {
        return $this->sendingId;
    }

    /**
     * @param int $sendingId
     */
    public function setSendingId(int $sendingId): void
    {
        $this->sendingId = $sendingId;
    }

}