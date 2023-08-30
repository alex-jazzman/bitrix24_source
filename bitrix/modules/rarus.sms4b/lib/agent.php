<?php
declare(strict_types=1);

namespace Rarus\Sms4b;

use Bitrix\Main\Application;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\LoaderException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\SystemException;
use Csms4b;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;
use Rarus\Sms4b\Sendings;
use Rarus\Sms4b\Incoming;
use Rarus\Sms4b\Debug;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Sendings\Messages;
use Rarus\Sms4b\Template;
use Rarus\Sms4b\Exceptions\Sms4bException;
use Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError;
use Rarus\Sms4b\Encoding;
use Rarus\Sms4b\Forgottenbaskets\Service as Forgottenbaskets;

class Agent
{
    use DateTimeConverter;

    /**
     * @return string
     * @throws Sms4bException
     */
    public static function sendSms()
    {
        $transport = new Sendings\Transport();
        $debug = new Debug\Service();
        try {
            $transport->sendSendingsInBackground();
        } catch (Sms4bException $t) {
            $debug->writeToLogFile(Loc::getMessage('SMS4B_SEND_SMS_ERROR'));
            $debug->writeToLogFile($t->getMessage() . ' ' . $t->getFile() . ' ' . $t->getLine() . PHP_EOL);
        }
        return '\\Rarus\\Sms4b\\Agent::sendSms();';
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public static function loadStatus()
    {
        $loader = new Sendings\Service();
        $debug = new Debug\Service();
        try {
            $loader->processLoadStatus();
        } catch (Sms4bException $t) {
            $debug->writeToLogFile(Loc::getMessage('SMS4B_LOAD_SMS_ERROR'));
            $debug->writeToLogFile($t->getMessage() . ' ' . $t->getFile() . ' ' . $t->getLine() . PHP_EOL);
        }
        return '\\Rarus\\Sms4b\\Agent::loadStatus();';
    }

    /**
     * @return string
     * @throws Sms4bException
     */
    public static function loadIncoming()
    {
        $incoming = new Incoming\Service();
        $debug = new Debug\Service();
        try {
            $incoming->processLoadIncoming();
        } catch (Sms4bException $e) {
            $debug->writeToLogFile(Loc::getMessage('SMS4B_LOAD_INCOMING_ERROR'));
            $debug->writeToLogFile($e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine() . PHP_EOL);
        }
        return '\\Rarus\\Sms4b\\Agent::loadIncoming();';
    }

    /**
     * Перехватчик deadline по задачам
     *
     * @return string - вызов самого себя (для агента)
     * @throws ArgumentException - Исключения переданных аргументов
     * @throws LoaderException - Исключение подключения модуля
     * @throws ObjectPropertyException
     * @throws Sms4bException
     * @throws SystemException
     */
    public static function taskDeadline()
    {
        $sms4b = new Csms4b();
        $config = new Config\Service();
        $sender = new Sendings\Sender();
        $templateService = new Template\Service();

        if (\Bitrix\Main\Loader::includeModule('tasks')
            && $sms4b->GetCurrentOption('intercept_deadline', SITE_ID) === 'Y'
        ) {
            $lastDead = $sms4b->GetCurrentOption('deadline_date', SITE_ID);
            $sms4b->sms4bLog(Loc::getMessage('SMS4B_MAIN_START_SEARCH_DEADLINE') . \Bitrix\Main\Type\DateTime::createFromTimestamp((int)$lastDead)->toString());

            if (empty($lastDead)) {
                $config->setDeadlineDate(time());
                $lastDead = time();
            }
            $obLastDead = \Bitrix\Main\Type\DateTime::createFromTimestamp($lastDead);

            $result = \Bitrix\Tasks\TaskTable::getList([
                'select' => ['*'],
                'filter' => [
                    '>DEADLINE'   => $obLastDead,
                    '<DEADLINE'   => \Bitrix\Main\Type\DateTime::createFromTimestamp(time()),
                    'CLOSED_DATE' => null,
                    '=ZOMBIE'     => 'N'
                ]
            ]);

            while ($res = $result->Fetch()) {
                if ($sms4b->checkGroupPerm($res['GROUP_ID'])) {
                    $sms4b->sms4bLog(Loc::getMessage('SMS4B_MAIN_SEARCH_DEADLINE_STEP') . '"' . $res['TITLE'] . '"');

                    $responsible = $sms4b->SearchUserPhone($res['RESPONSIBLE_ID']);

                    $sms4b->sms4bLog(Loc::getMessage('SMS4B_MAIN_RESPONS_ID') . $res['RESPONSIBLE_ID']);
                    $sms4b->sms4bLog(Loc::getMessage('SMS4B_MAIN_LOG_GET_PHONE') . $responsible);

                    try {
                        $template = $templateService->getUserTemplate('TASK_INTERCEPT_DEADLINE', SITE_ID);
                        $text = $templateService->fillInTemplateWithMacros($template['MESSAGE'], $res);

                        $sender->taskSendSms([$responsible => $text], $res['ID'], SITE_ID);
                        $config->setDeadlineDate(strtotime($res['DEADLINE']) + 1);
                    } catch (Sms4bException | Sms4bValidationError $t) {
                        $sms4b->sms4bLog(Loc::getMessage('SMS4B_SMS_SEND_ERROR', ['#ERROR#' => $t->getMessage()]));
                    }
                }
            }

            if (empty($text)) {
                $sms4b->sms4bLog(Loc::getMessage('SMS4B_MAIN_SEARCH_DEADLINE_EMPTY'));
            }

            $sms4b->sms4bLog(Loc::getMessage('SMS4B_MAIN_END_SEARCH_DEADLINE') . PHP_EOL);
        }
        return '\\Rarus\\Sms4b\\Agent::taskDeadline();';
    }

    /**
     * Агент переносит данные из таблицы b_sms4b в sms4b_sendings.
     * Когда все данные перенесены таблица b_sms4b и агент удаляются.
     *
     * @param int $id
     *
     * @return string
     * @throws Sms4bException
     * @throws \Bitrix\Main\Db\SqlQueryException
     */
    public static function migrationSendingTable($id = 1)
    {
        $connection = Application::getConnection();
        $result = $connection->query('SHOW TABLES LIKE \'b_sms4b\'')->fetch();
        if (empty($result)) {
            return '';
        }

        $sqlQuery = 'SELECT * FROM b_sms4b WHERE id >= ' . $id . ' LIMIT 500';
        $result = $connection->query($sqlQuery)->fetchAll();

        if (!empty($result)) {
            $repository = new Sendings\Repository();
            $debug = new Debug\Service();
            $encodeService = new Encoding\Service();

            $lastId = $id;
            foreach ($result as $array) {
                try {
                    $messages = new Messages\Collection();
                    if (!array_key_exists('Result', $array) || $array['Result'] > 0) {
                        $status = new Messages\Status(Messages\Status::STATUS_SEND);
                    } else {
                        $status = new Messages\Status(Messages\Status::STATUS_REJECTED);
                    }
                    if ($array['Sale_Order'] > 0) {
                        $source = Sendings\Source\Source::createSourceInstance(Sendings\Source\Sale::SALE);
                    } else {
                        $source = Sendings\Source\Source::createSourceInstance(Sendings\Source\Custom::CUSTOM);
                    }
                    if (LANG_CHARSET !== 'UTF-8') {
                        $text = html_entity_decode(mb_convert_encoding($array['TextMessage'], LANG_CHARSET,
                           'UTF-8'), ENT_COMPAT | ENT_HTML401, LANG_CHARSET);
                    } else {
                        $text = $array['TextMessage'];
                    }

                    list($encodeMessage, $encoding) = $encodeService->encodeMessage($text);
                    $messages->attach(new Messages\Message(
                        $array['Destination'],
                        $array['GUID'],
                        $encodeMessage,
                        $status,
                        $encoding,
                        (int)$array['Sale_Order'],
                        new \DateTime('now')
                    ));

                    $sending = new Sendings\Sending(
                        $array['SenderName'],
                        $messages,
                        empty($array['StartSend']) ? new \DateTime('now') : self::bitrixDateTimeToPhpDateTime($array['StartSend']),
                        $source,
                        empty($array['StartSend']) ? null : self::bitrixDateTimeToPhpDateTime($array['StartSend']),
                        empty($array['StartSend']) ? null : self::bitrixDateTimeToPhpDateTime($array['StartSend'])->add(new \DateInterval('PT6H')),
                        null,
                        $array['Events']
                    );
                    $repository->save($sending);
                } catch (\Throwable $t) {
                    $debug->writeToLogFile(Loc::getMessage('SMS4B_MIGRATION_ERROR', ['#GUID#' => $array['GUID']]));
                    $debug->writeToLogFile($t->getMessage() . ' ' . $t->getFile() . ' ' . $t->getLine() . PHP_EOL);
                }
                $lastId = $array['id'];
            }
            return '\\Rarus\\Sms4b\\Agent::migrationSendingTable(' . ($lastId + 1) . ');';
        } else {
            $connection->query('DROP TABLE  if exists b_sms4b');
            return '';
        }
    }

    /**
     * Очистка очереди рассылок. Удаляются только рассылки, которые переданы на сервис (или была попытка передачи)
     *
     * @return string
     * @throws Sms4bException
     */
    public static function clearSendingQueue()
    {
        $repository = new Sendings\SendingInQueue\Repository();
        $debug = new Debug\Service();
        try {
            $sendings = $repository->getTransferredSendings();
            foreach ($sendings as $sending) {
                foreach ($sending->getMessages() as $message) {
                    $repository->deleteElementById($message->getId());
                }
            }
        } catch (Sms4bException | Sms4bRepositoryException $t) {
            $debug->writeToLogFile(Loc::getMessage('SMS4B_CLEAN_QUEUE_ERROR'));
            $debug->writeToLogFile($t->getMessage() . ' ' . $t->getFile() . ' ' . $t->getLine());
        }
        return '\\Rarus\\Sms4b\\Agent::clearSendingQueue();';
    }

    /**
     *
     * @return string
     * @throws Sms4bException
     */
    public static function smsOnOrdersWithoutPayment()
    {
        $debug = new Debug\Service();
        try {
            $forgottenbaskets = new Forgottenbaskets();
            $arSite = $forgottenbaskets ->getArSiteId();
            foreach ($arSite as $siteId) {
                $arForgottenBaskets = $forgottenbaskets->getArForgottenBaskets($siteId);
                if(count($arForgottenBaskets) >= 1 ) {
                    foreach ($arForgottenBaskets as $number => $forgottenBasket) {
                        if ($forgottenBasket['active'] === 'Y') {
                            $forgottenbasketsOrders = $forgottenbaskets->getOrderData($forgottenBasket['minutes'], $siteId);
                            $forgottenbaskets->sendOrderData($forgottenbasketsOrders,
                                'SMS4B_SEND_FORGOTTEN_BASKETS_' . $number, $siteId);
                        }
                    }
                }
            }
        } catch (Sms4bException | Sms4bRepositoryException $t) {
            $debug->writeToLogFile(Loc::getMessage('SMS4B_CLEAN_QUEUE_ERROR'));
            $debug->writeToLogFile($t->getMessage() . ' ' . $t->getFile() . ' ' . $t->getLine());
        }

        return '\\Rarus\\Sms4b\\Agent::smsOnOrdersWithoutPayment();';
    }

}
