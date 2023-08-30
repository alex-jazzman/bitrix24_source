<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Source;


class Crm extends Source
{
    public const CRM = 20;

    public const FOR_SERVICE = 'crm';
    public const FOR_USER = 'CRM';

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
            self::CRM
        ];
    }
}