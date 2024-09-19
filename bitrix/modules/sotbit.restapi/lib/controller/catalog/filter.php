<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Core\Helper;

class Filter extends Base
{

    public function get(Request $request, Response $response, array $args): Response
    {
        // prepare
        $this->params = [
            'user_id' => $this->getUserId($request),
            'select'  => $request->getQueryParams()['select'] ?? null,
            'filter'  => $request->getQueryParams()['filter'] ?? null
        ];

        $this->params['filter']['IBLOCK_ID'] = (int) $args['iblock_id'];

        // event

        // repository
        $list = $this->getRepository()->getFilter($this->params);

        return $this->response($response, self::RESPONSE_SUCCESS, $list, StatusCode::STATUS_OK);
    }

}
