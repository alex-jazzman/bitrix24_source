<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Debug;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Service
{
    /**
     * @var Config\Service
     */
    private $config;

    public function __construct()
    {
        $this->config = new Config\Service();
    }

    /**
     * @param string|null $data
     *
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function writeToLogFile(?string $data): void
    {
        try {
            if ($this->config->getLogEnableSetting() === 'Y') {
                $dateTime = new \Bitrix\Main\Type\DateTime();
                $data = $dateTime->toString() . ' ' . print_r($data, true) . PHP_EOL;
                file_put_contents($this->getLogFileName(), $data, FILE_APPEND | LOCK_EX);
            }
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_DEBUG_WRITE_ERROR'), $e->getCode(), $e);
        }
    }

    public function cleanLogFile(): void
    {
        if (file_exists($this->getLogFileName())) {
            unlink($this->getLogFileName());
        }
    }

    public function getLogData()
    {
        if (file_exists($this->getLogFileName())) {
            return file_get_contents($this->getLogFileName());
        } else {
            return Loc::getMessage('SMS4B_MAIN_LOG_NO_FILE');
        }
    }

    /**
     * @return string
     */
    private function getLogFileName(): string
    {
        return $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/' . GetModuleID(__FILE__) . '/logSms4b.txt';
    }
}