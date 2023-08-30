<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class Calendar extends Source
{
    public const CALENDAR = 90;

    public const FOR_SERVICE = 'moduleEventCalendar';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_CALENDAR');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::CALENDAR
        ];
    }
}