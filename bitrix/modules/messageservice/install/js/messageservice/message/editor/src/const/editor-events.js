// Editor event names. Cross-region DOM intents use the per-app `$Bitrix.eventEmitter`;
// host-visible lifecycle/cache events use the locator EventEmitter.
export const INSERT_PLACEHOLDER_TEXT_EVENT = 'messageservice:message-editor:insertPlaceholderText';
export const CUSTOM_TEMPLATE_CACHE_INVALIDATE_EVENT = 'messageservice:message-editor:customTemplateCacheInvalidate';

export type InsertPlaceholderTextEvent = {
	text: string,
};
