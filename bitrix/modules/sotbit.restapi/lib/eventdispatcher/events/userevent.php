<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Events;

class UserEvent extends BaseEvent
{
    public const BEFORE = 'user.get.before';
    public const AFTER = 'user.get.after';
}
