<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Support;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\EventDispatcher\Events\SupportEvent;
use Sotbit\RestAPI\Exception\SupportException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class Ticket
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Ticket extends Base
{
    /**
     * Get all tickets user
     *
     * @param  Request  $request
     * @param  Response  $response
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function getAll(Request $request, Response $response): Response
    {
        $this->params = [
            'user_id' => $this->getUserId($request),
            'limit'   => $request->getQueryParams()['limit'] ?? null,
            'page'    => $request->getQueryParams()['page'] ?? null,
            'order'   => $request->getQueryParams()['order'] ?? null,
            'filter'  => $request->getQueryParams()['filter'] ?? null,
        ];

        // event
        $this->getEvents()->dispatch(new SupportEvent($ticket), SupportEvent::TICKET_BEFORE_GET);

        $tickets = $this->getRepository()->getTickets($this->params);

        // event
        $this->getEvents()->dispatch(new SupportEvent($tickets), SupportEvent::TICKET_AFTER_GET);

        return $this->response($response, self::RESPONSE_SUCCESS, $tickets, StatusCode::STATUS_OK);
    }


    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event
        $this->getEvents()->dispatch(new SupportEvent($args), SupportEvent::TICKET_BEFORE_GET_DETAIL);

        if(!$args['id']) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_TICKET_ID'), 400);
        }

        $ticket = $this->getRepository()->getTicket((int)$args['id'], $this->getUserId($request));

        // event
        $this->getEvents()->dispatch(new SupportEvent($ticket), SupportEvent::TICKET_AFTER_GET_DETAIL);

        return $this->response($response, self::RESPONSE_SUCCESS, $ticket, StatusCode::STATUS_OK);
    }

    /**
     * POST Create ticket
     *
     * @param  Request  $request
     * @param  Response  $response
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function create(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();
        $input['uploaded_files'] = $request->getUploadedFiles();
        $support = $this->getRepository()->createTicket($input, $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::STATUS_CREATED);
    }


    public function update(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody();
        $support = $this->getRepository()->update((int)$args['id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::STATUS_OK);
    }

    public function close(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        $support = $this->getRepository()->closeTicket((string)$input['id'], $this->getUserId($request));

        // event
        if(is_array($support) && count($support)) {
            $this->getEvents()->dispatch(new SupportEvent($input['id']), SupportEvent::TICKET_CLOSE);
        }

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::STATUS_OK);
    }

    public function open(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        $support = $this->getRepository()->openTicket((string)$input['id'], $this->getUserId($request));

        // event
        if(is_array($support) && count($support)) {
            $this->getEvents()->dispatch(new SupportEvent($input['id']), SupportEvent::TICKET_OPEN);
        }

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::STATUS_OK);
    }





    /*public function delete(Request $request, Response $response, array $args): Response
    {
        $this->getServiceDeleteSupport()->delete((int) $args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, null, StatusCode::STATUS_NO_CONTENT);
    }*/

    /*public function search(Request $request, Response $response, array $args): Response
    {
        $supports = $this->getServiceFindSupport()->search($args['query']);

        return $this->response($response, self::RESPONSE_SUCCESS, $supports, StatusCode::STATUS_OK);
    }*/

}
