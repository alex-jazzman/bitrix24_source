<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Sale;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\EventDispatcher\Events\OrderEvent;
use Sotbit\RestAPI\EventDispatcher\Listeners\OrderListener;

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

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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
            'limit'   => $request->getQueryParam('limit'),
            'page'    => $request->getQueryParam('page'),
            'select'  => $request->getQueryParam('select'),
            'order'   => $request->getQueryParam('order'),
            'filter'  => $request->getQueryParam('filter'),
        ];

        // repository
        $order = $this->getRepository()->getOrderList($this->params);

        // event
        $this->getEvents()->dispatch(new OrderEvent($order), OrderEvent::AFTER);

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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
    public function create(Request $request, Response $response, array $args): Response
    {
        //$order = $this->getServiceCreateSale()->create((array) $args, $this->getUserId($request));
        //return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
    }

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
    public function update(Request $request, Response $response, array $args): Response
    {
        /*$order = $this->getServiceUpdateSale()->update((array) $args, $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);*/
    }

    /**
     * Get order status
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    public function getStatus(Request $request, Response $response, array $args): Response
    {
        $order = $this->getRepository()->getOrderStatus((int)$args['id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
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

        return $this->response($response, self::RESPONSE_SUCCESS, $order, StatusCode::HTTP_OK);
    }


}
