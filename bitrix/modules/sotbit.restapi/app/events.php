<?php

declare(strict_types=1);

use Sotbit\RestAPI\EventDispatcher\Subscribers;
use Sotbit\RestAPI\Core\Helper;

/**
 * Order events subscriber
 */
$container['event_service']->addSubscriber(new Subscribers\OrderSubscriber());

/**
 * User events subscriber
 */
$container['event_service']->addSubscriber(new Subscribers\UserSubscriber());

/**
 * Support events subscriber
 */
$container['event_service']->addSubscriber(new Subscribers\SupportSubscriber());

/**
 * Get help events subscriber
 */
$container['event_service']->addSubscriber(new Subscribers\RouterSubscriber());

/**
 * Include custom dependencies from file
 */
if(Helper::checkCustomFile(basename(__FILE__))) {
    require Helper::checkCustomFile(basename(__FILE__));
}