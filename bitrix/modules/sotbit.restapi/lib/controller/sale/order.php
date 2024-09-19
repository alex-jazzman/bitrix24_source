<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Sale;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\EventDispatcher\Events\OrderEvent;
use Sotbit\RestAPI\EventDispatcher\Listeners\OrderListener;
use Sotbit\RestAPI\Exception\OrderException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class Order
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Order extends Base
{
    /**
     * Get one
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event detail
        $this->getEvents()->dispatch(new OrderEvent($args), OrderEvent::DETAIL_BEFORE);

        // repository
        $order = $this->getRepository()->getOrder((int)$args['id'], $this->getUserId($request));

        // event detail
        $this->getEvents()->dispatch(new OrderEvent($order), OrderEvent::DETAIL_AFTER);

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Get list
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function getList(Request $request, Response $response, array $args): Response
    {
        // event
        $this->getEvents()->dispatch(new OrderEvent($args), OrderEvent::BEFORE);

        // prepare
        $this->params = [
            'user_id' => $this->getUserId($request),
            'limit'   => $request->getQueryParams()['limit'] ?? null,
            'page'    => $request->getQueryParams()['page'] ?? null,
            'select'  => $request->getQueryParams()['select'] ?? null,
            'order'   => $request->getQueryParams()['order'] ?? null,
            'filter'  => $request->getQueryParams()['filter'] ?? null,
        ];

        // repository
        $order = $this->getRepository()->getOrderList($this->params);

        // event
        $this->getEvents()->dispatch(new OrderEvent($order), OrderEvent::AFTER);

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }


    /**
     * Create order
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    /*public function create(Request $request, Response $response, array $args): Response
    {
        //$order = $this->getServiceCreateSale()->create((array) $args, $this->getUserId($request));
        //return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }*/

    /**
     * Update order
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    /*public function update(Request $request, Response $response, array $args): Response
    {
        $order = $this->getServiceUpdateSale()->update((array) $args, $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }*/

    /**
     * Get order status
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserExceptionû
     */
    public function getStatus(Request $request, Response $response, array $args): Response
    {
        $order = $this->getRepository()->getOrderStatus((int)$args['id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Order cancel
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function cancel(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();
        $input['reason'] = $input['reason'] ?: '';
        $order = $this->getRepository()->setOrderCancel(
            (string)$input['id'],
            (string)$input['reason'],
            $this->getUserId($request)
        );

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Repeat order
     *
     * @param  Request  $request
     * @param  Response  $response
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function repeat(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        if(!$input['id']) {
            throw new OrderException(l::get('ERROR_USER_ID_EMPTY'), 400);
        }

        $order = $this->getRepository()->setOrderRepeat(
            (int)$input['id'],
            $this->getUserId($request)
        );

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Get order pay systems
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     */
    public function getPaySystems(Request $request, Response $response, array $args): Response
    {
        $order = $this->getRepository()->getPaySystems();

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Get order deliveries
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     */
    public function getDeliveries(Request $request, Response $response, array $args): Response
    {
        $order = $this->getRepository()->getDeliveries();

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Get all system statuses
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     */
    public function getStatuses(Request $request, Response $response, array $args): Response
    {
        $order = $this->getRepository()->getStatuses();

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }

    /**
     * Get all system person types
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     */
    public function getPersonTypes(Request $request, Response $response, array $args): Response
    {
        $order = $this->getRepository()->getPersonTypes();

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::STATUS_OK);
    }


}
