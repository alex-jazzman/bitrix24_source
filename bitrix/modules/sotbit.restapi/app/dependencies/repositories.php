<?php

declare(strict_types=1);

use Sotbit\RestAPI\Repository\UserRepository;
use Sotbit\RestAPI\Repository\SupportRepository;
use Sotbit\RestAPI\Repository\CatalogRepository;
use Sotbit\RestAPI\Repository\SaleRepository;
//use Sotbit\RestAPI\Repository\SettingsRepository;


return [
    'user_repository' => static fn(): UserRepository => new UserRepository(),
    'support_repository' => static fn(): SupportRepository => new SupportRepository(),
    'catalog_repository' => static fn(): CatalogRepository => new CatalogRepository(),
    'sale_repository' => static fn(): SaleRepository => new SaleRepository(),
    //'settings_repository' => static fn(): SettingsRepository => new SettingsRepository(),

];