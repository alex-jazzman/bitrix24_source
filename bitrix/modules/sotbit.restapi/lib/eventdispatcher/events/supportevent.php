<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Events;

class SupportEvent extends BaseEvent
{
    public const TICKET_BEFORE_GET = 'support.ticket.get.before';
    public const TICKET_AFTER_GET = 'support.ticket.get.after';

    public const TICKET_BEFORE_GET_DETAIL = 'support.ticket.get.detail.before';
    public const TICKET_AFTER_GET_DETAIL = 'support.ticket.get.detail.after';

    public const MESSAGE_BEFORE_GET = 'support.message.get.before';
    public const MESSAGE_AFTER_GET = 'support.message.get.after';

    public const TICKET_OPEN = 'support.ticket.open';
    public const TICKET_CLOSE = 'support.ticket.close';
}