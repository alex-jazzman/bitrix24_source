<?php

declare(strict_types=1);

use Sotbit\RestAPI\Service\User\UserService;
use Sotbit\RestAPI\Service\Order;
use Sotbit\RestAPI\Service\Support;
use Sotbit\RestAPI\Service\Event;
use Psr\Container\ContainerInterface;
use Sotbit\RestAPI\Core\Helper;

$container['event_service'] = static function(
    ContainerInterface $container
): Event\EventService {
    return new Event\EventService(
        $container->get('event_dispatcher')
    );
};

$container['user_service'] = static function(
    ContainerInterface $container
): UserService {
    return new UserService(
        $container->get('user_repository')
    );
};


$container['find_order_service'] = static function(
    ContainerInterface $container
): Order\Find {
    return new Order\Find(
        $container->get('order_repository')
    );
};

$container['create_order_service'] = static function(
    ContainerInterface $container
): Order\Create {
    return new Order\Create(
        $container->get('order_repository')
    );
};

$container['update_order_service'] = static function(
    ContainerInterface $container
): Order\Update {
    return new Order\Update(
        $container->get('order_repository')
    );
};


$container['find_support_service'] = static function(
    ContainerInterface $container
): Support\Find {
    return new Support\Find(
        $container->get('support_repository')
    );
};

$container['create_support_service'] = static function(
    ContainerInterface $container
): Support\Create {
    return new Support\Create(
        $container->get('support_repository')
    );
};

$container['update_support_service'] = static function(
    ContainerInterface $container
): Support\Update {
    return new Support\Update(
        $container->get('support_repository')
    );
};

/*$container['delete_support_service'] = static function (
    ContainerInterface $container
): Support\Delete {
    return new Support\Delete(
        $container->get('support_repository'),
    );
};*/

/**
 * Include custom services from file
 */
if(Helper::checkCustomFile(basename(__FILE__))) {
    require Helper::checkCustomFile(basename(__FILE__));
}