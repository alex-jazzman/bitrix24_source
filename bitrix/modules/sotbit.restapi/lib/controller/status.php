<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\EventDispatcher\Events\HelpEvent;

/**
 * Class Status
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Status extends BaseController
{
    public function getHelp(Request $request, Response $response): Response
    {
        $router = [
            'help'   => '/v1[/]',
            'status' => 'GET  /v1/status',
            'login'  => 'POST /v1/auth (params=login,password)',
            'forgot' => 'POST /v1/auth/forgot (params=email)',

            'USER get current ' => 'GET  /v1/users',
            'USER get'          => 'GET  /v1/users/{id}',

            'ORDERS get'         => 'GET  /v1/orders[?filter]',
            'ORDER get current'  => 'GET  /v1/orders/{id}',
            'ORDER get status'   => 'GET  /v1/orders/status/{id}',
            'ORDER get statuses' => 'GET  /v1/orders/statuses',
            'ORDER set cancel'   => 'POST  /v1/orders/cancel (params=id,[reason])',

            'ORDER get deliveries list'  => 'GET  /v1/orders/deliveries',
            'ORDER get pay system list'  => 'GET  /v1/orders/paysystem',
            'ORDER get person type list' => 'GET  /v1/orders/persontypes',

            'SUPPORT get params'                  => 'GET  /v1/support',
            'SUPPORT create ticket'               => 'POST  /v1/support/tickets (params = title, message, [files, category, criticality, mark])',
            'SUPPORT create ticket message'       => 'POST  /v1/support/messages/ticket/{id} (params = message, [files[], criticality, mark])',
            'SUPPORT set ticket close'            => 'POST  /v1/support/tickets/close (params = id)',
            'SUPPORT set ticket open'             => 'POST  /v1/support/tickets/open (params = id)',
            'SUPPORT get all my tickets'          => 'GET  /v1/support/tickets [?filter]',
            'SUPPORT get current tickets'         => 'GET  /v1/support/tickets/{id}',
            'SUPPORT get current ticket messages' => 'GET  /v1/support/messages/ticket/{id} [?filter]',
            'SUPPORT get current messages'        => 'GET  /v1/support/messages/{id}',
            'SUPPORT get file'                    => 'GET  /v1/support/file/{hash}',
            'SUPPORT filter help'                 => 'https://dev.1c-bitrix.ru/api_help/support/classes/cticket/getmessagelist.php',
            '[?filter]'                           => '`select` => ID,NAME , `filter` =>  filter[USER_ID]=1, `limit` => 10, `page` => 1, `order` => order[ID]=DESC',

            'CATALOG get catalog'                 => 'GET  /v1/catalog',
            'CATALOG get catalog current'         => 'GET  /v1/catalog/[id]',
            'CATALOG get section all'             => 'GET  /v1/catalog/[id]/section',
            'CATALOG get section current'         => 'GET  /v1/catalog/[id]/section/[section_id]',
            'CATALOG get products all'            => 'GET  /v1/catalog/[id]/products',
            'CATALOG get products current'        => 'GET  /v1/catalog/[id]/products/[products_id]',

            ];
        $message = [
            'router' => $router,
        ];

        // event
        //$this->getEventService()->dispatch(new HelpEvent($message), HelpEvent::GET);

        return $this->response($response, self::RESPONSE_SUCCESS, $message, StatusCode::HTTP_OK);
    }

    public function getStatus(Request $request, Response $response): Response
    {
        $status = [
        ];

        return $this->response($response, self::RESPONSE_SUCCESS, $status, StatusCode::HTTP_OK);
    }

}
