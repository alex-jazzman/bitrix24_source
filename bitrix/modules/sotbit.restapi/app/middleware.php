<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Sotbit\RestAPI\Middleware;

return static function (App $app, Closure $customErrorHandler): void {

    // Add middleweares
    $app->add(new Middleware\BooleanInputDataType($app));
    $app->add(new Middleware\Log($app));
    $app->add(new Middleware\Config($app));
    $app->add(new Middleware\TrailingSlash());

    // Error middleware
    $errorMiddleware = $app->addErrorMiddleware(true, true, true);
    $errorMiddleware->setDefaultErrorHandler($customErrorHandler);

    // With json
    $app->addBodyParsingMiddleware();

    // Add Routing Middleware
    $app->addRoutingMiddleware();
};