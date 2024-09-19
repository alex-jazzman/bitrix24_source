<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Container\ContainerInterface as Container;
use Slim\Psr7\Response;
use Slim\App;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Config as ConfigStorage;
use Sotbit\RestAPI\Config\Instances\B2bmobile;
use SotbitRestAPI;

/**
 * Class Config
 *
 * @package Sotbit\RestAPI\Middleware
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 */
class Config extends Base
{
    protected ?Container $container;

    public function __construct(App $app)
    {
        $this->container = $app->getContainer();
    }

    /**
     * @param  Request  $request
     * @param  RequestHandler  $handler
     *
     * @return ResponseInterface
     */
    public function __invoke(Request $request, RequestHandler $handler): Response {
        $queryParams = $request->getQueryParams();

        if(class_exists(B2bmobile::class)
            && ($queryParams['setting'] ?? null) === SotbitRestAPI::B2BMOBILE_MODULE_ID
        ) {
            ConfigStorage\Config::setInstance(B2bmobile::class);
        }

        return $handler->handle($request);
    }
}
