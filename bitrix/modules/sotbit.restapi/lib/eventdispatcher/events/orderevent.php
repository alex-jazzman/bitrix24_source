<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Events;

class OrderEvent extends BaseEvent
{
    public const BEFORE = 'order.get.before';
    public const AFTER = 'order.get.after';
    public const DETAIL_BEFORE = 'order.get.detail.before';
    public const DETAIL_AFTER = 'order.get.detail.after';
}
