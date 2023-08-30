<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Core\Helper;

class Product extends Base
{

    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event

        // repository
        $product = $this->getRepository()->getProduct((int)$args['iblock_id'], (int)$args['product_id'], $this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $product, StatusCode::HTTP_OK);
    }

    public function getList(Request $request, Response $response, array $args): Response
    {
        // prepare
        $this->params = [
            'user_id' => $this->getUserId($request),
            'select'  => $request->getQueryParam('select'),
            'filter'  => $request->getQueryParam('filter'),
            'order'   => $request->getQueryParam('order'),
            'limit'   => $request->getQueryParam('limit'),
            'page'    => $request->getQueryParam('page'),
            'search'  => Helper::convertEncodingToSite($request->getQueryParam('search')),
        ];


        $this->params['filter']['IBLOCK_ID'] = (int) $args['iblock_id'];

        // event

        // repository
        $list = $this->getRepository()->getProductsList($this->params);

        $list['data'] = array_values($list['data']);

        return $this->response($response, self::RESPONSE_SUCCESS, $list, StatusCode::HTTP_OK);
    }

}
