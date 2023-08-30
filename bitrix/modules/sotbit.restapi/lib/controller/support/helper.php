<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Support;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\SupportException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class Helper
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Helper extends Base
{
    public function getSettings(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody();
        $support = $this->getRepository()->getDictionary();

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }

    public function getFile(Request $request, Response $response, array $args): Response
    {
        if(!$args['hash'] || !preg_match('/^[a-z0-9]{32}$/i', $args['hash'])) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_MESSAGE_ID'), 400);
        }

        $support = $this->getRepository()->getFile((string)$args['hash'], (int)$this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $support, StatusCode::HTTP_OK);
    }


}
