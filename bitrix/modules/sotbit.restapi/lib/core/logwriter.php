<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Slim\Http\Request;
use Slim\Http\Response;
use Sotbit\RestAPI\Exception\AuthException;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Model;
use Sotbit\RestAPI\Exception\LogException;

class LogWriter
{
    private $logs = [];

    /**
     * @param  array  $fields
     */
    public function add(array $fields): void
    {
        if(\SotbitRestAPI::isLog()) {
            $this->logs = array_merge($fields, $this->logs);
            if(count($this->logs)) {
                try {
                    Model\LogTable::add($this->logs);
                } catch(\Exception $e) {
                }
            }
        }
    }

    /**
     * @param $request
     */
    public function setRequest($request): void
    {
        if($request instanceof Request) {
            $route = $request->getAttribute('route');

            if($request->getMethod()) {
                $this->logs['REQUEST_METHOD'] = $request->getMethod();
            }
            if($request->getUri()->getPath()) {
                $this->logs['REQUEST_PATH'] = $request->getUri()->getPath();
                if($route !== null && $route->getPattern()) {
                    $this->logs['REQUEST_PATH'] .= ' (route: '.$route->getPattern().($route->getArguments() ? ', args: '
                            .implode(", ", $route->getArguments()) : '').")";
                }
            }
            if($request->getServerParam('REMOTE_ADDR')) {
                $this->logs['IP'] = $request->getServerParam('REMOTE_ADDR');
            }

            if($userId) {
                $this->logs['USER_ID'] = $userId;
            }
        }
    }
}