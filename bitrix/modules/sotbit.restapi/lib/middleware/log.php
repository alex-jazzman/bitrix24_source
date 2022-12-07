<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use PHPUnit\Exception;
use Psr\Http\Message\ResponseInterface;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Route;
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
    private $container;

    public function __construct($container)
    {
        $this->container = $container->getContainer();
    }

    public function __invoke(
        Request $request,
        Response $response,
        $next
    ): ResponseInterface {
        $arrayLog = [];
        $logWriter = new Core\LogWriter();

        if($userId = $this->getUserId($request)) {
            $arrayLog['USER_ID'] = $userId;
        }

        // RESPONSE params
        $logWriter->setRequest($request);

        // send a request to get a response
        $response = $next($request, $response);

        // REQUEST params
        if($response->getStatusCode()) {
            $arrayLog['RESPONSE_HTTP_CODE'] = $response->getStatusCode().':'.$response->getReasonPhrase();
        }

        // write LOG
        $logWriter->add($arrayLog);

        return $response;
    }
}
