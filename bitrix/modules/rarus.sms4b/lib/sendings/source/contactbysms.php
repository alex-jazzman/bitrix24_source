<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class ContactBySms extends Source
{
    public const CONTACT_BY_SMS = 80;

    public const FOR_SERVICE = 'componentContactBySms';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_CONTACT_BY_SMS');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::CONTACT_BY_SMS
        ];
    }
}