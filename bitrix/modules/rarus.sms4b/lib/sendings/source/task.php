<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

use Bitrix\Main\Localization\Loc;

class Task extends Source
{
    public const TASK = 30;

    public const FOR_SERVICE = 'task';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = Loc::getMessage('SMS4B_SOURCE_TASK');
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::TASK
        ];
    }
}