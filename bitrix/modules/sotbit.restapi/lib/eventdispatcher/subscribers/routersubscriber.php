<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Subscribers;

use Bitrix\Main;
use Symfony\Contracts\EventDispatcher\Event;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Sotbit\RestAPI\EventDispatcher\Events\RouterEvent;
use Sotbit\RestAPI\Exception\EventException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class RouterSubscriber
 *
 * @package Sotbit\RestAPI\EventDispatcher\Subscribers
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 25.11.2020
 */
class RouterSubscriber extends BaseSubscriber
{
    public static function getSubscribedEvents(): array
    {
        return [
            RouterEvent::AFTER_GET => 'onRouterAfterGet',
        ];
    }

    public function onRouterAfterGet(Event $event): void
    {
        $bxEvent = new Main\Event(\SotbitRestAPI::MODULE_ID, __FUNCTION__, ['VALUES' => $event->getValues()]);

        $bxEvent->send();
        if($bxEvent->getResults()) {
            $routers = [];

            foreach($bxEvent->getResults() as $evenResult) {
                if((int)$evenResult->getResultType() === Main\EventResult::SUCCESS) {
                    $routers = array_merge($routers, $evenResult->getParameters());
                } else {
                    throw new EventException(l::get('ERROR_EVENT'), 400);
                }
            }

            $event->setValues($routers);
        }
    }

}