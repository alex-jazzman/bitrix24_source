<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Incoming;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\PageNavigation;
use Rarus\Sms4b\RemoteService;
use Bitrix\Main\EventManager;
use Rarus\Sms4b\Exceptions\Sms4bException;
use Rarus\Sms4b\Config;
use Rarus\Sms4b\Address;
use \Rarus\Sms4b\Exceptions\Sms4bRepositoryException;

class Service
{
    /**
     * @var RemoteService\Service
     */
    private $remoteService;
    /**
     * @var Repository
     */
    private $repository;
    /**
     * @var Config\Service
     */
    private $config;
    /**
     * @var Address\Service
     */
    private $addressService;

    public function __construct()
    {
        $this->remoteService = new RemoteService\Service();
        $this->repository = new Repository();
        $this->config = new Config\Service();
        $this->addressService = new Address\Service();
    }

    /**
     * @throws Sms4bException
     */
    public function processLoadIncoming(): void
    {
        try {
            if ($this->config->getModuleEnableSetting() === 'Y' && $this->addressService->hasAccountDigitNumber()) {
                $lastIncomingLoad = new \DateTime($this->config->getLoadIncomingFrom());
                $response = $this->remoteService->LoadSMS($lastIncomingLoad, 1);

                if ($response->isSuccess()) {
                    foreach ($response->getLoadSmsCollection() as $loadSms) {
                        $incoming = Incoming::createInstanceFromDto($loadSms);
                        $this->repository->save($incoming);

                        $lastIncomingLoad = $incoming->getMoment();
                        $lastIncomingLoad->modify('+1 second');

                        $incomingForEvent = clone $incoming;

                        $arEvents = EventManager::getInstance()->findEventHandlers('rarus.sms4b', 'LoadIncoming');
                        foreach ($arEvents as $arEvent) {
                            ExecuteModuleEventEx($arEvent, [$incomingForEvent]);
                        }
                    }
                    $this->config->setLoadIncomingFrom($lastIncomingLoad);
                } else {
                    throw new Sms4bException(Loc::getMessage('SMS4B_REMOTE_SERVICE_ERROR',
                        ['#CODE#' => $response->getState()->getCode()]));
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
    public function getIncomingByFilter(array $filter, ?PageNavigation $nav = null, array $order = []): Collection
    {
        try {
            return $this->repository->getByFilter($filter, $nav, $order);
        } catch (Sms4bRepositoryException $e) {
            throw new Sms4bException($e->getMessage(), $e->getCode(), $e);
        }
    }
}