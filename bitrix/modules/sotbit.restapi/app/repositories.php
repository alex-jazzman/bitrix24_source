<?php

declare(strict_types=1);

use Sotbit\RestAPI\Repository\UserRepository;
use Sotbit\RestAPI\Repository\OrderRepository;
use Sotbit\RestAPI\Repository\SupportRepository;
use Psr\Container\ContainerInterface;
use Sotbit\RestAPI\Core\Helper;

$container['user_repository'] = static function(
    ContainerInterface $container
): UserRepository {
    return new UserRepository();
};

$container['order_repository'] = static function(
    ContainerInterface $container
): OrderRepository {
    return new OrderRepository();
};

$container['support_repository'] = static function(
    ContainerInterface $container
): SupportRepository {
    return new SupportRepository();
};

/**
 * Include custom repository from file
 */
if(Helper::checkCustomFile(basename(__FILE__))) {
    require Helper::checkCustomFile(basename(__FILE__));
}