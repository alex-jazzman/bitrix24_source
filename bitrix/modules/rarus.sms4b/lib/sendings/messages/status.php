<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Messages;

use Bitrix\Main\Localization\Loc;

class Status
{
    /**
     * Создана, еще не отправлялась
     */
    public const CREATE = 1;
    /**
     * Передана на сервис
     */
    public const IN_PROCESS = 2;
    /**
     * Доставлена
     */
    public const STATUS_SEND = 3;
    /**
     * Не доставлена
     */
    public const NOT_SEND = 4;
    /**
     * Отвергнута
     */
    public const STATUS_REJECTED = 5;
    /**
     * @var int
     */
    private $status;

    /**
     * Status constructor.
     *
     * @param int $status
     */
    public function __construct(int $status)
    {
        $this->setStatus($status);
    }

    /**
     * @param int $status
     *
     * @throws \InvalidArgumentException
     */
    private function setStatus(int $status): void
    {
        if (!\in_array($status,
            [
                self::CREATE,
                self::IN_PROCESS,
                self::STATUS_SEND,
                self::STATUS_REJECTED,
                self::NOT_SEND
            ], true)) {
            throw new \InvalidArgumentException(Loc::getMessage('SMS4B_SENDING_STATUS_ERROR'));
        }
        $this->status = $status;
    }

    /**
     * @return int
     */
    public function getStatus(): int
    {
        return $this->status;
    }

    /**
     * @param int $status
     *
     * @return string
     */
    public static function getStatusDescription(int $status): string
    {
        $description = '';
        switch ($status) {
            case 1:
                $description = Loc::getMessage('SMS4B_STATUS_CREATE');
                break;
            case 2:
                $description = Loc::getMessage('SMS4B_STATUS_IN_PROCESS');
                break;
            case 3:
                $description = Loc::getMessage('SMS4B_STATUS_SEND');
                break;
            case 4:
                $description = Loc::getMessage('SMS4B_STATUS_NOT_SEND');
                break;
            case 5:
                $description = Loc::getMessage('SMS4B_STATUS_REJECTED');
                break;
        }

        return $description;
    }

    /**
     * @param int $status
     *
     * @return bool
     */
    public static function isFinalStatus(int $status): bool
    {
        return \in_array($status, [self::NOT_SEND, self::STATUS_SEND], true);
    }

    /**
     * @return bool
     */
    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_SEND;
    }

    /**
     * @return bool
     */
    public function isNotDelivered(): bool
    {
        return $this->status === self::NOT_SEND;
    }

}