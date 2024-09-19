<?php

declare(strict_types=1);

use Symfony\Component\EventDispatcher\EventDispatcher;
use Sotbit\RestAPI\EventDispatcher\Subscribers;
use Sotbit\RestAPI\Core\Helper;

return [
    /**
     * Events
     *
     * @link https://symfony.com/doc/current/components/event_dispatcher.html
     * @return EventDispatcher
     */
    'event_dispatcher' => static fn(): EventDispatcher => new EventDispatcher(),
];