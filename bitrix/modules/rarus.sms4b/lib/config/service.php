<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Config;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use CSite;
use Rarus\Sms4b\DateTimeConverter;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Service
{
    use DateTimeConverter;
    private const MODULE_NAME = 'rarus.sms4b';

    private const MODULE_ENABLED = 'module_enabled';
    private const LOGIN = 'login';
    private const PASSWORD = 'password';
    private const GMT = 'gmt';
    private const LOG_ENABLE = 'log_enable';
    private const SEND_EMAIL = 'send_email'; //Отправлять email администратору сайта о недоступности сервиса
    private const SEND_ERROR_LETTER = 'error_send_letter'; //Email отправлен пользователю.
    private const DATE_FOR_SEND_EMAIL = 'timer_server_not_available';
    private const SEND_ON_AGENT = 'send_on_agent';
    private const LOAD_INCOMING_FROM = 'load_incoming_from';
    private const PROCESSING_OLD_EVENTS = 'processing_old_events';
    private const AMOUNT_FOR_SEND_AT_ONCE = 'amount_for_send_at_once';

    private const DEFAULT_SENDER = 'defsender';
    private const ALLOWED_DELIVERY_INTERVAL = 'restricted_time';
    private const TRANSLIT = 'use_translit';

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getModuleEnableSetting(): string
    {
        return $this->getOption(self::MODULE_ENABLED);
    }

    /**
     * @param string $site
     *
     * @return string
     * @throws Sms4bException
     */
    public function getDefaultSender(string $site): string
    {
        return $this->getOption(self::DEFAULT_SENDER, $site);
    }

    /**
     * @param string $value
     * @param string $site
     *
     * @throws Sms4bException
     */
    public function setDefaultSender(string $value, string $site): void
    {
        $this->setOption(self::DEFAULT_SENDER, $value, $site);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getAmountForSendAtOnce(): string
    {
        return $this->getOption(self::AMOUNT_FOR_SEND_AT_ONCE);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getLogin(): string
    {
        return $this->getOption(self::LOGIN);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getPassword(): string
    {
        return $this->getOption(self::PASSWORD);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getGmt(): string
    {
        return $this->getOption(self::GMT);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getLogEnableSetting(): string
    {
        return $this->getOption(self::LOG_ENABLE);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getSendOnAgentSetting(): string
    {
        return $this->getOption(self::SEND_ON_AGENT);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getLoadIncomingFrom(): string
    {
        return $this->getOption(self::LOAD_INCOMING_FROM);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getProcessingOldEvent(): string
    {
        return $this->getOption(self::PROCESSING_OLD_EVENTS);
    }

    /**
     * @param \DateTime $loadIncomingFrom
     *
     * @throws Sms4bException
     */
    public function setLoadIncomingFrom(\DateTime $loadIncomingFrom): void
    {
        $date = $loadIncomingFrom->format('Y-m-d H:i:s');
        $this->setOption(self::LOAD_INCOMING_FROM, $date);
    }

    /**
     * @param string $site
     *
     * @return string
     * @throws Sms4bException
     */
    public function getAllowedDeliveryInterval(string $site): string
    {
        return $this->getOption(self::ALLOWED_DELIVERY_INTERVAL, $site);
    }

    /**
     * @param string $site
     *
     * @return string
     * @throws Sms4bException
     */
    public function getTranslitSetting(string $site): string
    {
        return $this->getOption(self::TRANSLIT, $site);
    }

    /**
     * @param string $name
     * @param string $site
     *
     * @return string
     * @throws Sms4bException
     */
    public function getSettingByName(string $name, $site = null): string
    {
        return $this->getOption($name, $site);
    }

    /**
     * @param int $value
     *
     * @throws Sms4bException
     */
    public function setDeadlineDate(int $value): void
    {
        $this->setOption('deadline_date', (string)$value);
    }

    /**
     * @param string $variableName
     * @param int    $value
     *
     * @throws Sms4bException
     */
    public function setSessionId(string $variableName, int $value): void
    {
        $this->setOption($variableName, (string)$value);
    }

    /**
     * Получить параметр "Отправлять email администратору сайта о недоступности сервиса" из настроек
     * @return string
     * @throws Sms4bException
     */
    public function getSendEmailToAdminSetting(): string
    {
        return $this->getOption(self::SEND_EMAIL);
    }

    /**
     *
     * @return string
     * @throws Sms4bException
     */
    public function getSentErrorEmailSetting(): string
    {
        return $this->getOption(self::SEND_ERROR_LETTER);
    }

    /**
     * @param string $value
     *
     * @throws Sms4bException
     */
    public function setSentErrorEmailSetting(string $value): void
    {
        $this->setOption(self::SEND_ERROR_LETTER, $value);
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public function getDateForSendEmail(): string
    {
        return $this->getOption(self::DATE_FOR_SEND_EMAIL);
    }

    /**
     * @param \DateTime $date
     *
     * @throws Sms4bException
     */
    public function setDateForSendEmail(\DateTime $date): void
    {
        $date = \Bitrix\Main\Type\DateTime::createFromPhp($date)->toString();
        $this->setOption(self::DATE_FOR_SEND_EMAIL, $date);
    }

    /**
     * @throws Sms4bException
     */
    public function clearDateForSendEmail(): void
    {
        try {
            Option::delete(self::MODULE_NAME, ['name' => self::DATE_FOR_SEND_EMAIL]);
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_SET_CONFIG_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param string $variableName
     *
     * @return int
     * @throws Sms4bException
     */
    public function getSessionId(string $variableName): int
    {
        return (int)$this->getOption($variableName);
    }

    /**
     * @param string      $variableName
     * @param string      $value
     * @param string|null $site
     *
     * @throws Sms4bException
     */
    private function setOption(string $variableName, string $value, $site = ''): void
    {
        try {
            Option::set(self::MODULE_NAME, $variableName, $value, $site);
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_SET_CONFIG_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param string $variableName
     * @param string $site
     *
     * @return string
     * @throws Sms4bException
     */
    private function getOption(string $variableName, $site = null): string {
        try {
            if ($site === null) {
                $site = false;
            } elseif ($site === '') {
                $site = $this->getSiteId();
            }
            return Option::get(self::MODULE_NAME, $variableName, '', $site);
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_GET_CONFIG_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @return bool|string
     */
    private function getSiteId()
    {
        $site = '';

        if(\defined('ADMIN_SECTION') && ADMIN_SECTION === true) {
            $domain = str_replace('www.', '', $_SERVER['SERVER_NAME']);

            $GLOBALS['FILTER_logic'] = 'or';

            $rsSites = CSite::GetList(
                $by = 'sort',
                $order = 'desc',
                [
                    'DOMAIN'      => $domain,
                    'SERVER_NAME' => $domain
                ]
            );
            unset($GLOBALS['FILTER_logic']);

            if ($arSite = $rsSites->Fetch()) {
                $site = $arSite['ID'];
            }
        } else {
            $site = SITE_ID;
        }

        return empty($site) ? CSite::GetDefSite() : $site;
    }

    /**
     * @return string|void
     */
    public function getSiteIdDefault()
    {
        // Получить сайт по домену
        if ($siteId = $this->getSiteIdByDomain()) {
            return $siteId;
        }
        // Если выбран сайт по-умолчанию - возвражаем его ид. Несколько сайтов по-умолчанию быть не может или 1 или не один не выбран.
        if ($siteId = CSite::GetDefSite()) {
            return $siteId;
        }
        // Если папка сайта === '/' - возвращаем его ид
        if ($siteId = $this->getSiteIdByRootDirectory()) {
            return $siteId;
        }
        // Проверяем сортировку - если разные ориентируемя на минимальную
        if ($siteId = $this->getSiteIdBySort()) {
            return $siteId;
        }
        // Если все предыдущие не дали выбрать сайт - берем id сайта по алфавиту
        if ($siteId = $this->getSiteIdByIdFirstAlphabetically()) {
            return $siteId;
        }
    }

    /**
     * Получение ID сайта по домену
     *
     * @return string
     */
    private function getSiteIdByDomain() : string
    {
        $site = '';

        if (\defined('ADMIN_SECTION') && ADMIN_SECTION === true) {
            $domain = str_replace('www.', '', $_SERVER['SERVER_NAME']);

            $GLOBALS['FILTER_logic'] = 'or';

            $rsSites = CSite::GetList(
                $by = 'sort',
                $order = 'asc',
                [
                    'DOMAIN'      => $domain,
                    'SERVER_NAME' => $domain
                ]
            );
            unset($GLOBALS['FILTER_logic']);

            if ($arSite = $rsSites->Fetch()) {
                $site = $arSite['ID'];
            }
        } else {
            $site = SITE_ID;
        }

        return $site;
    }

    /**
     * Получение ID сайта по папке сайта '/'
     *
     * @return string
     */
    private function getSiteIdByRootDirectory() : string
    {
        $site = '';

        $rsSites = CSite::GetList($by='sort', $order='desc', ['ACTIVE' => 'Y', 'IN_DIR' => '/']);
        $arSite = $rsSites->Fetch();
        if ($arSite) {
            $site = $arSite['ID'];
        }

        return $site;
    }

    /**
     *  Получение ID сайта по сортировке - берем самое меньшее значение
     *
     * @return string
     */
    private function getSiteIdBySort() : string
    {
        $site = '';
        $arSites = [];
        $rsSites = CSite::GetList($by = 'sort', $order = 'asc', ['ACTIVE' => 'Y']);
        $i = 0;
        while ($arSite = $rsSites->Fetch()) {
            $arSites[$i]['ID'] = $arSite['ID'];
            $arSites[$i]['SORT'] = $arSite['SORT'];
            $i++;
        }

        if ($arSites[0]['SORT'] !== $arSites[1]['SORT']) {
            $site = $arSites[0]['ID'];
        }

        return $site;
    }

    /**
     * Получение ID сайта - берем первое по алфавиту ID сайта
     *
     * @return string
     */
    private function getSiteIdByIdFirstAlphabetically() : string
    {
        $site = '';
        $rsSites = CSite::GetList($by = 'ID', $order = 'asc', ['ACTIVE' => 'Y']);

        if ($arSite = $rsSites->Fetch()) {
            $site = $arSite['ID'];
        }

        return $site;
    }

    /**
     * Проверяем есть ли сайт с такой SITE_ID.
     * @param string $siteId
     *
     * @return bool
     */
    public function isSiteExists(string $siteId) : bool
    {
        $rsSites = CSite::GetByID($siteId);
        if ($rsSites->Fetch() === false) {
            return false;
        }
        return true;
    }
}
