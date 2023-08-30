<?php

namespace Rarus\Sms4b\Template;

use Bitrix\Main\Localization\Loc;
use CEventMessage;
use COption;
use CSite;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Service
{
    private const USER_PREFIX = 'SMS4B_';
    private const ADMIN_PREFIX = 'SMS4B_ADMIN_';

    private $config;

    public function __construct()
    {
        $this->config = new Config\Service();
    }

    /**
     * @param string $mailEvent
     * @param string $siteId
     *
     * @return array
     * @throws Sms4bException
     */
    public function getUserTemplate(string $mailEvent, $siteId): array
    {
        $templateName = self::USER_PREFIX . $mailEvent;
        if (!$template = $this->getTemplateByName($templateName, $siteId)) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPLATE_NOT_FOUND_ERROR',
                ['#TEMPLATE#' => $templateName]));
        }
        return $template;
    }

    /**
     * @param string $mailEvent
     * @param string $siteId
     *
     * @return array
     * @throws Sms4bException
     */
    public function getAdminTemplate(string $mailEvent, $siteId): array
    {
        $templateName = self::ADMIN_PREFIX . $mailEvent;
        if (!$template = $this->getTemplateByName($templateName, $siteId)) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPLATE_NOT_FOUND_ERROR',
                ['#TEMPLATE#' => $templateName]));
        }

        return $template;
    }

    /**
     * @param string $mailEvent
     * @param string $siteId
     * @param string $from
     *
     * @return array
     * @throws Sms4bException
     */
    public function getCustomSmsTemplate(string $mailEvent, string $siteId, string $from = ''): array
    {
        if (!$template = $this->getTemplateByName($mailEvent, $siteId, $from)) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPLATE_NOT_FOUND_ERROR',
                ['#TEMPLATE#' => $mailEvent]));
        }
        return $template;
    }

    /**
     * @param string $mailEvent
     * @param string $siteId
     * @param string $from
     *
     * @return array
     * @throws Sms4bException
     */
    public function getTemplateForSmsEvent(string $mailEvent, $siteId, string $from): array
    {
        $templateName = self::USER_PREFIX . $mailEvent;
        if (!$template = $this->getTemplateByName($templateName, $siteId, $from)) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPLATE_NOT_FOUND_ERROR',
                ['#TEMPLATE#' => $templateName]));
        }

        return $template;
    }

    /**
     * @param string $mailEvent
     * @param        $siteId
     * @param string $from
     *
     * @return array
     * @throws Sms4bException
     */
    public function findTemplateForSmsEvent(string $mailEvent, $siteId, string $from): array
    {
        return $this->getTemplateByName(self::USER_PREFIX . $mailEvent, $siteId, $from);
    }

    /**
     * @param int $templateId
     *
     * @return string
     * @throws Sms4bException
     */
    public function getTemplateTextById($templateId): string
    {
        try {
            $text = \Bitrix\Main\Mail\Internal\EventMessageTable::getList([
                'select' => ['*'],
                'filter' => ['=ID' => $templateId]
            ]);

            $res = $text->fetch();

        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPTALE_ERROR'), $e->getCode(), $e);
        }

        if (!$text = $res['MESSAGE']) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPLATE_NOT_FOUND_BY_ID',
                ['#TEMPLATE_ID#' => $templateId]));
        }
        return $res['MESSAGE'];
    }

    /**
     * @param string $pattern
     * @param string $siteId
     *
     * @return array
     * @throws Sms4bException
     */
    public function getAllSmsTemplate(string $pattern, string $siteId): array
    {
        try {
            $arMess = [];
            $pattern = !empty($pattern) ? $pattern : 'SMS4B_%';
            $arFilter = ['TYPE_ID' => $pattern];
            if (!empty($siteId)) {
                $arFilter['SITE_ID'] = $siteId;
            }
            $rsMess = CEventMessage::GetList($by = 'id', $order = 'asc', $arFilter);
            while ($res = $rsMess->Fetch()) {
                $arMess[$res['EVENT_NAME']][] = ['ID' => $res['ID'], 'NAME' => $res['SUBJECT']];
            }
            return $arMess;
        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPTALE_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * «амен€ет стандартные макросы в тексте
     * «амен€ет макросы по-умолчанию в тексте
     *
     * @param string $text - исходный текст дл€ замены
     *
     * @return string - “екст с замененными стандартными макросами
     */
    public function replaceDefaultMakros(string $text): string
    {
        $res = CSite::GetByID($this->config->getSiteIdDefault());
        $arRes = $res->Fetch();

        $text = str_replace('#DEFAULT_EMAIL_FROM#', COption::GetOptionString('main', 'email_from'), $text);
        $text = str_replace('#SITE_NAME#', $arRes['SITE_NAME'], $text);
        $text = str_replace('#SERVER_NAME#', $arRes['SERVER_NAME'], $text);
        return $text;
    }

    /**
     * @param string $templateName
     * @param string $siteId
     * @param string $from
     *
     * @return array
     * @throws Sms4bException
     */
    private function getTemplateByName(string $templateName, $siteId, $from = ''): array
    {
        try {
            $arFilter = [
                'ACTIVE'  => 'Y',
                'TYPE_ID' => $templateName,
                'SITE_ID' => $siteId,
            ];

            if (!empty($from)) {
                $arFilter['FROM'] = $from;
            }

            $rsMess = CEventMessage::GetList($by = 'site_id', $order = 'desc', $arFilter);

            return ($template = $rsMess->fetch()) ? $template : [];

        } catch (\Exception $e) {
            throw new Sms4bException(Loc::getMessage('SMS4B_TEMPLATE_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param string $template
     * @param array  $marcos
     *
     * @return string
     */
    public function fillInTemplateWithMacros(string $template, array $marcos): string
    {
        foreach ($marcos as $k => $value) {
            $template = str_replace('#' . $k . '#', (string)$value, $template);
        }

        return $this->replaceDefaultMakros($template);
    }
}