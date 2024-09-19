<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Routing\RouteContext;
use Slim\Interfaces\RouteInterface;

use Sotbit\RestAPI\Exception\AuthException;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Model;
use Sotbit\RestAPI\Exception\LogException;

class LogWriter
{
    private array $result = [];
    private int $userId = 0;


    public function setParam($key, $value): void
    {
        $this->result[$key] = $value;
    }


    /**
     * @param  array  $fields
     */
    public function add(): void
    {
        if(\SotbitRestAPI::isLog()) {
            if(count($this->result)) {
                try {
                    Model\LogTable::add($this->result);
                } catch(\Exception $e) {
                }
            }
        }
    }

    /**
     * @param $request
     */
    public function setRequest(Request $request): void
    {
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();

        if($request->getMethod()) {
            $this->result['REQUEST_METHOD'] = $request->getMethod();
        }
        if($request->getUri()->getPath()) {
            $this->result['REQUEST_PATH'] = $request->getUri()->getPath();

            if($route instanceof RouteInterface && $route->getPattern()) {
                $this->result['REQUEST_PATH'] .= PHP_EOL.'(route: '.$route->getPattern().($route->getArguments() ? ', args: '
                        .implode(", ", $route->getArguments()) : '').")";
            }
        }
        $serverParams = $request->getServerParams();
        if(isset($serverParams['REMOTE_ADDR'])) {
            $this->result['IP'] = $serverParams['REMOTE_ADDR'];
        }
    }
}