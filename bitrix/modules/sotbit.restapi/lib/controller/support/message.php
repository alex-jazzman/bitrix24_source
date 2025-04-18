<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Support;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\EventDispatcher\Events\SupportEvent;
use Sotbit\RestAPI\Exception\SupportException;
use Sotbit\RestAPI\Localisation as l;
use Slim\Routing\RouteContext;

/**
 * Class Message
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Message extends Base
{
    public function getAll(Request $request, Response $response, array $args): Response
    {
        $this->params = [
            'user_id' => $this->getUserId($request),
            'filter' => $request->getQueryParams()['filter'] ?? null,
            'limit' => $request->getQueryParams()['limit'] ?? null,
            'page' => $request->getQueryParams()['page'] ?? null,
            'order' => $request->getQueryParams()['order'] ?? null,
            'router_file' => RouteContext::fromRequest($request)->getRouteParser()->urlFor('support.get.file', ['hash' => '#HASH#']),
        ];

        // event
        $this->getEvents()->dispatch(new SupportEvent($this->params), SupportEvent::MESSAGE_BEFORE_GET);

        if(!$args['id']) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_TICKET_ID'), 400);
        }

        $tickets = $this->getRepository()->getMessagesTicket((int)$args['id'], $this->params);

        // event
        $this->getEvents()->dispatch(new SupportEvent($tickets), SupportEvent::MESSAGE_AFTER_GET);


        return $this->response($response, self::RESPONSE_SUCCESS, $tickets, StatusCode::STATUS_OK);
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event
        $this->getEvents()->dispatch(new SupportEvent($args), SupportEvent::MESSAGE_BEFORE_GET);

        if(!$args['id']) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_MESSAGE_ID'), 400);
        }

        // prepare file url for download
        $routerFile = RouteContext::fromRequest($request)->getRouteParser()->urlFor('support.get.file', ['hash' => '#HASH#']);

        $ticket = $this->getRepository()->getMessage((int)$args['id'], $this->getUserId($request), $routerFile);

        // event
        $this->getEvents()->dispatch(new SupportEvent($ticket), SupportEvent::MESSAGE_AFTER_GET);

        return $this->response($response, self::RESPONSE_SUCCESS, $ticket, StatusCode::STATUS_OK);
    }


    public function create(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody();

        if(!$args['id']) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_TICKET_ID'), 400);
        }

        $input['uploaded_files'] = $request->getUploadedFiles();

        $support = $this->getRepository()->createMessage(
            (int)$args['id'],
            $input,
            $this->getUserId($request)
        );

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::STATUS_CREATED);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->getRepository()->delete((int)$args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, null, StatusCode::STATUS_NO_CONTENT);
    }

    public function search(Request $request, Response $response, array $args): Response
    {
        $supports = $this->getRepository()->search($args['query']);

        return $this->response($response, self::RESPONSE_SUCCESS, $supports, StatusCode::STATUS_OK);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody();
        $support = $this->getRepository()->update($input, (int)$args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::STATUS_OK);
    }
}
