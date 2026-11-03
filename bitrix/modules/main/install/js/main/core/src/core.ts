import './internal/bx';

import Type from './lib/type';
import Reflection from './lib/reflection';
import Text from './lib/text';
import Dom from './lib/dom';
import Browser from './lib/browser';
import Event from './lib/event';
import Http from './lib/http';
import Runtime from './lib/runtime';
import Loc from './lib/loc';
import Tag from './lib/tag';
import Uri from './lib/uri';
import Validation from './lib/validation';
import Cache from './lib/cache';
import BaseError from './lib/base-error';
import Extension from './lib/extension/extension';
import ZIndexManager from './lib/z-index/z-index-manager';
import Collections from './lib/collections';
import { Animation } from './lib/animation/animation';
import { Easing } from './lib/animation/easing';
import { LocalStorage, localStorage } from './lib/local-storage';
import { Page } from './lib/page';
import {
	HttpClient,
	isAjaxEnvelope,
	parseEnvelope,
	HttpClientError,
	HttpError,
	NetworkError,
	TimeoutError,
	ParseError,
	ControllerError,
	AssetLoadError,
} from './lib/http-client/index';

export {
	Type,
	Reflection,
	Text,
	Dom,
	Browser,
	Event,
	Http,
	Runtime,
	Loc,
	Tag,
	Uri,
	Validation,
	Cache,
	BaseError,
	Extension,
	ZIndexManager,
	Collections,
	Animation,
	Easing,
	LocalStorage,
	localStorage,
	Page,
	HttpClient,
	isAjaxEnvelope,
	parseEnvelope,
	HttpClientError,
	HttpError,
	NetworkError,
	TimeoutError,
	ParseError,
	ControllerError,
	AssetLoadError,
};

export type {
	ClientConfig,
	RequestConfig,
	BodylessRequestConfig,
	BodyRequestConfig,
	EffectiveRequestConfig,
	HttpResponse,
	ActionOptions,
	ActionOptionsWithBody,
	BodylessActionOptions,
	AjaxEnvelope,
	AjaxEnvelopeStatus,
	AjaxEnvelopeError,
	AjaxNavigation,
	AnalyticsOptions,
	HttpMethod,
	HttpResponseType,
	AssetType,
	QueryParams,
	RequestBody,
	InterceptorChain,
	InterceptorHandler,
	InterceptorErrorHandler,
	HttpClientInterceptors,
	RetryConfig,
	InstanceRetryConfig,
	RetryContext,
	NormalizedRetryPolicy,
	AjaxAssets,
} from './lib/http-client/index';

export type {
	ExtractedAssets,
	AssetScript,
	AssetStyle,
	ExtractAssetsOptions,
	ExternalScript,
	InlineScript,
} from './lib/assets/index';

export * from './core-compatibility';
export type * from './lib/types/index';

export * from './legacy/index';
