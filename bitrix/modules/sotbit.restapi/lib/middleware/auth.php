<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Container\ContainerInterface;
use Slim\Psr7\Response;
use Slim\App;
use Sotbit\RestAPI\Exception\AuthException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class Auth
 *
 * @package Sotbit\RestAPI\Middleware
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 */
class Auth extends Base
{
    /**
     * @param  Request  $request
     * @param  RequestHandler  $handler
     *
     * @return Response
     * @throws AuthException
     */
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $jwtHeader = $request->getHeaderLine('Authorization');

        $decoded = $this->decodedHeader($jwtHeader);
        $object = $request->getParsedBody();
        $object['decoded'] = $decoded;
        return $handler->handle($request->withParsedBody($object));
    }
}
