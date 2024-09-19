<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Sale;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\EventDispatcher\Events\OrderEvent;
use Sotbit\RestAPI\EventDispatcher\Listeners\OrderListener;

/**
 * Class Order
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Sale extends Base
{
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
