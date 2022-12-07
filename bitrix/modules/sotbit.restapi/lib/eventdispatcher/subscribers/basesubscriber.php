<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Subscribers;

use Bitrix\Main;
use Sotbit\RestAPI\Exception\EventException;
use Sotbit\RestAPI\Localisation as l;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Contracts\EventDispatcher\Event;

abstract class BaseSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents()
    {
    }

    public function eventExecute(Event $event, string $function): void
    {
        $bxEvent = new Main\Event(\SotbitRestAPI::MODULE_ID, $function, ['VALUES' => $event->getValues()]);

        $bxEvent->send();
        if($bxEvent->getResults()) {
            foreach($bxEvent->getResults() as $evenResult) {
                if((int)$evenResult->getResultType() === Main\EventResult::SUCCESS) {
                    $event->setValues($evenResult->getParameters());
                } else {
                    throw new EventException(l::get('ERROR_EVENT'), 400);
                }
            }
        }
    }
}