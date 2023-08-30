<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class ForgottenBasket extends Source
{
    public const FORGOTTEN_BASKET = 140;

    public const FOR_SERVICE = 'forgottenBasket';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_FORGOTTEN_BASKET');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::FORGOTTEN_BASKET
        ];
    }
}