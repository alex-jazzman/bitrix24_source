<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Config\Config;

class Catalog extends Base
{

    public function getOne(Request $request, Response $response, array $args): Response
    {
        // repository
        $catalog = $this->getRepository()->getCatalog((int)$args['iblock_id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::STATUS_OK);
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
        ];

        // repository
        $catalog = $this->getRepository()->getCatalogList($this->params);

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::STATUS_OK);
    }

    public function getPrices(Request $request, Response $response, array $args): Response
    {
        // repository
        $catalog = $this->getRepository()->getCatalog((int)$args['iblock_id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::STATUS_OK);
    }

    public function getVats(Request $request, Response $response, array $args): Response
    {
        // repository
        $catalog = $this->getRepository()->getCatalog((int)$args['iblock_id'], $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $catalog, StatusCode::STATUS_OK);
    }

}
