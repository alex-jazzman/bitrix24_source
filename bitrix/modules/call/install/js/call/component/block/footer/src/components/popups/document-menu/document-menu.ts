import { defineComponent } from 'ui.vue3';

import { CallPopup, type CallPopupTarget } from 'call.component.ui.popup';

import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

import './css/document-menu.css';

export const CallFooterDocumentMenu = defineComponent({
	name: 'CallFooterDocumentMenu',
	components: { CallPopup, CallIcon },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	emits: ['hidden'],
	methods: {
		show(target: CallPopupTarget): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.show(target);
		},
		hide(): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.hide();
		},
		toggle(target?: CallPopupTarget): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.toggle(target);
		},
	},
	template: /* HTML */`
		<CallPopup
			ref="popup"
			class-name="call-footer-document-menu-popup"
			background="#00428F"
			@hidden="$emit('hidden')"
		>
			<div class="call-footer-document-menu">
				<div class="call-footer-document-menu__item">
					<span class="call-footer-document-menu__text">{{ loc('CALL_FOOTER_DOCUMENT_MENU_PROTOCOL') }}</span>
				</div>

				<div class="call-footer-document-menu__item-wrapper">
					<div class="call-footer-document-menu__item call-footer-document-menu__item--with-submenu">
						<span class="call-footer-document-menu__text">{{ loc('CALL_FOOTER_DOCUMENT_MENU_CREATE_DOCUMENT') }}</span>
						<CallIcon icon="chevron-right" :size="24" />
					</div>

					<div class="call-document-submenu">
						<div class="call-document-submenu__item">
							<span class="call-document-submenu__text">{{ loc('CALL_FOOTER_DOCUMENT_MENU_DOCUMENT') }}</span>
						</div>
						<div class="call-document-submenu__item">
							<span class="call-document-submenu__text">{{ loc('CALL_FOOTER_DOCUMENT_MENU_TABLE') }}</span>
						</div>
						<div class="call-document-submenu__item">
							<span class="call-document-submenu__text">{{ loc('CALL_FOOTER_DOCUMENT_MENU_PRESENTATION') }}</span>
						</div>
					</div>
				</div>

				<div class="call-footer-document-menu__item">
					<span class="call-footer-document-menu__text">{{ loc('CALL_FOOTER_DOCUMENT_MENU_OPEN_LAST_PROTOCOLS') }}</span>
					<CallIcon icon="chevron-right" :size="24" />
				</div>
			</div>
		</CallPopup>
	`,
});
