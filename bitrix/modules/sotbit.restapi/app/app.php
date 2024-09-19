<?php
declare(strict_types=1);

use Slim\Factory\AppFactory;
use DI\Container;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Sotbit\RestAPI\Core\Helper;

// Init container
$container = require __DIR__ . '/container.php';
AppFactory::setContainer($container->build());

// Init app
$app = AppFactory::create();

// Add Cache
$app->add(new \Slim\HttpCache\Cache('public', 86400));

// Set default route path
$app->setBasePath(\SotbitRestAPI::getRouteMainPath());

$customErrorHandler = require __DIR__ . '/errorhandler.php';
(require __DIR__ . '/cors.php')($app);
(require __DIR__ . '/events.php')($app->getContainer());
(require __DIR__ . '/middleware.php')($app, $customErrorHandler);
(require __DIR__ . '/routes.php')($app);
(require __DIR__ . '/notfound.php')($app);

return $app;