<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\EventDispatcher\Events\RouteEvent;
use Sotbit\RestAPI\EventDispatcher\Listeners\OrderListener;
use Sotbit\RestAPI\Exception\EventException;
use Sotbit\RestAPI\Localisation as l;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Sotbit\RestAPI\Middleware;

/**
 * Class Router
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class Router extends BaseController
{
    public static function listen(\Slim\App $app, $customRouters): void
    {
        try {
            $response = $app->getContainer()->get('response');
            if($customRouters) {
                foreach($customRouters as $router) {
                    /*if(!$router['callable']) {
                        throw new EventException(l::get('ERROR_EVENT_EMPTY_CALLABLE'), StatusCode::HTTP_BAD_REQUEST, $response);
                    }

                    if(!$router['method']) {
                        throw new EventException(l::get('ERROR_EVENT_EMPTY_METHOD'), StatusCode::HTTP_BAD_REQUEST, $response);
                    }

                    if(!$router['pattern']) {
                        throw new EventException(l::get('ERROR_EVENT_EMPTY_PATTERN'), StatusCode::HTTP_BAD_REQUEST, $response);
                    }*/


                    if($router['callable'] && $router['method'] && $router['pattern']) {
                        if($router['module']) {
                            Loader::includeModule($router['module']);
                        }

                        //$router['callable'] = '\\'.trim(explode('(', str_replace('::', ':', $router['callable']))[0], '\\');
                        $router['callable'] = '\\'.trim($router['callable'], '\\');
                        $router['name'] = $router['name'] ? : trim($router['pattern'], '/');
                        $router['method'] = strtolower($router['method']);
                        $run = __CLASS__.':run';

                        if($router['auth']) {
                            $app->{$router['method']}($router['pattern'], $run)
                                ->setName($router['name'])
                                ->setArgument('callable', $router['callable'])
                                ->add(new Middleware\Auth());
                        } else {
                            $app->{$router['method']}($router['pattern'], $run)
                                ->setName($router['name'])
                                ->setArgument('callable', $router['callable']);
                        }
                    }
                }
            }
        } catch(LoaderException $e) {
            //throw new EventException($e->getMessage(), StatusCode::HTTP_BAD_REQUEST, $response);
        } catch(\BadMethodCallException $e) {
            //throw new EventException($e->getMessage(), StatusCode::HTTP_BAD_REQUEST, $response);
        } catch(\Exception $e) {
            //throw new EventException($e->getMessage(), StatusCode::HTTP_BAD_REQUEST, $response);
        }
    }

    /**
     * @param $request
     * @param $response
     * @param $args
     *
     * @return Response
     * @throws EventException
     */
    public function run(Request $request, Response $response, array $args): Response
    {
        $message = '';
        $post = $request->getParsedBody();
        $user = [];


        if(!is_null($post['decoded'])) {
            $user = [
                'id'    => $this->getUserId($request),
                'login' => $this->getLogin($request),
            ];
            unset($post['decoded']);
        }

        $params = [
            'post' => (array)$post,
            'get'  => (array)$request->getQueryParams(),
            'args' => $args,
            'user' => $user,
        ];

        if(!is_callable($args['callable'])) {
            throw new EventException(l::get('ERROR_EVENT_EMPTY_CALLABLE_INVALID'), StatusCode::HTTP_BAD_REQUEST);
        }

        try {
            $message = call_user_func($args['callable'], $params);
        } catch(\Exception $e) {
            $message = $e->getMessage();
        }

        return $this->response($response, self::RESPONSE_SUCCESS, $message, StatusCode::HTTP_OK);
    }

}
