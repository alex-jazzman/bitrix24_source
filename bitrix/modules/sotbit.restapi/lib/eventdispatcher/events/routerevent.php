<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Events;

class RouterEvent extends BaseEvent
{
    public const AFTER_GET = 'router.after.get';
}
