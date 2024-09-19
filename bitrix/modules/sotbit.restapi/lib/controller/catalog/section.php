<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Sotbit\RestAPI\Config\Config;

class Section extends Base
{

    public function getOne(Request $request, Response $response, array $args): Response
    {
        // event

        // repository
        $section = $this->getRepository()->getSection((int) $args['iblock_id'], (int) $args['section_id'], $this->getUserId($request));


        return $this->response($response, self::RESPONSE_SUCCESS, $section, StatusCode::STATUS_OK);
    }

    public function getList(Request $request, Response $response, array $args): Response
    {
        // prepare
        $this->params = [
            'user_id' => $this->getUserId($request),
            'select'  => $request->getQueryParams()['select'] ?? null,
            'filter'  => $request->getQueryParams()['filter'] ?? null,
            'order'   => $request->getQueryParams()['order'] ?? null,
            'page'    => $request->getQueryParams()['page'] ?? null,
            'limit'   => $request->getQueryParams()['limit'] ?? null,
        ];

        $this->params['filter']['IBLOCK_ID'] = (int) $args['iblock_id'];

        // event detail
        //$this->getEventService()->dispatch(new OrderEvent($args), OrderEvent::DETAIL_BEFORE);

        // repository
        $list = $this->getRepository()->getSectionsList($this->params);

        // event detail
        //$this->getEventService()->dispatch(new OrderEvent($order), OrderEvent::DETAIL_AFTER);

        return $this->response($response, self::RESPONSE_SUCCESS, $list, StatusCode::STATUS_OK);
    }

}
