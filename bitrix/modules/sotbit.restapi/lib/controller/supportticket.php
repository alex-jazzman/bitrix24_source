<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\EventDispatcher\Events\SupportEvent;

/**
 * Class SupportTicket
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class SupportTicket extends BaseController
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
            'limit'   => $request->getQueryParam('limit'),
            'page'    => $request->getQueryParam('page'),
            'order'   => $request->getQueryParam('order'),
            'filter'  => $request->getQueryParam('filter'),
        ];

        // event
        $this->getEventService()->dispatch(new SupportEvent($ticket), SupportEvent::TICKET_BEFORE_GET);

        $tickets = $this->getServiceFindSupport()->getTickets($this->params);

        // event
        $this->getEventService()->dispatch(new SupportEvent($tickets), SupportEvent::TICKET_AFTER_GET);

        return $this->response($response, self::RESPONSE_SUCCESS, $tickets, StatusCode::HTTP_OK);
    }


    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event
        $this->getEventService()->dispatch(new SupportEvent($args), SupportEvent::TICKET_BEFORE_GET_DETAIL);

        $ticket = $this->getServiceFindSupport()->getTicket((int)$args['id'], $this->getUserId($request));

        // event
        $this->getEventService()->dispatch(new SupportEvent($ticket), SupportEvent::TICKET_AFTER_GET_DETAIL);

        return $this->response($response, self::RESPONSE_SUCCESS, $ticket, StatusCode::HTTP_OK);
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
        $support = $this->getServiceCreateSupport()->createTicket($input, $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_CREATED);
    }


    public function update(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody();
        $support = $this->getServiceUpdateSupport()->update((int)$args['id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }

    public function close(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        $support = $this->getServiceUpdateSupport()->close((string)$input['id'], $this->getUserId($request));

        // event
        if(is_array($support) && count($support)) {
            $this->getEventService()->dispatch(new SupportEvent($input['id']), SupportEvent::TICKET_CLOSE);
        }

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }

    public function open(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        $support = $this->getServiceUpdateSupport()->open((string)$input['id'], $this->getUserId($request));

        // event
        if(is_array($support) && count($support)) {
            $this->getEventService()->dispatch(new SupportEvent($input['id']), SupportEvent::TICKET_OPEN);
        }

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }





    /*public function delete(Request $request, Response $response, array $args): Response
    {
        $this->getServiceDeleteSupport()->delete((int) $args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, null, StatusCode::HTTP_NO_CONTENT);
    }*/

    /*public function search(Request $request, Response $response, array $args): Response
    {
        $supports = $this->getServiceFindSupport()->search($args['query']);

        return $this->response($response, self::RESPONSE_SUCCESS, $supports, StatusCode::HTTP_OK);
    }*/

}
