<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Subscribers;

use Symfony\Contracts\EventDispatcher\Event;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Sotbit\RestAPI\EventDispatcher\Events\SupportEvent;

class SupportSubscriber extends BaseSubscriber
{
    public static function getSubscribedEvents(): array
    {
        return [
            SupportEvent::TICKET_BEFORE_GET => 'onTicketGetBefore',
            SupportEvent::TICKET_AFTER_GET  => 'onTicketGetAfter',

            SupportEvent::TICKET_BEFORE_GET_DETAIL => 'onTicketGetDetailBefore',
            SupportEvent::TICKET_AFTER_GET_DETAIL  => 'onTicketGetDetailAfter',

            SupportEvent::MESSAGE_BEFORE_GET => 'onTicketMessageGetBefore',
            SupportEvent::MESSAGE_AFTER_GET  => 'onTicketMessageGetAfter',

            SupportEvent::TICKET_OPEN  => 'onTicketOpen',
            SupportEvent::TICKET_CLOSE => 'onTicketClose',
        ];
    }

    public function onTicketGetBefore(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketGetAfter(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketGetDetailBefore(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketGetDetailAfter(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketMessageGetBefore(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketMessageGetAfter(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketOpen(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onTicketClose(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

}