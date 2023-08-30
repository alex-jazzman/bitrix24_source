<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class Telephony extends Source
{
    public const MODULE_VOXIMPLANT = 110;

    public const FOR_SERVICE = 'moduleTelephony';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_TELEPHONY');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::MODULE_VOXIMPLANT
        ];
    }
}