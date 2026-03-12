import './css/header.css';

export const StickerPackFormHeader = {
	name: 'StickerPackFormHeader',
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sticker-pack-form-header__container">
			<div class="bx-im-sticker-pack-form-header__image"></div>
			<div class="bx-im-sticker-pack-form-header__content">
				<div class="bx-im-sticker-pack-form-header__title">
					{{ loc('IM_STICKER_PACK_FORM_WELCOME_TITLE') }}
				</div>
				<div class="bx-im-sticker-pack-form-header__description">
					{{ loc('IM_STICKER_PACK_FORM_WELCOME_BODY') }}
				</div>
			</div>
		</div>
	`,
};
