<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Controller\BaseController;

/**
 * Class SupportHelper
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class SupportHelper extends BaseController
{
    public function getSettings(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody();
        $support = $this->getServiceFindSupport()->getSettings();

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }

    public function getFile(Request $request, Response $response, array $args): Response
    {
        $support = $this->getServiceFindSupport()->getFile((string)$args['hash'], (int)$this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }


}
