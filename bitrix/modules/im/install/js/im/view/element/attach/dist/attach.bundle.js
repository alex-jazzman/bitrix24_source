/* eslint-disable */
(function (ui_designTokens, ui_vue, im_model, im_lib_utils) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Delimiter (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeDelimiter = {
		property: 'DELIMITER',
		name: 'bx-im-view-element-attach-delimiter',
		component: {
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			computed: {
				styles() {
					return {
						width: this.config.DELIMITER.SIZE ? this.config.DELIMITER.SIZE + 'px' : '',
						backgroundColor: this.config.DELIMITER.COLOR ? this.config.DELIMITER.COLOR : this.color
					};
				}
			},
			template: `<div class="bx-im-element-attach-type-delimiter" :style="styles"></div>`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * File (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeFile = {
		property: 'FILE',
		name: 'bx-im-element-attach-file',
		component: {
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			methods: {
				openLink(element) {
					im_lib_utils.Utils.platform.openNewPage(element.LINK);
				},
				file() {
					return {
						name: this.config.FILE.NAME,
						extension: this.config.FILE.NAME.split('.').splice(-1)[0],
						size: this.config.FILE.SIZE
					};
				},
				fileName(element) {
					let maxLength = 70;
					if (!element.NAME || element.NAME.length < maxLength) {
						return element.NAME;
					}
					let endWordLength = 10;
					let extension = element.NAME.split('.').splice(-1)[0];
					let secondPart = element.NAME.substring(element.NAME.length - 1 - (extension.length + 1 + endWordLength));
					let firstPart = element.NAME.substring(0, maxLength - secondPart.length - 3);
					return firstPart.trim() + '...' + secondPart.trim();
				},
				fileNameFull(element) {
					return element.NAME;
				},
				fileSize(element) {
					let size = element.SIZE;
					if (!size || size <= 0) {
						size = 0;
					}
					let sizes = ["BYTE", "KB", "MB", "GB", "TB"];
					let position = 0;
					while (size >= 1024 && position < 4) {
						size /= 1024;
						position++;
					}
					return Math.round(size) + " " + this.$Bitrix.Loc.getMessage('IM_MESSENGER_ATTACH_FILE_SIZE_' + sizes[position]);
				},
				fileIcon(element) {
					return im_model.FilesModel.getIconType(element.NAME.split('.').splice(-1)[0]);
				}
			},
			template: `
			<div class="bx-im-element-attach-type-file-element">
				<template v-for="(element, index) in config.FILE">
					<div class="bx-im-element-attach-type-file" @click="openLink(element)">
						<div class="bx-im-element-attach-type-file-icon">
							<div :class="['ui-icon', 'ui-icon-file-'+fileIcon(element)]"><i></i></div>
						</div>
						<div class="bx-im-element-attach-type-file-block">
							<div class="bx-im-element-attach-type-file-name" :title="fileNameFull(element)">
								{{fileName(element)}}
							</div>
							<div class="bx-im-element-attach-type-file-size">{{fileSize(element)}}</div>
						</div>
					</div>
				</template>
			</div>
		`
		}
	};

	const AttachLinks = {
		methods: {
			openLink(event) {
				const element = event.element;
				const eventData = event.event;
				if (!im_lib_utils.Utils.platform.isBitrixMobile() && element.LINK) {
					return;
				}
				if (element.LINK && eventData.target.tagName !== 'A') {
					im_lib_utils.Utils.platform.openNewPage(element.LINK);
				} else if (!element.LINK) {
					const entity = {
						id: null,
						type: null
					};
					if (element.hasOwnProperty('USER_ID') && element.USER_ID > 0) {
						entity.id = element.USER_ID;
						entity.type = 'user';
					}
					if (element.hasOwnProperty('CHAT_ID') && element.CHAT_ID > 0) {
						entity.id = element.CHAT_ID;
						entity.type = 'chat';
					}
					if (entity.id && entity.type && window.top['BXIM']) {
						const popupAngle = !BX.MessengerTheme.isDark();
						window.top['BXIM'].messenger.openPopupExternalData(eventData.target, entity.type, popupAngle, {
							'ID': entity.id
						});
					} else if (navigator.userAgent.toLowerCase().includes('bitrixmobile')) {
						let dialogId = '';
						if (entity.type === 'chat') {
							dialogId = `chat${entity.id}`;
						} else {
							dialogId = entity.id;
						}
						if (dialogId !== '') {
							BXMobileApp.Events.postToComponent("onOpenDialog", [{
								dialogId: dialogId
							}, true], 'im.recent');
						}
					}
				}
			}
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Grid (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeGrid = {
		property: 'GRID',
		name: 'bx-im-view-element-attach-grid',
		component: {
			mixins: [AttachLinks],
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			created() {
				if (im_lib_utils.Utils.platform.isBitrixMobile()) {
					this.maxCellWith = Math.floor(Math.min(screen.availWidth, screen.availHeight) / 4);
				} else {
					this.maxCellWith = null;
				}
			},
			methods: {
				getWidth(element) {
					if (element.DISPLAY !== 'row') {
						return element.WIDTH ? element.WIDTH + 'px' : '';
					}
					if (!element.VALUE) {
						return false;
					}
					if (this.maxCellWith && element.WIDTH > this.maxCellWith) {
						return this.maxCellWith + 'px';
					}
					return element.WIDTH ? element.WIDTH + 'px' : '';
				},
				getValueColor(element) {
					if (!element.COLOR) {
						return false;
					}
					return element.COLOR;
				},
				getValue(element) {
					if (!element.VALUE) {
						return '';
					}
					return im_lib_utils.Utils.text.decode(element.VALUE);
				}
			},
			//language=Vue
			template: `
			<div class="bx-im-element-attach-type-grid">
				<template v-for="(element, index) in config.GRID">
					<template v-if="element.DISPLAY.toLowerCase() === 'block'">
						<div class="bx-im-element-attach-type-grid-display bx-im-element-attach-type-display-block" :style="{width: getWidth(element)}">
							<div class="bx-im-element-attach-type-grid-element-name">{{element.NAME}}</div>
							<template v-if="element.LINK">
								<div class="bx-im-element-attach-type-grid-element-value bx-im-element-attach-type-grid-element-value-link">
									<a :href="element.LINK" target="_blank" @click="openLink({element: element, event: $event})" :style="{color: getValueColor(element)}" v-html="getValue(element)"></a>
								</div>
							</template>
							<template v-else>
								<div class="bx-im-element-attach-type-grid-element-value" :style="{color: getValueColor(element)}" v-html="getValue(element)"></div>
							</template>
						</div>
					</template>
					<template v-else-if="element.DISPLAY.toLowerCase() === 'line'">
						<div class="bx-im-element-attach-type-grid-display bx-im-element-attach-type-display-card" :style="{width: getWidth(element)}">
							<div class="bx-im-element-attach-type-grid-element-name">{{element.NAME}}</div>
							<template v-if="element.LINK">
								<div
									class="bx-im-element-attach-type-grid-element-value bx-im-element-attach-type-grid-element-value-link"
									:style="{color: element.COLOR? element.COLOR: ''}"
								>
									<a :href="element.LINK" target="_blank" @click="openLink({element: element, event: $event})" v-html="getValue(element)"></a>
								</div>
							</template>
							<template v-else>
								<div class="bx-im-element-attach-type-grid-element-value" :style="{color: element.COLOR? element.COLOR: ''}" v-html="getValue(element)"></div>
							</template>
						</div>
					</template>
					<template v-else-if="element.DISPLAY.toLowerCase() === 'row'">
						<div class="bx-im-element-attach-type-grid-display bx-im-element-attach-type-display-column">
							<table class="bx-im-element-attach-type-display-column-table">
								<tbody>
									<tr>
										<template v-if="element.NAME">
											<td class="bx-im-element-attach-type-grid-element-name" :colspan="element.VALUE? 1: 2" :style="{width: getWidth(element)}">{{element.NAME}}</td>
										</template>
										<template v-if="element.VALUE">
											<template v-if="element.LINK">
												<td
													class="bx-im-element-attach-type-grid-element-value bx-im-element-attach-type-grid-element-value-link"
													:colspan="element.NAME? 1: 2"
													:style="{color: element.COLOR? element.COLOR: ''}"
												>
													<a :href="element.LINK" target="_blank" @click="openLink({element: element, event: $event})" v-html="getValue(element)"></a>
												</td>
											</template>
											<template v-else>
												<td class="bx-im-element-attach-type-grid-element-value" :colspan="element.NAME? 1: 2" :style="{color: element.COLOR? element.COLOR: ''}" v-html="getValue(element)"></td>
											</template>
										</template>
									</tr>
								</tbody>
							</table>
						</div>
					</template>
				</template>
			</div>
		`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Rich Attach type
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeHtml = {
		property: 'HTML',
		name: 'bx-im-view-element-attach-html',
		component: {
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			computed: {
				html() {
					const text = this.config.HTML.replace(/&nbsp;/gi, " ");
					return im_lib_utils.Utils.text.decode(text);
				}
			},
			template: `<div class="bx-im-element-attach-type-html" v-html="html"></div>`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Image (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeImage = {
		property: 'IMAGE',
		name: 'bx-im-view-element-attach-image',
		component: {
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			methods: {
				open(file) {
					if (!file) {
						return false;
					}
					if (im_lib_utils.Utils.platform.isBitrixMobile()) {
						// TODO add multiply
						BXMobileApp.UI.Photo.show({
							photos: [{
								url: file
							}],
							default_photo: file
						});
					} else {
						window.open(file, '_blank');
					}
				},
				getImageSize(width, height, maxWidth) {
					let aspectRatio;
					if (width > maxWidth) {
						aspectRatio = maxWidth / width;
					} else {
						aspectRatio = 1;
					}
					return {
						width: width * aspectRatio,
						height: height * aspectRatio
					};
				},
				getElementSource(element) {
					return element.PREVIEW ? element.PREVIEW : element.LINK;
				},
				lazyLoadCallback(event) {
					if (!event.element.style.width) {
						event.element.style.width = event.element.offsetWidth + 'px';
					}
					if (!event.element.style.height) {
						event.element.style.height = event.element.offsetHeight + 'px';
					}
				},
				styleFileSizes(image) {
					if (!(image.WIDTH && image.HEIGHT)) {
						return {
							maxHeight: '100%',
							backgroundSize: 'contain'
						};
					}
					let sizes = this.getImageSize(image.WIDTH, image.HEIGHT, 250);
					return {
						width: sizes.width + 'px',
						height: sizes.height + 'px',
						backgroundSize: sizes.width < 100 || sizes.height < 100 ? 'contain' : 'initial'
					};
				},
				styleBoxSizes(image) {
					if (!(image.WIDTH && image.HEIGHT)) {
						return {
							height: '150px'
						};
					}
					if (parseInt(this.styleFileSizes(image).height) <= 250) {
						return {};
					}
					return {
						height: '280px'
					};
				}
			},
			template: `
			<div class="bx-im-element-attach-type-image">
				<template v-for="(image, index) in config.IMAGE">
					<div class="bx-im-element-attach-type-image-block" @click="open(image.LINK)" :style="styleBoxSizes(image)" :key="index">
						<img v-bx-lazyload="{callback: lazyLoadCallback}"
							class="bx-im-element-attach-type-image-source"
							:data-lazyload-src="getElementSource(image)"
							:style="styleFileSizes(image)"
							:title="image.NAME"
						/>
					</div>
				</template>
			</div>
		`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Link (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeLink = {
		property: 'LINK',
		name: 'bx-im-view-element-attach-link',
		component: {
			mixins: [AttachLinks],
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			methods: {
				getImageConfig(element) {
					return {
						IMAGE: [{
							NAME: element.NAME,
							PREVIEW: element.PREVIEW,
							WIDTH: element.WIDTH,
							HEIGHT: element.HEIGHT
						}]
					};
				},
				getLinkName(element) {
					return element.NAME ? element.NAME : element.LINK;
				},
				getDescription(element) {
					const text = element.HTML ? element.HTML : element.DESC;
					return im_lib_utils.Utils.text.decode(text);
				}
			},
			computed: {
				imageComponentName() {
					return AttachTypeImage.name;
				}
			},
			components: {
				[AttachTypeImage.name]: AttachTypeImage.component
			},
			//language=Vue
			template: `
			<div class="bx-im-element-attach-type-link">
				<template v-for="(element, index) in config.LINK">
					<div class="bx-im-element-attach-type-link-element" :key="index">
						<a 
							v-if="element.LINK"
							:href="element.LINK"
							target="_blank"
							class="bx-im-element-attach-type-link-name" 
							@click="openLink({element: element, event: $event})"
						>
							{{getLinkName(element)}}
						</a>
						<span 
							v-else
							class="bx-im-element-attach-type-ajax-link"
							@click="openLink({element: element, event: $event})"
						>
							{{getLinkName(element)}}
						</span>
						<div v-if="element.DESC || element.HTML" class="bx-im-element-attach-type-link-desc" v-html="getDescription(element)"></div>
						<div 
							v-if="element.PREVIEW" 
							class="bx-im-element-attach-type-link-image"
							@click="openLink({element: element, event: $event})"
						>
							<component :is="imageComponentName" :config="getImageConfig(element)" :color="color"/>
						</div>
					</div>
				</template>
			</div>
		`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Message (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeMessage = {
		property: 'MESSAGE',
		name: 'bx-im-view-element-attach-message',
		component: {
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			computed: {
				message() {
					return im_lib_utils.Utils.text.decode(this.config.MESSAGE);
				}
			},
			template: `<div class="bx-im-element-attach-type-message" v-html="message"></div>`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * Rich (attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeRich = {
		property: 'RICH_LINK',
		name: 'bx-im-view-element-attach-rich',
		component: {
			mixins: [AttachLinks],
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			methods: {
				getImageConfig(element) {
					return {
						IMAGE: [{
							NAME: element.NAME,
							PREVIEW: element.PREVIEW,
							WIDTH: element.WIDTH,
							HEIGHT: element.HEIGHT
						}]
					};
				}
			},
			computed: {
				imageComponentName() {
					return AttachTypeImage.name;
				}
			},
			components: {
				[AttachTypeImage.name]: AttachTypeImage.component
			},
			//language=Vue
			template: `
			<div class="bx-im-element-attach-type-rich">
				<template v-for="(element, index) in config.RICH_LINK">
					<div class="bx-im-element-attach-type-rich-element" :key="index">
						<div v-if="element.PREVIEW" class="bx-im-element-attach-type-rich-image" @click="openLink({element: element, event: $event})">
							<component :is="imageComponentName" :config="getImageConfig(element)" :color="color"/>
						</div>
						<div class="bx-im-element-attach-type-rich-name" @click="openLink({element: element, event: $event})">{{element.NAME}}</div>
						<div v-if="element.HTML || element.DESC" class="bx-im-element-attach-type-rich-desc">{{element.HTML || element.DESC}}</div>
					</div>
				</template>
			</div>
		`
		}
	};

	/**
	 * Bitrix Messenger
	 * Vue component
	 *
	 * User (Attach type)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypeUser = {
		property: 'USER',
		name: 'bx-im-view-element-attach-user',
		component: {
			mixins: [AttachLinks],
			props: {
				config: {
					type: Object,
					default: {}
				},
				color: {
					type: String,
					default: 'transparent'
				}
			},
			methods: {
				getAvatarType(element) {
					if (element.AVATAR) {
						return '';
					}
					let avatarType = 'user';
					if (element.AVATAR_TYPE === 'CHAT') {
						avatarType = 'chat';
					} else if (element.AVATAR_TYPE === 'BOT') {
						avatarType = 'bot';
					}
					return 'bx-im-element-attach-type-user-avatar-type-' + avatarType;
				}
			},
			//language=Vue
			template: `
			<div class="bx-im-element-attach-type-user">
				<template v-for="(element, index) in config.USER">
					<div class="bx-im-element-attach-type-user-body">
						<div class="bx-im-element-attach-type-user-avatar">
							<div :class="['bx-im-element-attach-type-user-avatar-type', getAvatarType(element)]" :style="{backgroundColor: element.AVATAR? '': color}">
								<img v-if="element.AVATAR" 
									v-bx-lazyload
									class="bx-im-element-attach-type-user-avatar-source"
									:data-lazyload-src="element.AVATAR"
								/>
							</div>
						</div>
						<a
							v-if="element.LINK"
							:href="element.LINK" 
							class="bx-im-element-attach-type-user-name"
							target="_blank"
							@click="openLink({element: element, event: $event})"
						>
							{{element.NAME}}
						</a>
						<span v-else @click.prevent="openLink({element: element, event: $event})">
							{{element.NAME}}
						</span>
					</div>
				</template>
			</div>
		`
		}
	};

	/**
	 * Bitrix Messenger
	 * Attach element Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	const AttachTypes = [AttachTypeDelimiter, AttachTypeFile, AttachTypeGrid, AttachTypeHtml, AttachTypeImage, AttachTypeLink, AttachTypeMessage, AttachTypeRich, AttachTypeUser];
	const AttachComponents = {};
	AttachTypes.forEach(attachType => {
		AttachComponents[attachType.name] = attachType.component;
	});
	ui_vue.BitrixVue.component('bx-im-view-element-attach', {
		props: {
			config: {
				type: Object,
				default: {}
			},
			baseColor: {
				type: String,
				default: '#17a3ea'
			}
		},
		methods: {
			getComponentForBlock(block) {
				for (let attachType of AttachTypes) {
					if (typeof block[attachType.property] !== 'undefined') {
						return attachType.name;
					}
				}
				return '';
			}
		},
		computed: {
			color() {
				if (typeof this.config.COLOR === 'undefined' || !this.config.COLOR) {
					return this.baseColor;
				}
				if (this.config.COLOR === 'transparent') {
					return '';
				}
				return this.config.COLOR;
			}
		},
		components: AttachComponents,
		template: `
		<div class="bx-im-element-attach">
			<div v-if="color" class="bx-im-element-attach-border" :style="{borderColor: color}"></div>
			<div class="bx-im-element-attach-content">
				<template v-for="(block, index) in config.BLOCKS">
					<component :is="getComponentForBlock(block)" :config="block" :color="color" :key="index" />
				</template>
			</div>
		</div>
	`
	});

})(BX, BX, BX.Messenger.Model, BX.Messenger.Lib);
//# sourceMappingURL=attach.bundle.js.map
