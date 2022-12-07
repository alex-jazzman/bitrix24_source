<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Slim\Http\Request;
use Slim\Http\Response;
use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\Service\Order;
use Slim\Http\StatusCode;

/**
 * Class User
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class User extends BaseController
{
    public function login(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();
        $jwt = $this->getUserService()->login($input);

        $message = [
            'Authorization' => 'Bearer '.$jwt['token'],
            'user_id'       => $jwt['user_id'],
        ];

        return $this->response($response, self::RESPONSE_SUCCESS, $message, StatusCode::HTTP_OK);
    }

    public function forgot(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();
        $message = $this->getUserService()->forgot($input);

        return $this->response($response, self::RESPONSE_SUCCESS, $message, StatusCode::HTTP_OK);
    }

    public function getCurrent(Request $request, Response $response, array $args): Response
    {
        $user = $this->getUserService()->getOne((int)$this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $user, StatusCode::HTTP_OK);
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $user = $this->getUserService()->getOne((int)$args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, $user, StatusCode::HTTP_OK);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        /*
        $this->checkUserPermissions((int) $args['id'], (int) $this->getUserId($request));
        $user = $this->getUserService()->update($input, (int) $args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, $user, StatusCode::HTTP_OK);*/
    }
}