<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;

class Custom extends Source
{
    public const CUSTOM = 120;

    public const FOR_SERVICE = 'custom';
    public const FOR_USER = 'custom';

    /**
     * @param int $code
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function __construct(int $code)
    {
        parent::__construct($code);
        $this->descriptionForService = self::FOR_SERVICE;
        $this->descriptionForUser = self::FOR_USER;
    }

    /**
     * @return array
     */
    protected static function getAllowed(): array
    {
        return [
            self::CUSTOM
        ];
    }
}