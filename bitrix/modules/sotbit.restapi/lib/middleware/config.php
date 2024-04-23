<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ResponseInterface;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Route;
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
    protected $container;

    public function __construct($container)
    {
        $this->container = $container->getContainer();
    }

    /**
     * @param  Request  $request
     * @param  Response  $response
     * @param  Route  $next
     *
     * @return ResponseInterface
     */
    public function __invoke(
        Request $request,
        Response $response,
        $next
    ): ResponseInterface {
        if(class_exists(B2bmobile::class)
            && $request->getQueryParam('setting') === SotbitRestAPI::B2BMOBILE_MODULE_ID
        ) {
            ConfigStorage\Config::setInstance(B2bmobile::class);
        }

        return $next($request, $response);
    }
}
