<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class PublicComponent extends Source
{
    public const USER = 70;
    public const PHONE_TEXT = 71;

    public const FOR_SERVICE = 'user';
    public const FOR_SERVICE2 = 'formNumber-text';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);

        if($code === self::USER) {
            $this->descriptionForService = self::FOR_SERVICE;
        } elseif($code === self::PHONE_TEXT) {
            $this->descriptionForService = self::FOR_SERVICE2;
        }

        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_PUBLIC_COMPONENT');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::USER,
            self::PHONE_TEXT
        ];
    }
}