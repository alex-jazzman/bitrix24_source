<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Event;

use Sotbit\RestAPI\Service\Event\Base;
use Symfony\Component\EventDispatcher\EventDispatcher;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class EventService extends Base
{
    public function addListener(string $eventName, $listener, int $priority = 0)
    {
        $this->eventDispatcher->addListener($eventName, $listener, $priority);
    }

    public function dispatch(object $event, string $eventName = null)
    {
        return $this->eventDispatcher->dispatch($event, $eventName);
    }

    public function addSubscriber(EventSubscriberInterface $subscriber)
    {
        return $this->eventDispatcher->addSubscriber($subscriber);
    }
}