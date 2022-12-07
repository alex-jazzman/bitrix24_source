<?php

declare(strict_types=1);

use Sotbit\RestAPI\Service\User\UserService;
use Sotbit\RestAPI\Service\Order;
use Sotbit\RestAPI\Service\Support;
use Sotbit\RestAPI\Service\Event;
use Psr\Container\ContainerInterface;
use Sotbit\RestAPI\Core\Helper;

/**
 * Custom services
 */

/*$container['custom_service'] = static function (
    ContainerInterface $container
): Custom\CustomService {
    return new Custom\CustomService(
        $container->get('custom')
    );
};*/
