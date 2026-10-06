/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_popup, main_core, main_loader) {
	'use strict';

	const assetsBaseUrl = '/bitrix/js/main/imageeditor/external/photoeditorsdk/assets';
	const webpAssetPaths = new Set(['frames/imgly_frame_lowpoly_shadow/imgly_frame_lowpoly_shadow_bottom.png', 'frames/imgly_frame_lowpoly_shadow/imgly_frame_lowpoly_shadow_left.png', 'frames/imgly_frame_lowpoly_shadow/imgly_frame_lowpoly_shadow_right.png', 'frames/imgly_frame_lowpoly_shadow/imgly_frame_lowpoly_shadow_top.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_bottom.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_bottom_corner_left.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_bottom_corner_right.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_left.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_right.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_top.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_top_corner_left.png', 'frames/imgly_frame_wood_passepartout/imgly_frame_wood_passepartout_top_corner_right.png', 'stickers/emoticons/background.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_alien.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_angel.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_angry.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_anxious.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_asleep.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_attention.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_baby_chicken.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_batman.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_beer.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_blush.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_boxer.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_business.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_chicken.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_cool.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_cry.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_deceased.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_devil.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_duckface.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_furious.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_grin.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_guitar.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_harry_potter.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_hippie.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_hitman.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_humourous.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_idea.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_impatient.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_kiss.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_kisses.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_laugh.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_loud_cry.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_loving.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_masked.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_music.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_nerd.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_ninja.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_not_speaking_to_you.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_pig.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_pumpkin.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_question.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_rabbit.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_sad.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_sick.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_skateboard.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_skull.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_sleepy.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_smile.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_smoking.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_sobbing.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_star.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_steaming_furious.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_sunbathing.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_tired.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_tongue_out_wink.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_wave.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_wide_grin.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_wink.png', 'stickers/emoticons/stickers/base/imgly_sticker_emoticons_wrestler.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_badge_11.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_badge_18.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_badge_20.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_badge_28.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_badge_32.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_badge_35.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_spray_01.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_spray_03.png', 'stickers/shapes/stickers/base/imgly_sticker_shapes_spray_04.png', 'text-design/images/imgly_text_design_asset_celebrate_03.png', 'text-design/images/imgly_text_design_asset_celebrate_04.png', 'text-design/images/imgly_text_design_asset_celebrate_05.png', 'text-design/images/imgly_text_design_asset_decorative_08.png', 'text-design/images/imgly_text_design_asset_watercolor_01.png', 'text-design/images/imgly_text_design_asset_watercolor_02.png', 'text-design/images/imgly_text_design_asset_watercolor_03.png']);
	const resolveAsset = path => {
		const prefix = `${assetsBaseUrl}/`;
		if (!path.startsWith(prefix)) {
			return path;
		}
		const relativePath = path.slice(prefix.length);
		return webpAssetPaths.has(relativePath) ? path.replace(/\.png$/, '.webp') : path;
	};
	const defaultOptions = {
		controlsOptions: {
			library: false
		},
		preferredRenderer: 'webgl',
		export: {
			type: 'data-url',
			download: false
		},
		megapixels: 2,
		defaultControl: 'filter',
		forceCrop: false,
		assets: {
			baseUrl: assetsBaseUrl,
			resolver: resolveAsset
		}
	};

	const license = {
		owner: 'Bitrix, Inc.',
		version: '2.1',
		enterprise_license: false,
		available_actions: ['magic', 'filter', 'transform', 'sticker', 'text', 'adjustments', 'brush', 'focus', 'frames', 'camera'],
		features: ['adjustment', 'filter', 'focus', 'overlay', 'transform', 'text', 'sticker', 'frame', 'brush', 'camera', 'library', 'export'],
		platform: 'HTML5',
		app_identifiers: [],
		api_token: 'QbbG4guiONSDiVtWkcvw8A',
		domains: ['https://api.photoeditorsdk.com'],
		issued_at: 1534847608,
		expires_at: null,
		signature: 'QgxAUoamxsnyqgFEQIoyj7168MituWvgVbj8VIr5EBjVG0HZSBmDh3XLU+u3NWTC2GUiZ6FB9GGB0Otf6mZ4VlhiXtyE4Xf61tE+PiFt4LPjGlAURCGl1yT9oGVBdWgb8lu8QhZ224g4TmPzNBeA5lDZwOaS/ESOZjltp0T5RE70NMpSPkSj8HEgO5zX2LnBt0kBpVj7xGxiprFzSn8P30m8+9IX0OuwGJ4AJZnLOB97pz1V1/I50RUgyvRDh7esZ/GdqkewRoGUwkybqHC2oQH15koZThKnEJZ9ufw1JyNVeUDmNvDysDdiLh/zGFgx3yVrBzAxfDAMnQhPpHUhgSlOh1W1YA3TKU7itR2vbXs7sd0syUCvAYMHMjgfUvCBfUKG5d2GOhg1jvd3a+wuVeloTEGwWFnhCpuoY7fHc991inKKCfH4EG4aeAJ5dLnFsZznyOxKMTOWMlmsVMRpW5tjNHP9nSDlj5s5XBX2XVVDkp2gj3oU2znUGY/uc8lczDvHpx7s9PRd7lp5U16QMOXujWWY9iYraNzwyqa2mUrxDhS/PSrlgd8F39iadeIE8bJQHLTVZjlanVZEJwx19MuGEBnYc5SWPkauhVCXFhdlrLj2zIzd1KYEEs1sbMQ4H/IVszF9mHBGJXSZCdOweXiWVHeg0o9UvSyS/sVwZjw='
	};

	const locale = {
		pesdk: {
			common: {
				title: {
					error: main_core.Loc.getMessage('IMAGE_EDITOR_ERROR')
				},
				text: {
					loading: main_core.Loc.getMessage('IMAGE_EDITOR_LOADING'),
					updating: main_core.Loc.getMessage('IMAGE_EDITOR_UPDATING')
				},
				button: {
					cancel: main_core.Loc.getMessage('IMAGE_EDITOR_CANCEL')
				}
			},
			editor: {
				button: {
					export: main_core.Loc.getMessage('IMAGE_EDITOR_EXPORT'),
					save: main_core.Loc.getMessage('IMAGE_EDITOR_EXPORT'),
					load: main_core.Loc.getMessage('IMAGE_EDITOR_NEW'),
					close: main_core.Loc.getMessage('IMAGE_EDITOR_CLOSE'),
					newImageChangesLostWarningYes: main_core.Loc.getMessage('IMAGE_EDITOR_YES'),
					newImageChangesLostWarningNo: main_core.Loc.getMessage('IMAGE_EDITOR_NO'),
					discardChangesWarningKeep: main_core.Loc.getMessage('IMAGE_EDITOR_DISCARD_CHANGES_KEEP_CHANGES_BUTTON'),
					discardChangesWarningDiscard: main_core.Loc.getMessage('IMAGE_EDITOR_DISCARD_CHANGES_DISCARD_BUTTON')
				},
				title: {
					newImageChangesLostWarning: main_core.Loc.getMessage('IMAGE_EDITOR_IMAGE_NEW_IMAGE_TITLE'),
					imageResizedWarning_maxMegaPixels: main_core.Loc.getMessage('IMAGE_EDITOR_IMAGE_RESIZED_TITLE'),
					imageResizedWarning_maxDimensions: main_core.Loc.getMessage('IMAGE_EDITOR_IMAGE_RESIZED_TITLE'),
					fontLoadingError: main_core.Loc.getMessage('IMAGE_EDITOR_ERROR_FONT_LOADING_ERROR'),
					discardChangesWarning: main_core.Loc.getMessage('IMAGE_EDITOR_DISCARD_CHANGES_DISCARD_BUTTON')
				},
				text: {
					newImageChangesLostWarning: main_core.Loc.getMessage('IMAGE_EDITOR_IMAGE_NEW_IMAGE_TITLE'),
					imageResizedWarning_maxMegaPixels: main_core.Loc.getMessage('IMAGE_EDITOR_IMAGE_RESIZED_DESCRIPTION'),
					imageResizedWarning_maxDimensions: main_core.Loc.getMessage('IMAGE_EDITOR_IMAGE_RESIZED_DESCRIPTION'),
					renderingError: 'An error has occurred while rendering the image.',
					exporting: main_core.Loc.getMessage('IMAGE_EDITOR_EXPORTING'),
					saving: main_core.Loc.getMessage('IMAGE_EDITOR_EXPORTING'),
					loading: main_core.Loc.getMessage('IMAGE_EDITOR_LOADING'),
					resizing: main_core.Loc.getMessage('IMAGE_EDITOR_RESIZING'),
					loadingFonts: main_core.Loc.getMessage('IMAGE_EDITOR_LOADING_FONTS'),
					// eslint-disable-next-line
					fontLoadingError: 'The following fonts could not be loaded: ${fonts}.',
					webcamUnavailableError: main_core.Loc.getMessage('IMAGE_EDITOR_ERROR_WEBCAM_UNAVAILABLE'),
					invalidFileTypeError: main_core.Loc.getMessage('IMAGE_EDITOR_ERROR_UNSUPPORTED_FILE_TYPE'),
					imageLoadingError: main_core.Loc.getMessage('IMAGE_EDITOR_POPUP_ERROR_MESSAGE_TEXT'),
					discardChangesWarning: 'You have unsaved changes. Are you sure you want to discard the changes?'
				}
			},
			library: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_LIBRARY_TITLE')
				},
				button: {
					fileDropZone: main_core.Loc.getMessage('IMAGE_EDITOR_LIBRARY_DROP_ZONE'),
					fileDropZoneHovered: main_core.Loc.getMessage('IMAGE_EDITOR_LIBRARY_DROP_ZONE_HOVERED')
				},
				placeholder: {
					search: main_core.Loc.getMessage('IMAGE_EDITOR_LIBRARY_SEARCH')
				},
				text: {
					noResults: 'No results'
				}
			},
			transform: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_TITLE')
				},
				dimensions: {
					lock: main_core.Loc.getMessage('IMAGE_EDITOR_LOCK_RESOLUTION')
				},
				button: {
					reset: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_RESET_TO_DEFAULT')
				},
				asset: {
					imgly_transforms_common: {
						name: main_core.Loc.getMessage('IMAGE_EDITOR_COMMON_CROPS'),
						asset: {
							imgly_transform_common_custom: main_core.Loc.getMessage('IMAGE_EDITOR_RATIOS_CUSTOM'),
							imgly_transform_common_square: main_core.Loc.getMessage('IMAGE_EDITOR_RATIOS_SQUARE'),
							'imgly_transform_common_4-3': '4:3',
							'imgly_transform_common_16-9': '16:9'
						}
					},
					imgly_transforms_facebook: {
						name: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_FACEBOOK'),
						asset: {
							imgly_transform_facebook_ad: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_FACEBOOK_AD'),
							imgly_transform_facebook_post: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_FACEBOOK_POST'),
							imgly_transform_facebook_cover: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_FACEBOOK_COVER'),
							imgly_transform_facebook_profile: main_core.Loc.getMessage('IMAGE_EDITOR_TRANSFORM_FACEBOOK_PROFILE')
						}
					}
				},
				placeholder: {
					width: main_core.Loc.getMessage('IMAGE_EDITOR_SIZE_WIDTH'),
					height: main_core.Loc.getMessage('IMAGE_EDITOR_SIZE_WIDTH')
				}
			},
			filter: {
				asset: {
					identity: main_core.Loc.getMessage('IMAGE_EDITOR_FILTERS_NONE'),
					imgly_lut_celsius: 'Inferno',
					imgly_lut_chest: 'Chestnut',
					imgly_lut_fixie: 'Fixie',
					imgly_lut_fridge: 'Fridge',
					imgly_lut_front: 'Sunny 70s',
					imgly_lut_k2: 'Flat Black',
					imgly_lut_mellow: 'Mellow',
					imgly_lut_sin: 'Hard Stuff',
					imgly_lut_texas: 'Oldtimer',
					imgly_lut_ad1920: '1920 A.D.',
					imgly_lut_ancient: 'Ancient',
					imgly_lut_bleached: 'Kalmen',
					imgly_lut_bleachedblue: 'Joran',
					imgly_lut_blues: 'Polaroid',
					imgly_lut_blueshadows: 'Zephyr',
					imgly_lut_breeze: 'Levante',
					imgly_lut_bw: 'Greyed',
					imgly_lut_classic: 'Classic',
					imgly_lut_colorful: 'Colorful',
					imgly_lut_cool: 'Snappy',
					imgly_lut_cottoncandy: 'Cotton Candy',
					imgly_lut_creamy: 'Creamy',
					imgly_lut_eighties: 'Low Fire',
					imgly_lut_elder: 'Colla',
					imgly_lut_evening: 'Sunrise',
					imgly_lut_fall: 'Moss',
					imgly_lut_food: 'Food',
					imgly_lut_glam: 'Glam',
					imgly_lut_gobblin: 'Gobblin',
					imgly_lut_highcarb: 'High Carb',
					imgly_lut_highcontrast: 'High Contrast',
					imgly_lut_k1: 'K1',
					imgly_lut_k6: 'K6',
					imgly_lut_kdynamic: 'Pebble',
					imgly_lut_keen: 'Keen',
					imgly_lut_lenin: 'Lemon',
					imgly_lut_litho: 'Litho',
					imgly_lut_lomo: 'Lomo',
					imgly_lut_lomo100: 'Lomo 100',
					imgly_lut_lucid: 'Lucid',
					imgly_lut_neat: 'Neat',
					imgly_lut_nogreen: 'Pumpkin',
					imgly_lut_orchid: 'Solanus',
					imgly_lut_pale: 'Pale',
					imgly_lut_pitched: 'Pitched',
					imgly_lut_plate: 'Weathered',
					imgly_lut_pola669: 'Green Gap',
					imgly_lut_polasx: 'Pola SX',
					imgly_lut_pro400: 'Pro 400',
					imgly_lut_quozi: 'Quozi',
					imgly_lut_sepiahigh: 'Sepia',
					imgly_lut_settled: 'Settled',
					imgly_lut_seventies: 'Seventies',
					imgly_lut_soft: 'Soft',
					imgly_lut_steel: 'Steel',
					imgly_lut_summer: 'Summer',
					imgly_lut_sunset: 'Golden',
					imgly_lut_tender: 'Tender',
					imgly_lut_twilight: 'Twilight',
					imgly_lut_winter: 'Softy',
					imgly_lut_x400: 'Dusty',
					imgly_duotone_desert: 'Desert',
					imgly_duotone_peach: 'Peach',
					imgly_duotone_clash: 'Clash',
					imgly_duotone_plum: 'Plum',
					imgly_duotone_breezy: 'Breezy',
					imgly_duotone_deepblue: 'Deep Blue',
					imgly_duotone_frog: 'Frog',
					imgly_duotone_sunset: 'Sunset'
				},
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_FILTERS_TITLE')
				}
			},
			adjustments: {
				button: {
					reset: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_RESET')
				},
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT'),
					basics: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_BASIC'),
					refinements: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_REFINEMENTS_1')
				},
				text: {
					brightness: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_BRIGHTNESS'),
					saturation: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_SATURATION'),
					contrast: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_CONTRAST'),
					gamma: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_GAMMA'),
					clarity: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_CLARITY'),
					exposure: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_EXPOSURE'),
					shadows: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_SHADOWS'),
					highlights: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_HIGHLIGHTS'),
					whites: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_WHITES'),
					blacks: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_BLACKS'),
					temperature: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_TEMPERATURE'),
					sharpness: main_core.Loc.getMessage('IMAGE_EDITOR_ADJUSTMENT_SHARPNESS')
				}
			},
			focus: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_FOCUS_TITLE')
				},
				button: {
					none: main_core.Loc.getMessage('IMAGE_EDITOR_FOCUS_NONE'),
					radial: main_core.Loc.getMessage('IMAGE_EDITOR_FOCUS_RADIAL'),
					mirrored: main_core.Loc.getMessage('IMAGE_EDITOR_FOCUS_MIRRORED'),
					linear: main_core.Loc.getMessage('IMAGE_EDITOR_FOCUS_LINEAR'),
					gaussian: main_core.Loc.getMessage('IMAGE_EDITOR_FOCUS_GAUSSIAN')
				}
			},
			text: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_TITLE'),
					font: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_FONT'),
					size: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_SIZE'),
					spacing: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_PARAMS'),
					line: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_LINE_HEIGHT'),
					background: 'Background'
				},
				placeholder: {
					defaultText: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_DEFAULT_TEXT')
				},
				button: {
					new: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_NEW_TEXT')
				}
			},
			textdesign: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_TEXT_DESIGN'),
					input: 'Text'
				},
				button: {
					invert: 'Text as mask',
					new: 'New Text Design'
				}
			},
			sticker: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_STICKERS_TITLE'),
					opacity: main_core.Loc.getMessage('IMAGE_EDITOR_STICKERS_OPACITY')
				},
				text: {
					// eslint-disable-next-line
					stickerLoadingError: 'Failed to load sticker ${path}.'
				},
				button: {
					replace: main_core.Loc.getMessage('IMAGE_EDITOR_STICKERS_REPLACE'),
					new: main_core.Loc.getMessage('IMAGE_EDITOR_STICKERS_NEW'),
					upload: main_core.Loc.getMessage('IMAGE_EDITOR_STICKERS_NEW'),
					fill: main_core.Loc.getMessage('IMAGE_EDITOR_STICKERS_FILL')
				},
				asset: {
					imgly_sticker_custom: 'Eigene Sticker',
					imgly_sticker_emoticons: 'Emoticons',
					imgly_sticker_emoticons_alien: 'Alien',
					imgly_sticker_emoticons_angel: 'Angel',
					imgly_sticker_emoticons_angry: 'Angry',
					imgly_sticker_emoticons_anxious: 'Anxious',
					imgly_sticker_emoticons_asleep: 'Asleep',
					imgly_sticker_emoticons_attention: 'Attention',
					imgly_sticker_emoticons_baby_chicken: 'Baby Chicken',
					imgly_sticker_emoticons_batman: 'Batman',
					imgly_sticker_emoticons_beer: 'Beer',
					imgly_sticker_emoticons_black: 'Black',
					imgly_sticker_emoticons_blue: 'Blue',
					imgly_sticker_emoticons_blush: 'Blush',
					imgly_sticker_emoticons_boxer: 'Boxer',
					imgly_sticker_emoticons_business: 'Business',
					imgly_sticker_emoticons_chicken: 'Chicken',
					imgly_sticker_emoticons_cool: 'Cool',
					imgly_sticker_emoticons_cry: 'Cry',
					imgly_sticker_emoticons_deceased: 'Deceased',
					imgly_sticker_emoticons_devil: 'Devil',
					imgly_sticker_emoticons_duckface: 'Duckface',
					imgly_sticker_emoticons_furious: 'Furious',
					imgly_sticker_emoticons_grin: 'Grin',
					imgly_sticker_emoticons_guitar: 'Guitar',
					imgly_sticker_emoticons_harry_potter: 'Harry Potter',
					imgly_sticker_emoticons_hippie: 'Hippie',
					imgly_sticker_emoticons_hitman: 'Hitman',
					imgly_sticker_emoticons_humourous: 'Humourous',
					imgly_sticker_emoticons_idea: 'Idea',
					imgly_sticker_emoticons_impatient: 'Impatient',
					imgly_sticker_emoticons_kiss: 'Kiss',
					imgly_sticker_emoticons_kisses: 'Kisses',
					imgly_sticker_emoticons_laugh: 'Laugh',
					imgly_sticker_emoticons_loud_cry: 'Loud Cry',
					imgly_sticker_emoticons_loving: 'Loving',
					imgly_sticker_emoticons_masked: 'Masked',
					imgly_sticker_emoticons_music: 'Music',
					imgly_sticker_emoticons_nerd: 'Nerd',
					imgly_sticker_emoticons_ninja: 'Ninja',
					imgly_sticker_emoticons_not_speaking_to_you: 'Not speaking to you',
					imgly_sticker_emoticons_pig: 'Pig',
					imgly_sticker_emoticons_pumpkin: 'Pumpkin',
					imgly_sticker_emoticons_question: 'Question',
					imgly_sticker_emoticons_rabbit: 'Rabbit',
					imgly_sticker_emoticons_sad: 'Sad',
					imgly_sticker_emoticons_sick: 'Sick',
					imgly_sticker_emoticons_skateboard: 'Skateboard',
					imgly_sticker_emoticons_skull: 'Skull',
					imgly_sticker_emoticons_sleepy: 'Sleepy',
					imgly_sticker_emoticons_smile: 'Smile',
					imgly_sticker_emoticons_smoking: 'Smoking',
					imgly_sticker_emoticons_sobbing: 'Sobbing',
					imgly_sticker_emoticons_star: 'Star',
					imgly_sticker_emoticons_steaming_furious: 'Steaming Furious',
					imgly_sticker_emoticons_sunbathing: 'Sunbathing',
					imgly_sticker_emoticons_tired: 'Tired',
					imgly_sticker_emoticons_tongue_out_wink: 'Tongue out wink',
					imgly_sticker_emoticons_wave: 'Wave',
					imgly_sticker_emoticons_wide_grin: 'Wide Grin',
					imgly_sticker_emoticons_wink: 'Wink',
					imgly_sticker_emoticons_wrestler: 'Wrestler',
					imgly_sticker_shapes: 'Shapes',
					imgly_sticker_shapes_arrow_02: 'Arrow 1',
					imgly_sticker_shapes_arrow_03: 'Arrow 2',
					imgly_sticker_shapes_badge_01: 'Badge 1',
					imgly_sticker_shapes_badge_11: 'Badge 5',
					imgly_sticker_shapes_badge_12: 'Badge 6',
					imgly_sticker_shapes_badge_13: 'Badge 7',
					imgly_sticker_shapes_badge_15: 'Badge 8',
					imgly_sticker_shapes_badge_18: 'Badge 9',
					imgly_sticker_shapes_badge_19: 'Badge 10',
					imgly_sticker_shapes_badge_20: 'Badge 11',
					imgly_sticker_shapes_badge_28: 'Badge 12',
					imgly_sticker_shapes_badge_32: 'Badge 13',
					imgly_sticker_shapes_badge_35: 'Badge 14',
					imgly_sticker_shapes_badge_36: 'Badge 15',
					imgly_sticker_shapes_badge_04: 'Badge 2',
					imgly_sticker_shapes_badge_06: 'Badge 3',
					imgly_sticker_shapes_badge_08: 'Badge 4',
					imgly_sticker_shapes_spray_01: 'Spray 1',
					imgly_sticker_shapes_spray_03: 'Spray 2',
					imgly_sticker_shapes_spray_04: 'Spray 3'
				}
			},
			brush: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_BRUSH_TITLE'),
					width: main_core.Loc.getMessage('IMAGE_EDITOR_BRUSH_WIDTH'),
					hardness: main_core.Loc.getMessage('IMAGE_EDITOR_BRUSH_HARDNESS'),
					settings: main_core.Loc.getMessage('IMAGE_EDITOR_BRUSH_SETTINGS')
				}
			},
			frame: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_FRAME_TITLE'),
					opacity: main_core.Loc.getMessage('IMAGE_EDITOR_FRAME_OPACITY'),
					width: main_core.Loc.getMessage('IMAGE_EDITOR_FRAME_WIDTH')
				},
				button: {
					fill: main_core.Loc.getMessage('IMAGE_EDITOR_FRAME_FILL'),
					replace: main_core.Loc.getMessage('IMAGE_EDITOR_FRAME_REPLACE'),
					none: main_core.Loc.getMessage('IMAGE_EDITOR_FRAME_NONE')
				},
				asset: {
					imgly_frame_dia: 'Dia',
					imgly_frame_art_decor: 'Art Decor',
					imgly_frame_black_passepartout: 'Black Passepartout',
					imgly_frame_lowpoly_shadow: 'Low Poly',
					imgly_frame_wood_passepartout: 'Wood Passepartout'
				}
			},
			artfilter: {
				title: {
					name: 'Art Filters'
				},
				asset: {
					none: 'None',
					imgly_art_filter_june_tree: 'Natasha Wescoat',
					imgly_art_filter_hive: 'Hive',
					imgly_art_filter_udnie: 'Udnie',
					imgly_art_filter_vince_low: 'Vince Low',
					imgly_art_filter_mosaic: 'Mosaic',
					imgly_art_filter_wave: 'Wave',
					imgly_art_filter_watercolor: 'Malikova Darya'
				}
			},
			overlay: {
				title: {
					name: main_core.Loc.getMessage('IMAGE_EDITOR_OVERLAY_TITLE'),
					blending: 'Blending',
					none: 'None',
					normal: 'Normal',
					overlay: 'Overlay',
					hardLight: 'Hard Light',
					softLight: 'Soft Light',
					multiply: 'Multiply',
					darken: 'Darken',
					lighten: 'Lighten',
					screen: 'Screen',
					colorBurn: 'Color Burn'
				},
				button: {
					none: main_core.Loc.getMessage('IMAGE_EDITOR_OVERLAY_NONE')
				},
				asset: {
					imgly_overlay_bokeh: 'Bokeh',
					imgly_overlay_chop: 'Chop',
					imgly_overlay_clouds: 'Clouds',
					imgly_overlay_golden: 'Golden',
					imgly_overlay_grain: 'Grain',
					imgly_overlay_hearts: 'Hearts',
					imgly_overlay_lightleak1: 'Light Leak 1',
					imgly_overlay_lightleak2: 'Light Leak 2',
					imgly_overlay_metal: 'Metal',
					imgly_overlay_mosaic: 'Mosaic',
					imgly_overlay_painting: 'Painting',
					imgly_overlay_paper: 'Paper',
					imgly_overlay_rain: 'Rain',
					imgly_overlay_vintage: 'Vintage',
					imgly_overlay_wall1: 'Wall',
					imgly_overlay_wall2: 'Wall 2',
					imgly_overlay_wood: 'Wood'
				}
			}
		}
	};

	function loadImage({
		src,
		proxy
	}) {
		return new Promise((resolve, reject) => {
			const imageSrc = (() => {
				const srcUri = new main_core.Uri(src);
				const srcHost = srcUri.getHost();
				if (srcHost === '' || srcHost === window.location.host || srcHost === window.location.hostname) {
					return src;
				}
				if (main_core.Type.isString(proxy)) {
					return main_core.Uri.addParam(proxy, {
						sessid: BX.bitrix_sessid(),
						url: src
					});
				}
				return src;
			})();
			const image = (() => {
				if (main_core.Type.isString(imageSrc)) {
					const newImage = new Image();
					newImage.src = imageSrc;
					return newImage;
				}
				return image;
			})();
			if (main_core.Type.isDomNode(image) && image instanceof HTMLImageElement) {
				if (image.complete) {
					resolve(image);
					return;
				}
				image.onload = () => resolve(image);
				image.onerror = reject;
			}
		});
	}

	function getFileName(src) {
		if (main_core.Type.isString(src)) {
			return src.split('/').pop();
		}
		return '';
	}

	function changeFileExtension(fileName, extension) {
		if (main_core.Type.isString(fileName) && main_core.Type.isString(extension)) {
			const index = fileName.lastIndexOf('.');
			if (index > 0) {
				return `${fileName.substr(0, index)}.${extension}`;
			}
		}
		return fileName;
	}

	function adjustTransformOptions(transform) {
		if (main_core.Type.isPlainObject(transform)) {
			const {
				categories
			} = transform;
			if (main_core.Type.isArray(categories)) {
				categories.forEach(({
					ratios
				}) => {
					if (main_core.Type.isArray(ratios)) {
						ratios.forEach(ratio => {
							if (BX.type.isPlainObject(ratio) && BX.type.isPlainObject(ratio.dimensions)) {
								ratio.dimensions = new window.PhotoEditorSDK.Math.Vector2(ratio.dimensions.width, ratio.dimensions.height);
							}
						});
					}
				});
			}
		}
		return transform;
	}

	const onPopupClose = Symbol('onPopupClose');
	const onWindowResize = Symbol('onWindowResize');
	const onEditorExport = Symbol('onEditorExport');
	const onEditorClose = Symbol('onEditorClose');
	const currentImage = Symbol('currentImage');
	const resolver = Symbol('resolver');
	class ImageEditor {
		static getInstance() {
			if (!ImageEditor.instance) {
				ImageEditor.instance = new ImageEditor();
			}
			return ImageEditor.instance;
		}
		static ratio = {
			CUSTOM: 'imgly_transform_common_custom',
			SQUARE: 'imgly_transform_common_square',
			'4/3': 'imgly_transform_common_4-3',
			'16/9': 'imgly_transform_common_16-9',
			PROFILE: 'imgly_transform_facebook_profile',
			FB_AD: 'imgly_transform_facebook_ad',
			FB_POST: 'imgly_transform_facebook_post',
			FB_COVER: 'imgly_transform_facebook_cover'
		};
		static renderType = {
			BASE64: 'data-url',
			IMAGE: 'image',
			BUFFER: 'buffer',
			BLOB: 'blob',
			MSBLOB: 'ms-blob'
		};
		constructor(options = {}) {
			this.options = options;
			this.SDKInstance = null;
			this[onPopupClose] = this[onPopupClose].bind(this);
			this[onWindowResize] = this[onWindowResize].bind(this);
			this[onEditorExport] = this[onEditorExport].bind(this);
			this[onEditorClose] = this[onEditorClose].bind(this);
			this.cache = new main_core.Cache.MemoryCache();
			this.popup = this.getPopup();
			this.loader = this.getLoader();
			main_core.Event.bind(window, 'resize', this[onWindowResize]);
		}
		getPopup() {
			return this.cache.remember('popup', () => {
				return new main_popup.PopupWindow({
					id: `main-image-editor-${main_core.Text.getRandom()}`,
					width: window.innerWidth - 10,
					height: window.innerHeight - 10,
					zIndex: 900,
					overlay: 0.9,
					noAllPaddings: true,
					className: 'main-image-editor',
					animationOptions: {
						show: {
							className: 'main-image-editor-show',
							eventType: 'animation'
						},
						close: {
							className: 'main-image-editor-close',
							eventType: 'animation'
						}
					},
					events: {
						onPopupClose: this[onPopupClose]
					}
				});
			});
		}
		getLoader() {
			return this.cache.remember('loader', () => {
				return new main_loader.Loader({
					target: this.getPopup().getPopupContainer()
				});
			});
		}
		show() {
			this.getPopup().show();
			main_core.Dom.style(document.documentElement, 'overflow', 'hidden');
		}
		close() {
			this.getPopup().close();
			main_core.Dom.style(document.documentElement, 'overflow', null);
		}
		[onEditorClose]() {
			this.close();
			main_core.Dom.clean(this.popup.contentContainer);
		}
		[onEditorExport](result, editor) {
			const options = editor.getOptions();
			const {
				BASE64
			} = BX.Main.ImageEditor.renderType;
			if (main_core.Type.isPlainObject(options) && main_core.Type.isPlainObject(options.editor) && main_core.Type.isPlainObject(options.editor.export) && options.editor.export.type === BASE64) {
				const [meta, base64] = result.split(',');
				const [, fileExtension] = meta.match(/data:image\/(.*);base64/);
				const fileName = changeFileExtension(getFileName(this[currentImage].src), fileExtension);
				this[resolver]([fileName, base64]);
				this.close();
				return;
			}
			this[resolver](result);
			this.close();
		}
		[onPopupClose]() {
			if (this.SDKInstance) {
				this.SDKInstance.off('export', this[onEditorExport]);
				this.SDKInstance.off('close', this[onEditorClose]);
				this.SDKInstance.dispose();
			}
			BX.onCustomEvent(this, 'BX.Main.ImageEditor:close', [this]);
		}
		[onWindowResize]() {
			const {
				innerWidth,
				innerHeight
			} = window;
			this.getPopup().setWidth(innerWidth - 10);
			this.getPopup().setHeight(innerHeight - 10);
		}
		createErrorMessage() {
			return this.cache.remember('errorMessage', () => {
				const onButtonClick = () => this.getPopup().close();
				return main_core.Tag.render`
				<div class="main-image-editor-error">
					<div class="main-image-editor-error-text">
						${main_core.Loc.getMessage('IMAGE_EDITOR_POPUP_ERROR_MESSAGE_TEXT')}
					</div>
					<div>
						<button class="ui-btn" onclick="${onButtonClick}">
							${main_core.Loc.getMessage('IMAGE_EDITOR_CLOSE_POPUP')}
						</button>
					</div>
				</div>
			`;
			});
		}
		isValidEditOptions(options) {
			return main_core.Type.isDomNode(options) && options instanceof HTMLImageElement || main_core.Type.isString(options) && options.length > 0 || main_core.Type.isPlainObject(options) && this.isValidEditOptions(options.image);
		}
		apply() {
			this.SDKInstance.export();
		}
		edit(options) {
			if (!this.isValidEditOptions(options)) {
				throw new Error('BX.Main.ImageEditor: invalid options. options must be a string, HTMLImageElement or plainObject with image field.');
			}
			const config = (() => {
				const container = this.getPopup().contentContainer;
				if (main_core.Type.isPlainObject(options)) {
					const {
						controlsOptions
					} = options;
					if (main_core.Type.isPlainObject(controlsOptions) && main_core.Type.isPlainObject(controlsOptions.transform)) {
						controlsOptions.transform = adjustTransformOptions(controlsOptions.transform);
					}
					return main_core.Runtime.merge(defaultOptions, options, {
						container
					});
				}
				return {
					...defaultOptions,
					image: options,
					container
				};
			})();
			this.show();
			this.getLoader().show();
			BX.onCustomEvent(this, 'BX.Main.ImageEditor:show', [this]);
			return loadImage({
				src: config.image,
				proxy: config.proxy
			}).then(image => {
				this[currentImage] = image;
				return main_core.Runtime.loadExtension(['main.imageeditor.external.react.production', 'main.imageeditor.external.photoeditorsdk']);
			}).then(() => {
				const {
					DesktopUI
				} = window.PhotoEditorSDK.UI;
				this.SDKInstance = new DesktopUI({
					container: config.container,
					assets: config.assets,
					showHeader: false,
					responsive: true,
					preloader: false,
					versionCheck: false,
					logLevel: 'error',
					language: 'ru',
					editor: {
						preferredRenderer: config.preferredRenderer,
						maxMegaPixels: {
							desktop: config.megapixels
						},
						forceCrop: config.forceCrop,
						displayCloseButton: true,
						export: config.export,
						controlsOptions: config.controlsOptions,
						defaultControl: config.defaultControl,
						image: this[currentImage]
					},
					extensions: {
						languages: {
							ru: locale
						}
					},
					license: JSON.stringify(license)
				});
				this.SDKInstance.on('export', this[onEditorExport]);
				this.SDKInstance.on('close', this[onEditorClose]);
				this.getLoader().hide();
				return new Promise(resolve => {
					this[resolver] = resolve;
				});
			});
		}
	}

	exports.ImageEditor = ImageEditor;

})(this.BX.Main = this.BX.Main || {}, BX.Main, BX, BX);
//# sourceMappingURL=imageeditor.bundle.js.map
