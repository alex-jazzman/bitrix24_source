<?php

declare(strict_types=1);

use Sotbit\RestAPI\EventDispatcher\Subscribers;
use Sotbit\RestAPI\Core\Helper;
use Symfony\Component\EventDispatcher\EventDispatcher;

/**
 * Events
 *
 * @link https://symfony.com/doc/current/components/event_dispatcher.html
 * @return EventDispatcher
 */
$container['event_dispatcher'] = static function(): EventDispatcher {
    return new EventDispatcher();
};


/**
 * Order events subscriber
 */
$container['event_dispatcher']->addSubscriber(new Subscribers\OrderSubscriber());

/**
 * User events subscriber
 */
$container['event_dispatcher']->addSubscriber(new Subscribers\UserSubscriber());

/**
 * Support events subscriber
 */
$container['event_dispatcher']->addSubscriber(new Subscribers\SupportSubscriber());

/**
 * Get help events subscriber
 */
$container['event_dispatcher']->addSubscriber(new Subscribers\RouterSubscriber());

/**
 * Include custom dependencies from file
 */
if(Helper::checkCustomFile(basename(__FILE__))) {
    require Helper::checkCustomFile(basename(__FILE__));
}