<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class Subscribe extends Source
{
    public const SUBSCRIBE = 100;

    public const FOR_SERVICE = 'moduleSubscribe';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_SUBSCRIBE');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::SUBSCRIBE
        ];
    }
}