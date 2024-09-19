<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Core\Helper;

class Product extends Base
{

    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event

        // repository
        $product = $this->getRepository()->getProduct((int)$args['iblock_id'], (int)$args['product_id'], $this->getUserId($request));

        // event

        return $this->response($response, self::RESPONSE_SUCCESS, $product, StatusCode::STATUS_OK);
    }

    public function getList(Request $request, Response $response, array $args): Response
    {
        // prepare
        $this->params = [
            'user_id' => $this->getUserId($request),
            'select'  => $request->getQueryParams()['select'] ?? null,
            'filter'  => $request->getQueryParams()['filter'] ?? null,
            'order'   => $request->getQueryParams()['order'] ?? null,
            'limit'   => $request->getQueryParams()['limit'] ?? null,
            'page'    => $request->getQueryParams()['page'] ?? null,
            'search'  => Helper::convertEncodingToSite($request->getQueryParams()['search'] ?? null),
        ];


        $this->params['filter']['IBLOCK_ID'] = (int) $args['iblock_id'];

        // event

        // repository
        $list = $this->getRepository()->getProductsList($this->params);

        $list['data'] = array_values($list['data']);

        return $this->response($response, self::RESPONSE_SUCCESS, $list, StatusCode::STATUS_OK);
    }

}
