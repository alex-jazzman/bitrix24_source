<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\User;

use Firebase\JWT\JWT;
use Respect\Validation\Validator as v;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\Core\Helper;
use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class Auth
 *
 * @package Sotbit\RestAPI\Controller\User
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 20.05.2021
 */
class Auth extends Base
{
    /**
     * Login user
     *
     * @param  Request  $request
     * @param  Response  $response
     *
     * @return Response
     */
    public function login(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        $data = json_decode(json_encode($input), false);
        /*if (! isset($data->email)) {
            throw new UserException('The field "email" is required.', 400);
        }*/

        if(!isset($data->login)) {
            throw new UserException(l::get('ERROR_USER_LOGIN_EMPTY'), 400);
        }

        if(!isset($data->password)) {
            throw new UserException(l::get('ERROR_USER_PASSWORD_EMPTY'), 400);
        }

        $user = $this->getRepository()->login($data->login, $data->password);

        // check permission groups
        if($user['ID'] && !Config::getInstance()->isUserAccess((int)$user['ID'])) {
            throw new UserException(l::get('ERROR_USER_ACCESS_DENIED'), 403);
        }

        $token = [
            'sub'   => $user['ID'],
            'login' => $user['LOGIN'],
            'iat'   => time(),
            'exp'   => time() + Config::getInstance()->getTokenExpire(),
        ];

        $jwt = [
            'token'   => JWT::encode($token, Config::getInstance()->getSecretKey(), 'HS512'),
            'user_id' => $user['ID'],
        ];

        $message = [
            'Authorization' => 'Bearer '.$jwt['token'],
            'user_id'       => $jwt['user_id'],
        ];

        return $this->response($response, self::RESPONSE_SUCCESS, $message, StatusCode::HTTP_OK);
    }

    /**
     * Forgot user password
     *
     * @param  Request  $request
     * @param  Response  $response
     *
     * @return Response
     */
    public function forgot(Request $request, Response $response): Response
    {
        $input = (array)$request->getParsedBody();

        $data = json_decode(json_encode($input), false);
        if(empty($data->email)) {
            throw new UserException(l::get('ERROR_USER_EMAIL_EMPTY'), 400);
        }
        if(!v::email()->validate($data->email)) {
            throw new UserException(l::get('ERROR_USER_EMAIL_INVALID'), 400);
        }

        $message = $this->getRepository()->forgot($data->email);

        return $this->response($response, self::RESPONSE_SUCCESS, $message, StatusCode::HTTP_OK);
    }
}