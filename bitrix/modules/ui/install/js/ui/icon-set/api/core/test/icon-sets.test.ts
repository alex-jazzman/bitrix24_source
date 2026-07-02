import {
	Actions,
	Social,
	Main,
	ContactCenter,
	CRM,
	Editor,
	Special,
	Animated,
	Outline,
	Solid,
	SmallOutline,
	Disk,
	DiskCompact,
	Set,
} from '../src/index';

describe('Icon Sets backward compatibility', () => {

	describe('Actions', () => {
		it('should have exactly 109 icons', () => {
			assert.equal(Object.keys(Actions).length, 109);
		});

		it('should contain all expected values', () => {
			assert.equal(Actions.ARROW_RIGHT, 'arrow-right');
			assert.equal(Actions.ARROW_LEFT, 'arrow-left');
			assert.equal(Actions.ARROW_TOP, 'arrow-top');
			assert.equal(Actions.ARROW_DOWN, 'arrow-down');
			assert.equal(Actions.CHEVRON_RIGHT, 'chevron-right');
			assert.equal(Actions.CHEVRON_LEFT, 'chevron-left');
			assert.equal(Actions.CHEVRON_UP, 'chevron-up');
			assert.equal(Actions.CHEVRON_DOWN, 'chevron-down');
			assert.equal(Actions.LEFT_SEMICIRCULAR_ANTICLOCKWISE_ARROW_2, 'left-semicircular-anticlockwise-arrow-2');
			assert.equal(Actions.EXPAND_1, 'expand-1');
			assert.equal(Actions.EXPAND_DIAGONAL, 'expand-diagonal');
			assert.equal(Actions.COLLAPSE, 'collapse');
			assert.equal(Actions.COLLAPSE_DIAGONAL, 'collapse-diagonal');
			assert.equal(Actions.AGENDA_GAP, 'agenda-gap');
			assert.equal(Actions.EXPAND_TO_FULL_SCREEN, 'expand-to-full-screen');
			assert.equal(Actions.CURVED_ARROW_LEFT, 'curved-arrow-left');
			assert.equal(Actions.FORWARD, 'forward');
			assert.equal(Actions.FORWARD_2, 'forward-2');
			assert.equal(Actions.ARROW_DOWNLOAD, 'arrow-download');
			assert.equal(Actions.PAUSE, 'pause');
			assert.equal(Actions.STOP, 'stop');
			assert.equal(Actions.PLAY, 'play');
			assert.equal(Actions.LEFT_SEMICIRCULAR_ANTICLOCKWISE_ARROW_1, 'left-semicircular-anticlockwise-arrow-1');
			assert.equal(Actions.DOUBLE_SHEVRONS_RIGHT, 'double-shevrons-right');
			assert.equal(Actions.NEXT, 'next');
			assert.equal(Actions.DOWNLOAD_3, 'download-3');
			assert.equal(Actions.UPLOAD, 'upload');
			assert.equal(Actions.SWAP, 'swap');
			assert.equal(Actions.SORT, 'sort');
			assert.equal(Actions.LEFT_SEMICIRCULAR_ANTICLOCKWISE_ARROW_3, 'left-semicircular-anticlockwise-arrow-3');
			assert.equal(Actions.LEFT_SEMICIRCULAR_ANTICLOCKWISE_ARROW_4, 'left-semicircular-anticlockwise-arrow-4');
			assert.equal(Actions.DOWNLOAD, 'download');
			assert.equal(Actions.DOWNLOAD_2, 'download-2');
			assert.equal(Actions.DOWNLOAD_DOUBLE, 'download-double');
			assert.equal(Actions.ARROW_TOP_2, 'arrow-top-2');
			assert.equal(Actions.CONVERSION_1, 'conversion-1');
			assert.equal(Actions.CONVERSION_2, 'conversion-2');
			assert.equal(Actions.FORWARD_3, 'forward-3');
			assert.equal(Actions.REPLY, 'reply');
			assert.equal(Actions.FORWARD_2_1, 'forward-2-1');
			assert.equal(Actions.REPLAY_ALL, 'replay-all');
			assert.equal(Actions.OPEN_IN_50, 'open-in-50');
			assert.equal(Actions.OPEN_IN_40, 'open-in-40');
			assert.equal(Actions.OPEN_IN_30, 'open-in-30');
			assert.equal(Actions.REFRESH_1, 'refresh-1');
			assert.equal(Actions.REFRESH_2, 'refresh-2');
			assert.equal(Actions.REFRESH_3, 'refresh-3');
			assert.equal(Actions.REFRESH_4, 'refresh-4');
			assert.equal(Actions.REDO_1, 'redo-1');
			assert.equal(Actions.UNDO_1, 'undo-1');
			assert.equal(Actions.REFRESH_5, 'refresh-5');
			assert.equal(Actions.REDO_2, 'redo-2');
			assert.equal(Actions.REFRESH_6, 'refresh-6');
			assert.equal(Actions.REFRESH_7, 'refresh-7');
			assert.equal(Actions.REFRESH_8, 'refresh-8');
			assert.equal(Actions.SYNC_SETTINGS, 'sync-settings');
			assert.equal(Actions.REFRESH_CLOSED, 'refresh-closed');
			assert.equal(Actions.REFRESH_10, 'refresh-10');
			assert.equal(Actions.CROSS_CIRCLE_50, 'cross-circle-50');
			assert.equal(Actions.CROSS_CIRCLE_60, 'cross-circle-60');
			assert.equal(Actions.CROSS_CIRCLE_70, 'cross-circle-70');
			assert.equal(Actions.CROSS_20, 'cross-20');
			assert.equal(Actions.CROSS_25, 'cross-25');
			assert.equal(Actions.CROSS_30, 'cross-30');
			assert.equal(Actions.CROSS_40, 'cross-40');
			assert.equal(Actions.CROSS_45, 'cross-45');
			assert.equal(Actions.CROSS_50, 'cross-50');
			assert.equal(Actions.CROSS_55, 'cross-55');
			assert.equal(Actions.CROSS_60, 'cross-60');
			assert.equal(Actions.PLUS_IN_CIRCLE, 'plus-in-circle');
			assert.equal(Actions.MINUS_IN_CIRCLE, 'minus-in-circle');
			assert.equal(Actions.MINUS_20, 'minus-20');
			assert.equal(Actions.MINUS_30, 'minus-30');
			assert.equal(Actions.MINUS_40, 'minus-40');
			assert.equal(Actions.MINUS_50, 'minus-50');
			assert.equal(Actions.MINUS_60, 'minus-60');
			assert.equal(Actions.LINE, 'line');
			assert.equal(Actions.PLUS_20, 'plus-20');
			assert.equal(Actions.PLUS_30, 'plus-30');
			assert.equal(Actions.PLUS_40, 'plus-40');
			assert.equal(Actions.PLUS_50, 'plus-50');
			assert.equal(Actions.PLUS_60, 'plus-60');
			assert.equal(Actions.MORE_9_CUBES, 'more-9-cubes');
			assert.equal(Actions.MORE_9_CUBES_2, 'more-9-cubes-2');
			assert.equal(Actions.CUBES_4_1, '4-cubes-1');
			assert.equal(Actions.CUBES_4_2, '4-cubes-2');
			assert.equal(Actions.MORE, 'more');
			assert.equal(Actions.SETTINGS_1, 'settings-1');
			assert.equal(Actions.SETTINGS_2, 'settings-2');
			assert.equal(Actions.SETTINGS_3, 'settings-3');
			assert.equal(Actions.SETTINGS_4, 'settings-4');
			assert.equal(Actions.COPY_PLATES, 'copy-plates');
			assert.equal(Actions.PLATES, 'plates');
			assert.equal(Actions.NUMERABLE_LIST, 'numerable-list');
			assert.equal(Actions.LINES, 'lines');
			assert.equal(Actions.PENCIL_DRAW, 'pencil-draw');
			assert.equal(Actions.PENCIL_60, 'pencil-60');
			assert.equal(Actions.PENCIL_50, 'pencil-50');
			assert.equal(Actions.PENCIL_40, 'pencil-40');
			assert.equal(Actions.BRUSH, 'brush');
			assert.equal(Actions.PEN, 'pen');
			assert.equal(Actions.KEYBOARD, 'keyboard');
			assert.equal(Actions.KEYBOARD_2, 'keyboard-2');
			assert.equal(Actions.CONNECTION, 'connection');
			assert.equal(Actions.DISCONNECTION, 'disconnection');
			assert.equal(Actions.IMAGE_ROTATE_LEFT, 'image-rotate-left');
			assert.equal(Actions.IMAGE_ROTATE_RIGHT, 'image-rotate-right');
			assert.equal(Actions.ZOOM_IN, 'zoom-in');
			assert.equal(Actions.ZOOM_OUT, 'zoom-out');
		});
	});

	describe('Social', () => {
		it('should have exactly 37 icons', () => {
			assert.equal(Object.keys(Social).length, 37);
		});

		it('should contain all expected values', () => {
			assert.equal(Social.CLOUD_SIFRE, 'cloud-sifre');
			assert.equal(Social.SKYPE, 'skype');
			assert.equal(Social.VK_LISTS, 'vk-lists');
			assert.equal(Social.TELEGRAM_IN_CIRCLE_1, 'telegram-in-circle-1');
			assert.equal(Social.TELEGRAM, 'telegram');
			assert.equal(Social.TELEGRAM_IN_CIRCLE, 'telegram-in-circle');
			assert.equal(Social.INSTAGRAM, 'instagram');
			assert.equal(Social.INSTAGRAM_FACEBOOK, 'instagram-facebook');
			assert.equal(Social.INSTAGRAM_DIRECT, 'instagram-direct');
			assert.equal(Social.SNOWFLAKE, 'snowflake');
			assert.equal(Social.GLOBE, 'globe');
			assert.equal(Social.FACEBOOK, 'facebook');
			assert.equal(Social.FACEBOOK_CHATS, 'facebook-chats');
			assert.equal(Social.VK, 'vk');
			assert.equal(Social.VIBER, 'viber');
			assert.equal(Social.AVITO, 'avito');
			assert.equal(Social.ODNOKLASSNIKI, 'odnoklassniki');
			assert.equal(Social.WHATSAPP, 'whatsapp');
			assert.equal(Social.SHAPE_1, 'shape-1');
			assert.equal(Social.KIK, 'kik');
			assert.equal(Social.SLACK, 'slack');
			assert.equal(Social.MESSENGER_META, 'messenger-meta');
			assert.equal(Social.MESSENGER, 'messenger');
			assert.equal(Social.VK_SHOP, 'vk-shop');
			assert.equal(Social.WINDOWS, 'windows');
			assert.equal(Social.CALL_INFOMATION, 'call-infomation');
			assert.equal(Social.EVERNOTE, 'evernote');
			assert.equal(Social.GOOGLE_ADS, 'google-ads');
			assert.equal(Social.SHAPE, 'shape');
			assert.equal(Social.WINDOW_SCREEN, 'window-screen');
			assert.equal(Social.EDNA, 'edna');
			assert.equal(Social.CHATS_24, 'chats-24');
			assert.equal(Social.CHATS_COMPUTER, 'chats-computer');
			assert.equal(Social.APPLE_AND_IOS, 'apple-and-ios');
			assert.equal(Social.ANDROID, 'android');
			assert.equal(Social.ZOOM, 'zoom');
			assert.equal(Social.LINUX, 'linux');
		});
	});

	describe('Main', () => {
		it('should have exactly 421 icons', () => {
			assert.equal(Object.keys(Main).length, 421);
		});

		it('should contain key values', () => {
			assert.equal(Main.PERSON, 'person');
			assert.equal(Main.CLOUD_SYNC, 'cloud-sync');
			assert.equal(Main.TELEPHONY_HANDSET_1, 'telephony-handset-1');
			assert.equal(Main.telephony_phonebook_2, 'telephony-phonebook-2');
			assert.equal(Main.COPILOT_AI, 'copilot-ai');
			assert.equal(Main.EARTH_TIME, 'earth-time');
			assert.equal(Main.C1, '1c');
			assert.equal(Main.SUB_TASK, 'subtask');
		});
	});

	describe('ContactCenter', () => {
		it('should have exactly 7 icons', () => {
			assert.equal(Object.keys(ContactCenter).length, 7);
		});

		it('should contain all expected values', () => {
			assert.equal(ContactCenter.DIAL_5, 'dial-5');
			assert.equal(ContactCenter.DIAL_10, 'dial-10');
			assert.equal(ContactCenter.CALL_FORWARDING, 'call-forwarding');
			assert.equal(ContactCenter.MOBILE_STORE, 'mobile-store');
			assert.equal(ContactCenter.MAIL_SENT, 'mail-sent');
			assert.equal(ContactCenter.INCOMING_CALL_SOUND_ON, 'incoming-call-sound-on');
			assert.equal(ContactCenter.SEND_ATTACH_FILE, 'send-attach-file');
		});
	});

	describe('Animated', () => {
		it('should have exactly 2 icons', () => {
			assert.equal(Object.keys(Animated).length, 2);
		});

		it('should contain all expected values', () => {
			assert.equal(Animated.LOADER_CLOCK, 'loader-clock');
			assert.equal(Animated.LOADER_WAIT, 'loader-wait');
		});
	});

	describe('CRM', () => {
		it('should have exactly 72 icons', () => {
			assert.equal(Object.keys(CRM).length, 72);
		});

		it('should contain all expected values', () => {
			assert.equal(CRM.SEND_CONTACT, 'send-contact');
			assert.equal(CRM.BOOK_OPEN, 'book-open');
			assert.equal(CRM.funnel_1, 'funnel-1');
			assert.equal(CRM.CRM_SEARCH, 'crm-search');
			assert.equal(CRM.REFRESH_9, 'refresh-9');
			assert.equal(CRM.CHECK_IN_BOX, 'check-in-box');
			assert.equal(CRM.ARROWS_MEET, 'arrows-meet');
			assert.equal(CRM.CHAT_LINE, 'chat-line');
			assert.equal(CRM.COMMERCIAL_OFFER, 'commercial-offer');
			assert.equal(CRM.FUNNELS, 'funnels');
			assert.equal(CRM.ITEM, 'item');
			assert.equal(CRM.PROPOSAL_SETTINGS, 'proposal-settings');
			assert.equal(CRM.PROPOSAL_DONE, 'proposal-done');
			assert.equal(CRM.PROPOSAL, 'proposal');
			assert.equal(CRM.CRM_GROUP, 'crm-group');
			assert.equal(CRM.CONTACT, 'contact');
			assert.equal(CRM.LEAD, 'lead');
			assert.equal(CRM.INVOICE, 'invoice');
			assert.equal(CRM.STAGES, 'stages');
			assert.equal(CRM.EXCLUSION_LIST, 'exclusion-list');
			assert.equal(CRM.OPEN_CHANNELS, 'open-channels');
			assert.equal(CRM.APPROVED_LIST, 'approved-list crm-checked_1');
			assert.equal(CRM.COMPANY, 'company');
			assert.equal(CRM.COPY_FILE, 'copy-file');
			assert.equal(CRM.GIRD, 'gird');
			assert.equal(CRM.FUNNEL_2, 'funnel-2');
			assert.equal(CRM.STAGE, 'stage');
			assert.equal(CRM.CUSTOMER_CARD, 'customer-card');
			assert.equal(CRM.SMART_ACTIVITIES, 'smart-activities');
			assert.equal(CRM.CHOOSE, 'choose');
			assert.equal(CRM.ADD_FROM_ADRESSBOOK, 'add-from-adressbook');
			assert.equal(CRM.ADD_FILE, 'add-file');
			assert.equal(CRM.RECEIVE_PAYMENT_SETTINGS, 'receive-payment-settings');
			assert.equal(CRM.TIMELINE, 'timeline');
			assert.equal(CRM.FORM_SETTINGS, 'form-settings');
			assert.equal(CRM.CUSTOMER_CARDS, 'customer-cards');
			assert.equal(CRM.SHOP_LIST, 'shop-list');
			assert.equal(CRM.SHOP_SEEN, 'shop-seen');
			assert.equal(CRM.ADD_FROM_CRM, 'add-from-crm');
			assert.equal(CRM.PAYMENT_AND_DELIVERY, 'payment-and-delivery');
			assert.equal(CRM.SMART_SORT, 'smart-sort');
			assert.equal(CRM.CART_TEXT, 'cart-text');
			assert.equal(CRM.CART, 'cart');
			assert.equal(CRM.CART_IMAGE, 'cart-image');
			assert.equal(CRM.COMMENT_PLUS, 'comment-plus');
			assert.equal(CRM.DEAL_1, 'deal-1');
			assert.equal(CRM.DEAL_PLUS_1, 'deal-plus-1');
			assert.equal(CRM.TIMELINE_PLUS, 'timeline-plus');
			assert.equal(CRM.PLUS_BASED_ON, 'plus-based-on');
			assert.equal(CRM.DEAL, 'deal');
			assert.equal(CRM.CUSTOMER_CARD_1, 'customer-card-1');
			assert.equal(CRM.DEAL_PLUS, 'deal-plus');
			assert.equal(CRM.PERSON_PLUS_2, 'person-plus-2');
			assert.equal(CRM.CITY_PLUS, 'city-plus');
			assert.equal(CRM.CUSTOMER_CARD_PLUS, 'customer-card-plus');
			assert.equal(CRM.CHAT_1, 'chat-1');
			assert.equal(CRM.DIALOGUE_1, 'dialogue-1');
			assert.equal(CRM.BUSINESS_PROCESS, 'business-process');
			assert.equal(CRM.FORM, 'form');
			assert.equal(CRM.WALLET, 'wallet');
			assert.equal(CRM.TAXI, 'taxi');
			assert.equal(CRM.INTERCONNECTION, 'interconnection');
			assert.equal(CRM.REDUCE, 'reduce');
			assert.equal(CRM.DIALOGUE, 'dialogue');
			assert.equal(CRM.DELIVERY_CAR, 'delivery-car');
			assert.equal(CRM.CAR, 'car');
			assert.equal(CRM.CRM_PAYMENT, 'crm-payment');
			assert.equal(CRM.INSERT, 'insert');
			assert.equal(CRM.CRM_LETTERS, 'crm-letters');
			assert.equal(CRM.CRM_MAP, 'crm-map');
			assert.equal(CRM.SEND_FILE, 'send-file');
			assert.equal(CRM.BITRIX_1C, 'bitrix-1c');
		});
	});

	describe('Editor', () => {
		it('should have exactly 62 icons', () => {
			assert.equal(Object.keys(Editor).length, 62);
		});

		it('should contain all expected values', () => {
			assert.equal(Editor.BOLD, 'bold');
			assert.equal(Editor.ITALIC, 'italic');
			assert.equal(Editor.UNDERLINE, 'underline');
			assert.equal(Editor.STRIKETHROUGH, 'strikethrough');
			assert.equal(Editor.TEXT_COLOR, 'text-color');
			assert.equal(Editor.REMOVE_FORMATTING, 'remove-formatting');
			assert.equal(Editor.FONT_SIZE, 'font-size');
			assert.equal(Editor.NUMBERED_LIST, 'numbered-list');
			assert.equal(Editor.BULLETED_LIST, 'bulleted-list');
			assert.equal(Editor.LEFT_ALIGN, 'left-align');
			assert.equal(Editor.TEXT_AMOUNT, 'text-amount');
			assert.equal(Editor.INCERT_IMAGE, 'incert-image');
			assert.equal(Editor.INSERT_EMOJI, 'insert-emoji');
			assert.equal(Editor.INSERT_SPOILER, 'insert-spoiler');
			assert.equal(Editor.REMOVE_FONTSIZE, 'remove-fontsize');
			assert.equal(Editor.VIEWMODE_WYSIWYG, 'viewmode-wysiwyg');
			assert.equal(Editor.VIEWMODE_CODE, 'viewmode-code');
			assert.equal(Editor.VIEWMODE_SPLIT_HOR, 'viewmode-split-hor');
			assert.equal(Editor.VIEWMODE_SPLIT_VER, 'viewmode-split-ver');
			assert.equal(Editor.UNDO, 'undo');
			assert.equal(Editor.REDO, 'redo');
			assert.equal(Editor.HEADER, 'header');
			assert.equal(Editor.ERASER, 'eraser');
			assert.equal(Editor.RULER_AND_PENCIL, 'ruler-and-pencil');
			assert.equal(Editor.PAINT_BUCKET, 'paint-bucket');
			assert.equal(Editor.SERVICE, 'service');
			assert.equal(Editor.TEXT_CHECK, 'text-check');
			assert.equal(Editor.PAINT_BUCKET_FORMATTING, 'paint-bucket-formatting');
			assert.equal(Editor.NEW_FILE, 'new-file');
			assert.equal(Editor.SETTINGS_5, 'settings-5');
			assert.equal(Editor.ANCHOR, 'anchor');
			assert.equal(Editor.SUPERSCRIPT, 'superscript');
			assert.equal(Editor.SUBSCRIPT, 'subscript');
			assert.equal(Editor.HR, 'hr');
			assert.equal(Editor.SPECIAL_CHARACTERS, 'special-characters');
			assert.equal(Editor.CHECK_GRAMMAR, 'check-grammar');
			assert.equal(Editor.BREAKS, 'breaks');
			assert.equal(Editor.PRINT, 'print');
			assert.equal(Editor.UNION, 'union');
			assert.equal(Editor.MENTION, 'mention');
			assert.equal(Editor.ADD_TAG, 'add-tag');
			assert.equal(Editor.ENCLOSE_TEXT_IN_CODE_TAG, 'enclose-text-in-code-tag');
			assert.equal(Editor.TABLE_EDITOR, 'table-editor');
			assert.equal(Editor.BB_CODE_MODE, 'bb-code-mode');
			assert.equal(Editor.FULL_SCREEN, 'full-screen');
			assert.equal(Editor.CENTER_ALIGN, 'center-align');
			assert.equal(Editor.RIGHT_LIGN, 'right-align');
			assert.equal(Editor.JUSTIFY, 'justify');
			assert.equal(Editor.DECREASE_INDENT, 'decrease-indent');
			assert.equal(Editor.INCREASE_INDENT, 'increase-indent');
			assert.equal(Editor.PARAGRAPH_BACKGROUND_COLOUR, 'paragraph-background-colour');
			assert.equal(Editor.FORMATTING, 'formatting');
			assert.equal(Editor.INSERT_VIDEO, 'insert-video');
			assert.equal(Editor.SPEED_0_5, 'speed-0-5');
			assert.equal(Editor.SPEED_0_7, 'speed-0-7');
			assert.equal(Editor.SPEED_1_0, 'speed-1-0');
			assert.equal(Editor.SPEED_1_2, 'speed-1-2');
			assert.equal(Editor.SPEED_1_5, 'speed-1-5');
			assert.equal(Editor.SPEED_1_7, 'speed-1-7');
			assert.equal(Editor.SPEED_2_0, 'speed-2-0');
			assert.equal(Editor.MAKE_LONGER, 'make-longer');
			assert.equal(Editor.MAKE_SHORTER, 'make-shorter');
		});
	});

	describe('Special', () => {
		it('should be empty', () => {
			assert.equal(Object.keys(Special).length, 0);
		});
	});

	describe('Outline', () => {
		it('should have exactly 633 icons', () => {
			assert.equal(Object.keys(Outline).length, 633);
		});

		it('should contain key values', () => {
			assert.equal(Outline.DOUBLE_GIS, 'o-double-gis');
			assert.equal(Outline.THREE_PERSONS, 'o-three-persons');
			assert.equal(Outline.CHECK_L, 'check-l');
			assert.equal(Outline.ARROW_DOWN_L, 'arrow-down-l');
			assert.equal(Outline.BITRIX_GPT, 'bitrix-gpt');
			assert.equal(Outline.O_TEMPLATE_TASK, 'o-template-task');
			assert.equal(Outline.LOCK_2, 'lock-2');
			assert.equal(Outline.KEYBOARD, 'o-keyboard');
			assert.equal(Outline.LOCATION_PLUS, 'o-location-plus');
			assert.equal(Outline.DIGITS_123, 'digits123');
			assert.equal(Outline.PAYMENT_AND_DELIVERY, 'o-payment-and-delivery');
		});
	});

	describe('Solid', () => {
		it('should have exactly 115 icons', () => {
			assert.equal(Object.keys(Solid).length, 115);
		});

		it('should contain key values', () => {
			assert.equal(Solid.THREE_PERSONS, 's-3-persons');
			assert.equal(Solid.ACTIVITY, 's-activity');
			assert.equal(Solid.CROWN_1, 's-crown-1');
			assert.equal(Solid.WALLET, 's-wallet');
		});
	});

	describe('SmallOutline', () => {
		it('should have exactly 43 icons', () => {
			assert.equal(Object.keys(SmallOutline).length, 43);
		});

		it('should contain all expected values', () => {
			assert.equal(SmallOutline.AUDIO_TO_SCRIPT, 'so-audio-to-script');
			assert.equal(SmallOutline.CHECK, 'so-check');
			assert.equal(SmallOutline.CIRCLE_CHECK, 'so-circle-check');
			assert.equal(SmallOutline.CLOCK, 'so-clock');
			assert.equal(SmallOutline.CLOUD_TIME, 'so-cloud-time');
			assert.equal(SmallOutline.CROSS, 'so-cross');
			assert.equal(SmallOutline.DIGITS_24, 'so-digits-24');
			assert.equal(SmallOutline.DOUBLE_CHECK, 'so-double-check');
			assert.equal(SmallOutline.EARTH, 'so-earth');
			assert.equal(SmallOutline.FACEBOOK, 'so-facebook');
			assert.equal(SmallOutline.GIFT, 'so-gift');
			assert.equal(SmallOutline.GLOBE_EXTRANET, 'so-globe-extranet');
			assert.equal(SmallOutline.GROUPME, 'so-groupme');
			assert.equal(SmallOutline.INSTAGRAM, 'so-instagram');
			assert.equal(SmallOutline.KIK, 'so-kik');
			assert.equal(SmallOutline.MAIL, 'so-mail');
			assert.equal(SmallOutline.MENTION, 'so-mention');
			assert.equal(SmallOutline.MESSAGE_2, 'so-message-2');
			assert.equal(SmallOutline.MESSAGE, 'so-message');
			assert.equal(SmallOutline.MESSENGER_META, 'so-messenger-meta');
			assert.equal(SmallOutline.NOTIFICATION_OFF, 'so-notification-off');
			assert.equal(SmallOutline.NOTIFICATION, 'so-notification');
			assert.equal(SmallOutline.OPEN_CHANNELS, 'so-open-channels');
			assert.equal(SmallOutline.PERSON, 'so-person');
			assert.equal(SmallOutline.PIN, 'so-pin');
			assert.equal(SmallOutline.ROBOT, 'so-robot');
			assert.equal(SmallOutline.SKYPE, 'so-skype');
			assert.equal(SmallOutline.SLACK, 'so-slack');
			assert.equal(SmallOutline.SMALL_CROWN, 'so-small-crown');
			assert.equal(SmallOutline.SMALL_HEART, 'so-small-heart');
			assert.equal(SmallOutline.SMALL_PHONE_UP, 'so-small-phone-up');
			assert.equal(SmallOutline.SOUND_OFF, 'so-sound-off');
			assert.equal(SmallOutline.STOP, 'so-stop');
			assert.equal(SmallOutline.TELEGRAM, 'so-telegram');
			assert.equal(SmallOutline.TIMER_DOT, 'so-timer-dot');
			assert.equal(SmallOutline.TRANSCRIPTION, 'so-transcription');
			assert.equal(SmallOutline.TWILLIO, 'so-twillio');
			assert.equal(SmallOutline.UNDO, 'so-undo');
			assert.equal(SmallOutline.UNPIN, 'so-unpin');
			assert.equal(SmallOutline.VACATION, 'so-vacation');
			assert.equal(SmallOutline.VIBER, 'so-viber');
			assert.equal(SmallOutline.VK, 'so-vk');
			assert.equal(SmallOutline.WINDOW_SCREEN, 'so-window-screen');
		});
	});

	describe('Disk', () => {
		it('should have exactly 35 icons', () => {
			assert.equal(Object.keys(Disk).length, 35);
		});

		it('should contain all expected values', () => {
			assert.equal(Disk.DOC, 'doc');
			assert.equal(Disk.DOCX, 'docx');
			assert.equal(Disk.PDF, 'pdf');
			assert.equal(Disk.XLS, 'xls');
			assert.equal(Disk.XLSX, 'xlsx');
			assert.equal(Disk.PPT, 'ppt');
			assert.equal(Disk.PPTX, 'pptx');
			assert.equal(Disk.ZIP, 'zip');
			assert.equal(Disk.RAR, 'rar');
			assert.equal(Disk.ARCHIVE, 'archive');
			assert.equal(Disk.PSD, 'psd');
			assert.equal(Disk.TXT, 'txt');
			assert.equal(Disk.PHP, 'php');
			assert.equal(Disk.BOARD, 'board');
			assert.equal(Disk.ODF, 'odf');
			assert.equal(Disk.ODT, 'odt');
			assert.equal(Disk.ODS, 'ods');
			assert.equal(Disk.ODP, 'odp');
			assert.equal(Disk.AUDIO, 'audio');
			assert.equal(Disk.IMAGE, 'image');
			assert.equal(Disk.VIDEO, 'video');
			assert.equal(Disk.COMPLEX_GRAPHIC, 'complex-graphic');
			assert.equal(Disk.SIGN, 'sign');
			assert.equal(Disk.SCRIPTS, 'scripts');
			assert.equal(Disk.TEXT, 'text');
			assert.equal(Disk.ADD, 'add');
			assert.equal(Disk.PHOTO, 'photo');
			assert.equal(Disk.EMPTY, 'empty');
			assert.equal(Disk.LOADING, 'loading');
			assert.equal(Disk.FOLDER, 'folder');
			assert.equal(Disk.FOLDER_GROUP, 'folder-group');
			assert.equal(Disk.FOLDER_SHARED, 'folder-shared');
			assert.equal(Disk.FOLDER_COLLAB, 'folder-collab');
			assert.equal(Disk.FOLDER_24, 'folder-24');
			assert.equal(Disk.FOLDER_PERSON, 'folder-person');
		});
	});

	describe('DiskCompact', () => {
		it('should have exactly 35 icons', () => {
			assert.equal(Object.keys(DiskCompact).length, 35);
		});

		it('should have same keys as Disk', () => {
			const diskKeys = Object.keys(Disk).sort();
			const diskCompactKeys = Object.keys(DiskCompact).sort();
			assert.deepEqual(diskKeys, diskCompactKeys);
		});

		it('should have -compact suffix for all values', () => {
			for (const [key, value] of Object.entries(DiskCompact))
			{
				const diskValue = Disk[key as keyof typeof Disk];
				assert.equal(value, `${diskValue}-compact`, `DiskCompact.${key} should be "${diskValue}-compact"`);
			}
		});
	});

	describe('Set', () => {
		it('should be a spread of Actions+Social+Main+ContactCenter+CRM+Editor+Special+Animated', () => {
			const expected = {
				...Actions,
				...Social,
				...Main,
				...ContactCenter,
				...CRM,
				...Editor,
				...Special,
				...Animated,
			};
			assert.deepEqual(Set, Object.freeze(expected));
		});

		it('should NOT include Outline, Solid, SmallOutline, Disk, DiskCompact', () => {
			// Check a unique value from each excluded set
			const outlineValue = Object.values(Outline)[0];
			const solidValue = Object.values(Solid)[0];
			const smallOutlineValue = Object.values(SmallOutline)[0];
			const diskValue = Disk.DOC;
			const diskCompactValue = DiskCompact.DOC;

			const setValues = Object.values(Set);
			assert.ok(!setValues.includes(outlineValue) || Object.values({ ...Actions, ...Social, ...Main, ...ContactCenter, ...CRM, ...Editor, ...Special, ...Animated }).includes(outlineValue));
			assert.ok(!setValues.includes(solidValue));
			assert.ok(!setValues.includes(smallOutlineValue));
			// 'doc' may be in Set since Main has some generic names, but 'doc-compact' should not be
			assert.ok(!setValues.includes(diskCompactValue));
		});
	});
});
