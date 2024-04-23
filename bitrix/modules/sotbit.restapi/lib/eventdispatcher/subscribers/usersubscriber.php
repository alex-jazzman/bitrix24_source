<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Subscribers;

use Symfony\Contracts\EventDispatcher\Event;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Sotbit\RestAPI\EventDispatcher\Events\UserEvent;

class UserSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            UserEvent::BEFORE => 'onUserBeforeGet',
            UserEvent::AFTER  => 'onUserAfterGet',
        ];
    }

    public function onBeforeGet(Event $event): void
    {
    }

    public function onAfterGet(Event $event): void
    {
    }

}