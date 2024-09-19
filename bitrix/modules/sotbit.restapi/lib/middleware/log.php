<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Container\ContainerInterface as Container;
use Slim\Psr7\Response;
use Slim\App;
use Sotbit\RestAPI\Model;
use Sotbit\RestAPI\Exception\AuthException;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Core;

/**
 * Class Log
 *
 * @package Sotbit\RestAPI\Middleware
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 01.03.2021
 */
class Log extends Base
{
    protected ?Container $container;

    public function __construct(App $app)
    {
        $this->container = $app->getContainer();
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $logWriter = new Core\LogWriter();

        if($userId = $this->getUserId($request)) {
            $logWriter->setParam('USER_ID', $userId);
        }

        // RESPONSE params
        $logWriter->setRequest($request);

        // send a request to get a response
        $response = $handler->handle($request);

        // REQUEST params
        if($response->getStatusCode()) {
            $logWriter->setParam('RESPONSE_HTTP_CODE', $response->getStatusCode().':'.$response->getReasonPhrase());
        }

        // write LOG
        $logWriter->add();

        return $response;
    }
}
