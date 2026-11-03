import {CommonRenderServiceProps} from "../service/render/types";
import {ItemButtonServiceProps} from "../service/item-button/types";

declare type RecentConfig = {
	services: {
		'quick-recent'?: {
			extension: string,
			props?: object,
		},
		'database-load'?: {
			extension: string,
			props?: object,
		},
		'server-load'?: {
			extension: string,
			props?: object,
		},
		'floating-button'?: {
			extension: string,
			props?: object,
		},
		'empty-state'?: {
			extension: string,
			props?: object,
		},
		'pagination'?: {
			extension: string,
			props?: object,
		},
		'search'?: {
			extension: string,
			props?: object,
		},
		'render': {
			extension: string,
			props: CommonRenderServiceProps,
		},
		'vuex'?: {
			extension: string,
			props?: object,
		},
		'action'?: {
			extension: string,
			props?: object,
		},
		'select'?: {
			extension: string,
			props?: object,
		},
		'item-button'?: {
			extension: string,
			props: ItemButtonServiceProps,
		},
		'external'?: {
			extension: string,
			props?: object,
		},
		'invite-banner'?: {
			extension: string,
			props?: object,
		}
	},
};
