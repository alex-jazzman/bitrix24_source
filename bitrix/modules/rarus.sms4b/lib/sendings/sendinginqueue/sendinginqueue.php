<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\SendingInQueue;

use \Rarus\Sms4b\Sendings\SendingInQueue\Message;

class SendingInQueue
{
    /**
     * @var int
     */
    private $sendingId;
    /**
     * @var int|null
     */
    private $groupId;
    /**
     * @var string
     */
    private $sender;
    /**
     * @var \DateTime|null
     */
    private $startDate;
    /**
     * @var \DateTime|null
     */
    private $actualDate;
    /**
     * @var string|null
     */
    private $allowedDeliveryInterval;
    /**
     * @var string
     */
    private $sendingSource;
    /**
     * @var Message\Collection
     */
    private $messages;


    /**
     * SendingInQueue constructor.
     *
     * @param int                $sendingId
     * @param string             $sender
     * @param \DateTime|null     $startDate
     * @param \DateTime|null     $actualDate
     * @param string|null        $allowedDeliveryInterval
     * @param string             $sendingSource
     * @param Message\Collection $messages
     */
    public function __construct(
        int $sendingId,
        string $sender,
        ?\DateTime $startDate,
        ?\DateTime $actualDate,
        ?string $allowedDeliveryInterval,
        string $sendingSource,
        Message\Collection $messages
    ) {
        $this->sendingId = $sendingId;
        $this->sender = $sender;
        $this->startDate = $startDate;
        $this->actualDate = $actualDate;
        $this->allowedDeliveryInterval = $allowedDeliveryInterval;
        $this->sendingSource = $sendingSource;
        $this->messages = $messages;
    }

    /**
     * @return int
     */
    public function getSendingId(): int
    {
        return $this->sendingId;
    }

    /**
     * @return int|null
     */
    public function getGroupId(): ?int
    {
        return $this->groupId;
    }

    /**
     * @return string
     */
    public function getSender(): string
    {
        return $this->sender;
    }

    /**
     * @return \DateTime|null
     */
    public function getStartDate(): ?\DateTime
    {
        return $this->startDate;
    }

    /**
     * @return \DateTime|null
     */
    public function getActualDate(): ?\DateTime
    {
        return $this->actualDate;
    }

    /**
     * @return string|null
     */
    public function getAllowedDeliveryInterval(): ?string
    {
        return $this->allowedDeliveryInterval;
    }

    /**
     * @return Message\Collection
     */
    public function getMessages(): Message\Collection
    {
        return $this->messages;
    }

    /**
     * @return string
     */
    public function getSendingSource(): string
    {
        return $this->sendingSource;
    }

    /**
     * @param int $groupId
     */
    public function setGroupId(int $groupId): void
    {
        $this->groupId = $groupId;
    }
}