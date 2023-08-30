<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings;

use \Bitrix\Main\Localization\Loc;
use Bitrix\Main\EventManager;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;
use Rarus\Sms4b\RemoteService;
use Rarus\Sms4b\Sendings\SendingInQueue;
use Rarus\Sms4b\RemoteService\Methods\GroupSMS;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Debug;
use Rarus\Sms4b\Encoding;
use Rarus\Sms4b\Exceptions\Sms4bException;

class Transport
{
    /**
     * Промежуток времени (часы) между датой начала отложенной отправки и временем когда рассылка передается на сервис
     */
    private const TIME_BEFORE_TRANSFER_SENDING_TO_SERVICE = 6;
    /**
     * @var RemoteService\Service
     */
    private $remoteService;
    /**
     * @var SendingInQueue\Repository
     */
    private $repository;
    /**
     * @var Config\Service
     */
    private $config;
    /**
     * @var Debug\Service
     */
    private $debug;
    /**
     * @var Encoding\Service
     */
    private $encoding;

    public function __construct()
    {
        $this->remoteService = new RemoteService\Service();
        $this->repository = new SendingInQueue\Repository();
        $this->config = new Config\Service();
        $this->debug = new Debug\Service();
        $this->encoding = new Encoding\Service();
    }

    /**
     * @param SendingInQueue\SendingInQueue $sending
     *
     * @return RemoteService\Methods\GroupSMS\Response
     * @throws Sms4bException
     */
    private function sendSending(SendingInQueue\SendingInQueue $sending): RemoteService\Methods\GroupSMS\Response
    {
        return $this->remoteService->GroupSMS(
            $sending->getGroupId(),
            $sending->getSender(),
            null,
            null,
            $sending->getActualDate(),
            $sending->getStartDate(),
            $sending->getAllowedDeliveryInterval(),
            $sending->getMessages()
        );
    }

    /**
     * The method must be static because it is called statically in the kernel
     *
     * @param int $sendingId
     *
     * @throws Sms4bException
     */
    public static function processSendingEvent(int $sendingId): void
    {
        $transport = new Transport();
        if ($transport->config->getModuleEnableSetting() === 'Y') {
            try {
                $sending = $transport->repository->getSendingBySendingId($sendingId);
                if ($transport->isNeededSendOnHit($sending)) {
                    $transport->remoteService->openConnectToService($sending->getSendingSource());
                    $transport->processSending($sending);
                    $transport->remoteService->closeConnect();
                }
            } catch (Sms4bRepositoryException $e) {
                throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
            }
        } else {
            $transport->debug->writeToLogFile(Loc::getMessage('SMS4B_MAIN_NO_ENABLED'));
        }
    }

    /**
     * @param SendingInQueue\SendingInQueue $sending
     *
     * @return bool
     * @throws Sms4bException
     */
    private function isNeededSendOnHit(SendingInQueue\SendingInQueue $sending): bool
    {
        $sendOnAgent = $this->config->getSendOnAgentSetting();
        if ($sendOnAgent === 'Y') {
            return false;
        } else {
            if ($this->isDelayedSending($sending->getStartDate())) {
                return false;
            }
            return true;
        }
    }

    /**
     * @param \DateTime|null $dateStart
     *
     * @return bool
     */
    private function isDelayedSending(?\DateTime $dateStart): bool
    {
        if ($dateStart === null) {
            return false;
        }

        if ($dateStart >= (new \DateTime('now'))->add(
                new \DateInterval('PT' . self::TIME_BEFORE_TRANSFER_SENDING_TO_SERVICE . 'H'))
        ) {
            return true;
        }
        return false;
    }

    /**
     * @throws Sms4bException
     */
    public function sendSendingsInBackground(): void
    {
        if ($this->config->getModuleEnableSetting() === 'Y') {
            $amount = $this->config->getAmountForSendAtOnce();

            while ($amount !== 0) {
                try {
                    $sendingsSource = $this->repository->getSourcesFromNotSend();

                    if(count($sendingsSource) === 0) {
                        break;
                    }
                    foreach ($sendingsSource as $source) {
                        $sendingInQueue = $this->repository->getNotSendWithSource($source);
                        $this->remoteService->openConnectToService($source);
                        foreach ($sendingInQueue as $sending) {
                            if ($this->isDelayedSending($sending->getStartDate())) {
                                continue;
                            }
                            $this->processSending($sending);
                        }
                        $this->remoteService->closeConnect();
                    }
                    $amount--;
                } catch (Sms4bRepositoryException $e) {
                    throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
                }
            }
        } else {
            $this->debug->writeToLogFile(Loc::getMessage('SMS4B_MAIN_NO_ENABLED'));
        }
    }

    /**
     * @param SendingInQueue\SendingInQueue $sending
     *
     * @throws Sms4bException
     * @throws Sms4bRepositoryException
     */
    private function processSending(SendingInQueue\SendingInQueue $sending): void
    {
        $response = $this->sendSending($sending);
        $sending = $this->processResponse($response, $sending);
        $this->repository->save($sending);
    }

    /**
     * @param GroupSMS\Response             $response
     * @param SendingInQueue\SendingInQueue $sending
     *
     * @return SendingInQueue\SendingInQueue
     *
     * @throws Sms4bRepositoryException
     */
    private function processResponse(
        GroupSMS\Response $response,
        SendingInQueue\SendingInQueue $sending
    ): SendingInQueue\SendingInQueue {
        $status = new SendingInQueue\Message\Status(SendingInQueue\Message\Status::PROCESSED);
        if (!$response->isSuccess()) {
            $this->remoteService->setLastError($response->getState()->getDescription());

            if ($sending->getGroupId() === 0 && $response->getGroup() > 0) {
                $sending->setGroupId($response->getGroup());
            }
            $arGuids = [];
            foreach ($sending->getMessages() as $message) {
                $message->setResult($response->getState()->getCode());
                $message->setStatusInQueue($status);
                $arGuids[] = $message->getGuid();
            }

            $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'RejectedPackage');
            foreach ($arEvents as $arEvent) {
                ExecuteModuleEventEx($arEvent, [
                    $sending->getSendingId(),
                    '[' . $response->getState()->getCode() . '] ' . $response->getState()->getDescription(), $arGuids
                ]);
            }
        } else {
            $arResult = $response->resultToArray();
            $arGuids = array_keys($arResult);

            if ($sending->getGroupId() === 0) {
                //обновить groupId для всей рассылки
                $allSending = $this->repository->getSendingBySendingId($sending->getSendingId());
                $allSending->setGroupId($response->getGroup());
                $this->repository->save($allSending);

                $sending->setGroupId($response->getGroup());
            }
            $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'PackageTransferred');
            foreach ($arEvents as $arEvent) {
                ExecuteModuleEventEx($arEvent, [$sending->getSendingId(), $arGuids]);
            }
            foreach ($sending->getMessages() as $message) {

                $message->setStatusInQueue($status);
                if ($arResult[$message->getGuid()] <= 0) {
                    $message->setResult($arResult[$message->getGuid()]);

                    $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'RejectedPackage');
                    foreach ($arEvents as $arEvent) {
                        ExecuteModuleEventEx($arEvent,
                            [$sending->getSendingId(), '[' . $arResult[$message->getGuid()] . ']', [$message->getGuid()]]);
                    }

                }
            }
        }

        return $sending;
    }
}