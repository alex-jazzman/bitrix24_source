<?php

declare(strict_types=1);

use Psr\Container\ContainerInterface;
use Slim\HttpCache\CacheProvider;

return [
    'cache' => static fn() => new CacheProvider(),

];