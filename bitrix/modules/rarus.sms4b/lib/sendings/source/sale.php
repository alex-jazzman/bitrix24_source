<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class Sale extends Source
{
    public const SALE = 1;

    public const FOR_SERVICE = 'sale';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_SALE');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::SALE
        ];
    }
}