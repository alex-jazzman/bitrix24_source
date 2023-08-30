<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings;

use Bitrix\Main\EventManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\PageNavigation;
use Rarus\Sms4b\Sendings\Messages;
use Rarus\Sms4b\RemoteService;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Exceptions\Sms4bException;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;

class Service
{
    /**
     * @var RemoteService\Service
     */
    private $remoteService;
    /**
     * @var Messages\Repository
     */
    private $repository;
    /**
     * @var Repository
     */
    private $sendingRepository;
    /**
     * @var Config\Service
     */
    private $config;


    public function __construct()
    {
        $this->remoteService = new RemoteService\Service();
        $this->repository = new Messages\Repository();
        $this->sendingRepository = new Repository();
        $this->config = new Config\Service();
    }

    /**
     * @throws Sms4bException
     */
    public function processLoadStatus(): void
    {
        try {
            if ($this->config->getModuleEnableSetting() === 'Y') {
                $collection = $this->repository->getWithoutFinalStatus();

                if ($collection->count() > 0) {
                    $arGuids = $this->getGuidsFromCollection($collection);
                    $this->remoteService->openConnectToService();
                    $response = $this->remoteService->CheckSMS($arGuids);

                    if ($response->isSuccess()) {
                        $this->updateMessageStatus($response, $collection);
                    } else {
                        throw new Sms4bException(Loc::getMessage('SMS4B_REMOTE_SERVICE_ERROR',
                            ['#CODE#' => $response->getState()->getCode()]));
                    }
                }
            }
        } catch (\Exception $e) {
            throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * @param array               $filter
     * @param PageNavigation|null $nav
     * @param array               $order
     *
     * @return Collection
     * @throws Sms4bException
     */
    public function getSendingsByFilter(array $filter, ?PageNavigation $nav = null, array $order = []): Collection
    {
        try {
            return $this->sendingRepository->getByFilter($filter, $nav, $order);
        } catch (Sms4bRepositoryException $e) {
            throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * The method must be static because it is called statically in the kernel
     *
     * @param int    $sendingId
     * @param string $result
     * @param array  $guids
     *
     * @throws Sms4bException
     */
    public static function processRejectedPackageEvent(int $sendingId, string $result, array $guids): void
    {
        try {
            $status = new Messages\Status(Messages\Status::STATUS_REJECTED);
            $repository = new Repository();
            $sending = $repository->getSendingByIdAndGuids($sendingId, $guids);
            if ($sending instanceof Sending) {
                foreach ($sending->getMessages() as $message) {
                    /**
                     * @var Messages\Message $message
                     */
                    $message->setLastModified(new \DateTime('now'));
                    $message->setResult($result);
                    $message->setStatus($status);
                }
                $repository->save($sending);
            }

        } catch (Sms4bRepositoryException $e) {
            throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * The method must be static because it is called statically in the kernel
     *
     * @param int   $sendingId
     * @param array $arGuids
     *
     * @throws Sms4bException
     */
    public static function processPackageTransferredEvent(int $sendingId, array $arGuids): void
    {
        try {
            $status = new Messages\Status(Messages\Status::IN_PROCESS);

            //обработчик вызывается статически, поэтому использовать $this не получится
            $sendingRepository = new Repository();
            $sending = $sendingRepository->getSendingByIdAndGuids($sendingId, $arGuids);
            if ($sending instanceof Sending) {
                foreach ($sending->getMessages() as $message) {
                    /**
                     * @var Messages\Message $message
                     */
                    $message->setLastModified(new \DateTime('now'));
                    $message->setStatus($status);
                }
                $sendingRepository->save($sending);
            }
        } catch (Sms4bRepositoryException $e) {
            throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * @param Messages\Collection $collection
     *
     * @return array
     */
    private function getGuidsFromCollection(Messages\Collection $collection): array
    {
        $arGuids = [];
        /**
         * @var Messages\Message $item
         */
        foreach ($collection as $item) {
            $arGuids[] = $item->getGuid();
        }

        return $arGuids;
    }

    /**
     * @param RemoteService\Methods\CheckSMS\Response $response
     * @param Messages\Collection                     $messages
     *
     * @throws \Exception
     */
    private function updateMessageStatus(
        RemoteService\Methods\CheckSMS\Response $response,
        Messages\Collection $messages
    ): void {
        $arResult = $response->resultToArray();

        foreach ($messages as $message) {
            /**
             * @var Messages\Message $message
             */
            $message->setLastModified(new \DateTime('now'));
            $status = new Messages\Status($this->parseStatusCode($arResult[$message->getGuid()]));
            $message->setStatus($status);
            if (Messages\Status::isFinalStatus($message->getStatus()->getStatus())) {
                $messageForEvent = clone $message;
                $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'FinalStatus');
                foreach ($arEvents as $arEvent) {
                    ExecuteModuleEventEx($arEvent,
                        [$messageForEvent, $messageForEvent->getStatus()]);
                }
            }
        }

        $this->repository->save($messages);
    }

    /**
     * @param int $code
     *
     * @return int
     */
    private function parseStatusCode(int $code): int
    {
        if ($code < 0) {
            return Messages\Status::IN_PROCESS;
        }

        $countPasts = $code & 255;
        $deliveredParts = (($code - $countPasts) / 256) & 255;

        if (!$this->isFinalStatus($code)) {
            $status = Messages\Status::IN_PROCESS;
        } else {
            if ($countPasts === $deliveredParts) {
                $status = Messages\Status::STATUS_SEND;
            } else {
                $status = Messages\Status::NOT_SEND;
            }
        }

        return $status;
    }

    /**
     * @param int $code
     *
     * @return bool
     */
    private function isFinalStatus(int $code): bool
    {
        return ($code & 65536) === 65536;
    }
}