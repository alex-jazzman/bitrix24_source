<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Core\Helper;

class Filter extends Base
{

    public function get(Request $request, Response $response, array $args): Response
    {
        // prepare
        $this->params = [
            'user_id' => $this->getUserId($request),
            'select'  => $request->getQueryParam('select'),
            'filter'  => $request->getQueryParam('filter'),
        ];

        $this->params['filter']['IBLOCK_ID'] = (int) $args['iblock_id'];

        // event

        // repository
        $list = $this->getRepository()->getFilter($this->params);

        return $this->response($response, self::RESPONSE_SUCCESS, $list, StatusCode::HTTP_OK);
    }

}
