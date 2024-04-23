<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ResponseInterface;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Route;
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
     * @param  Response  $response
     * @param  Route  $next
     *
     * @return ResponseInterface
     * @throws AuthException
     */
    public function __invoke(
        Request $request,
        Response $response,
        Route $next
    ): ResponseInterface {
        $jwtHeader = $request->getHeaderLine('Authorization');

        $decoded = $this->decodedHeader($jwtHeader);
        $object = $request->getParsedBody();
        $object['decoded'] = $decoded;

        return $next($request->withParsedBody($object), $response);
    }
}
