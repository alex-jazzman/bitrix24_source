<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings;

use Rarus\Sms4b\Sendings\Source;

class Sending
{
    /**
     * @var int|null
     */
    private $id;
    /**
     * @var string
     */
    private $sender;
    /**
     * @var Source\Source
     */
    private $source;
    /**
     * @var Messages\Collection
     */
    private $messages;
    /**
     * @var \DateTime
     */
    private $dateStartForUser;
    /**
     * @var \DateTime|null
     */
    private $dateStart;
    /**
     * @var \DateTime|null
     */
    private $dateActual;
    /**
     * @var string|null
     */
    private $allowedDeliveryInterval;
    /**
     * @var null|string
     */
    private $event;

    /**
     * Sending constructor.
     *
     * @param string              $sender
     * @param Messages\Collection $messages
     * @param \DateTime           $dateStartForUser
     * @param Source\Source       $source
     * @param \DateTime|null      $dateStart
     * @param \DateTime|null      $dateActual
     * @param string|null         $allowedDeliveryInterval
     * @param string|null         $event
     */
    public function __construct(
        string $sender,
        Messages\Collection $messages,
        \DateTime $dateStartForUser,
        Source\Source $source,
        ?\DateTime $dateStart,
        ?\DateTime $dateActual,
        ?string $allowedDeliveryInterval,
        ?string $event
    ) {
        $this->sender = $sender;
        $this->source = $source;
        $this->messages = $messages;
        $this->dateStartForUser = $dateStartForUser;
        $this->dateStart = $dateStart;
        $this->dateActual = $dateActual;
        $this->allowedDeliveryInterval = $allowedDeliveryInterval;
        $this->event = $event;
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
    public function getSender(): string
    {
        return $this->sender;
    }

    /**
     * @return Source\Source
     */
    public function getSource(): Source\Source
    {
        return $this->source;
    }

    /**
     * @return Messages\Collection
     */
    public function getMessages(): Messages\Collection
    {
        return $this->messages;
    }

    /**
     * @return \DateTime|null
     */
    public function getDateStart(): ?\DateTime
    {
        return $this->dateStart;
    }

    /**
     * @return \DateTime|null
     */
    public function getDateActual(): ?\DateTime
    {
        return $this->dateActual;
    }

    /**
     * @return string|null
     */
    public function getAllowedDeliveryInterval(): ?string
    {
        return $this->allowedDeliveryInterval;
    }

    /**
     * @return null|string
     */
    public function getEvent(): ?string
    {
        return $this->event;
    }

    /**
     * @return \DateTime
     */
    public function getDateStartForUser(): \DateTime
    {
        return $this->dateStartForUser;
    }

    /**
     * @param int $id
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }
}