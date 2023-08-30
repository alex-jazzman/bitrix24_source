<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class Support extends Source
{
    public const SUPPORT = 50;

    public const FOR_SERVICE = 'support';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_SUPPORT');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::SUPPORT
        ];
    }
}