<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response;
use Slim\App;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Config as ConfigStorage;
use Sotbit\RestAPI\Config\Instances\B2bmobile;
use Sotbit\RestAPI\Core\Helper;

/**
 * Class BooleanInputDataType
 *
 * Sometimes you need to use a boolean type for a filter.
 * Substituting the "@" sign in front of the value, Boolean type is substituted
 * Applicable for `true`, `false` and `null`
 * Example: ?filter[!PROPERTY_33]=@true (true is boolean type)
 *
 * @package Sotbit\RestAPI\Middleware
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 18.09.2023
 */
class BooleanInputDataType extends Base
{
    /**
     * @param  Request  $request
     * @param  Response  $response
     *
     * @return ResponseInterface
     */
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $queryParams = $request->getQueryParams();
        if(is_array($queryParams['filter'])) {
            array_walk_recursive(
                $queryParams['filter'],
                static fn(&$v) => $v = ($v === '@true')
                    ? true
                    : ($v === '@false' ? false
                        : ($v === '@null' ? null : $v))
            );

            $request = $request->withQueryParams($queryParams);
        }

        return $handler->handle($request);
    }
}
