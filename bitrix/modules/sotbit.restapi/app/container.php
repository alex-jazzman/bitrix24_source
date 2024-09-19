<?php

declare(strict_types=1);

use DI\ContainerBuilder;

$containerBuilder = new ContainerBuilder();

/*$containerBuilder->useAutowiring(false);
$containerBuilder->useAttributes(false);*/

$containerBuilder->addDefinitions(__DIR__. '/dependencies.php');

return $containerBuilder;