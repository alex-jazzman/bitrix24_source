<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Config\Config;

class Catalog extends Base
{

    public function getOne(Request $request, Response $response, array $args): Response
    {
        // repository
        $catalog = $this->getRepository()->getCatalog((int)$args['iblock_id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::HTTP_OK);
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
        ];

        // repository
        $catalog = $this->getRepository()->getCatalogList($this->params);

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::HTTP_OK);
    }

    public function getPrices(Request $request, Response $response, array $args): Response
    {
        // repository
        $catalog = $this->getRepository()->getCatalog((int)$args['iblock_id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::HTTP_OK);
    }

    public function getVats(Request $request, Response $response, array $args): Response
    {
        // repository
        $catalog = $this->getRepository()->getCatalog((int)$args['iblock_id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::HTTP_OK);
    }

}
