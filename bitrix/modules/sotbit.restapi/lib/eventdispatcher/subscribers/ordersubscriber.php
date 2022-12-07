<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Subscribers;

use Bitrix\Main;
use Sotbit\RestAPI\Localisation as l;
use Symfony\Contracts\EventDispatcher\Event;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Sotbit\RestAPI\EventDispatcher\Events\OrderEvent;
use Sotbit\RestAPI\Exception\EventException;

/**
 * Class OrderSubscriber
 *
 * @package Sotbit\RestAPI\EventDispatcher\Subscribers
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 09.10.2020
 */
class OrderSubscriber extends BaseSubscriber
{
    public static function getSubscribedEvents(): array
    {
        return [
            OrderEvent::BEFORE        => 'onOrderGetBefore',
            OrderEvent::AFTER         => 'onOrderGetAfter',
            OrderEvent::DETAIL_BEFORE => 'onOrderGetDetailBefore',
            OrderEvent::DETAIL_AFTER  => 'onOrderGetDetailAfter',
        ];
    }

    public function onOrderGetBefore(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onOrderGetAfter(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }


    public function onOrderGetDetailBefore(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }

    public function onOrderGetDetailAfter(Event $event): void
    {
        $this->eventExecute($event, __FUNCTION__);
    }
}