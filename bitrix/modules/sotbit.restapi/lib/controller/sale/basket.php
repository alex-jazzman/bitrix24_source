<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Sale;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;

class Basket extends Base
{
    public function get(Request $request, Response $response, array $args): Response
    {
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
        $basket = $this->getRepository()->getBasket($this->params);

        if(!empty($basket['data']['items'])) {
            $basket['data']['items'] = array_values($basket['data']['items']);
        }

        return $this->response($response, self::RESPONSE_SUCCESS, $basket, StatusCode::STATUS_OK);
    }

    public function add(Request $request, Response $response, array $args): Response
    {
        // event

        // prepare
        $input = (array)$request->getParsedBody();

        $this->params = [
            'user_id'   => $this->getUserId($request),
            'id'        => (int) $input['id'],
            'quantity'  => (!$input['quantity'] || $input['quantity'] <= 0 ? 1 : abs((float)$input['quantity'])),
        ];

        // repository
        $basket = $this->getRepository()->addBasket($this->params, $this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $basket, StatusCode::STATUS_OK);
    }



    public function delete(Request $request, Response $response, array $args): Response
    {
        // event

        // prepare
        $input = (array)$request->getParsedBody();

        $this->params = [
            'user_id'   => $this->getUserId($request),
            'id'        => $input['id'], // array and int
        ];

        // repository
        $basket = $this->getRepository()->deleteBasket($this->params, $this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $basket, StatusCode::STATUS_OK);

    }


    /**
     * Get coupons current user
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    /*public function getBasketCoupons(Request $request, Response $response, array $args): Response
    {
        // event

        // repository
        $coupons = $this->getServiceFindSale()->getBasketCoupons($this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $coupons, StatusCode::STATUS_OK);
    }*/

    /**
     * Add coupon
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    /*public function addBasketCoupon(Request $request, Response $response, array $args): Response
    {
        // event

        $input = (array)$request->getParsedBody();

        // repository
        $coupon = $this->getServiceCreateSale()->addBasketCoupon((string)$input['coupon'] , $this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $coupon, StatusCode::STATUS_OK);
    }*/

    /**
     * Delete coupone
     *
     * @param  Request  $request
     * @param  Response  $response
     * @param  array  $args
     *
     * @return Response
     * @throws \Sotbit\RestAPI\Exception\UserException
     */
    /*public function deleteBasketCoupon(Request $request, Response $response, array $args): Response
    {
        // event

        // repository
        $coupon = $this->getServiceDeleteSale()->deleteBasketCoupon((int)$args['id'], $this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $coupon, StatusCode::STATUS_OK);

    }*/
}
