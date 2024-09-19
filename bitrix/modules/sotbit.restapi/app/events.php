<?php

declare(strict_types=1);

use Symfony\Component\EventDispatcher\EventDispatcher;
use Sotbit\RestAPI\EventDispatcher\Subscribers;
use Sotbit\RestAPI\Core\Helper;
use Psr\Container\ContainerInterface;

return static function (ContainerInterface $container): void {

    $eventDispatcher = $container->get('event_dispatcher');

    /**
     * Order events subscriber
     */
    $eventDispatcher->addSubscriber(new Subscribers\OrderSubscriber());

    /**
     * User events subscriber
     */
    $eventDispatcher->addSubscriber(new Subscribers\UserSubscriber());

    /**
     * Support events subscriber
     */
    $eventDispatcher->addSubscriber(new Subscribers\SupportSubscriber());

    /**
     * Get help events subscriber
     */
    $eventDispatcher->addSubscriber(new Subscribers\RouterSubscriber());
};