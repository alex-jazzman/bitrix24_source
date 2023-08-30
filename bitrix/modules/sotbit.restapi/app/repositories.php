<?php

declare(strict_types=1);

use Sotbit\RestAPI\Repository\UserRepository;
use Sotbit\RestAPI\Repository\SupportRepository;
use Sotbit\RestAPI\Repository\CatalogRepository;
use Sotbit\RestAPI\Repository\SaleRepository;
use Sotbit\RestAPI\Repository\SettingsRepository;

use Psr\Container\ContainerInterface;
use Sotbit\RestAPI\Core\Helper;

$container['user_repository'] = static function(
    ContainerInterface $container
): UserRepository {
    return new UserRepository();
};

$container['support_repository'] = static function(
    ContainerInterface $container
): SupportRepository {
    return new SupportRepository();
};

$container['catalog_repository'] = static function(
    ContainerInterface $container
): CatalogRepository {
    return new CatalogRepository();
};

$container['sale_repository'] = static function(
    ContainerInterface $container
): SaleRepository {
    return new SaleRepository();
};

/*$container['settings_repository'] = static function(
    ContainerInterface $container
): SaleRepository {
    return new SettingsRepository();
};*/

/**
 * Include custom repository from file
 */
if(Helper::checkCustomFile(basename(__FILE__))) {
    require Helper::checkCustomFile(basename(__FILE__));
}