import {
	type WhatsNewBackdropEffect,
	type WhatsNewBackdropFrame,
	type WhatsNewColorScheme,
} from '../../types';
import { BackdropBrush, toBlurRadius, toChannels } from '../brush';

const FULL_TURN = Math.PI * 2;

/*
 * The density of the trail: particles born per hundred pixels the pointer walks. The share of a hundred
 * pixels a frame does not fill is not thrown away but kept for the next one - rounded away every frame, the
 * density would depend on how often the loop draws, and a pointer moving slower than some twenty pixels a
 * frame would leave nothing behind at all.
 */
const PARTICLES_PER_PATH = 5.5;
const PATH = 100;

// A pointer that jumped - a window brought back to the screen, a tab returned to - must not spill a whole
// trail into one frame, so a frame gives this many particles at most and the rest of the path is dropped.
const MAX_PER_FRAME = 6;

// How many particles live at once. The trail of a fast pointer runs into this ceiling and stops growing.
const MAX_PARTICLES = 130;

// Which part of the trail is a soft glint instead of a star.
const GLINT_SHARE = 0.45;

// The radius of a star, in shares of the shorter side of the card.
const STAR_RADIUS_MIN = 0.012;
const STAR_RADIUS_MAX = 0.03;

// Every ninth particle of the trail is a big one, so the trail is not a row of equals.
const BIG_EVERY = 9;
const BIG_GAIN = 1.9;

// A glint is drawn at a share of the radius the star in its place would have had.
const GLINT_RADIUS_MIN = 0.6;
const GLINT_RADIUS_MAX = 1.3;

// How long a particle lives, ms.
const LIFE_MIN = 620;
const LIFE_MAX = 1180;

// The speed a particle is thrown away at, px per frame of 16 ms, and the share of the speed of the pointer
// it takes along.
const SCATTER = 0.9;
const INHERIT = 0.12;

// What a particle keeps of its speed every frame of 16 ms, and what it gains downwards.
const DRAG = 0.94;
const GRAVITY = 0.012;
const FRAME = 16;

// The twinkle of a star: how fast the phase of it runs, per ms, and how far the radius swings with it.
const TWINKLE_PACE = 0.009;
const TWINKLE_DEPTH = 0.12;

// The turn of a star, radians per ms, one way or the other.
const SPIN = 0.0009;

// The shape of a star: four rays, the waist between two of them, and the shorter pair.
const STAR_RAYS = 4;
const STAR_WAIST = 0.44;
const STAR_SHORT = 0.94;
// The brighter heart of a star is the very same shape, drawn small.
const STAR_CORE = 0.42;

// A particle comes up over this share of its life and goes out over the rest of it.
const FADE_IN = 0.15;

// A particle at its dimmest is drawn this much smaller.
const SHRINK = 0.82;

// How solid the three things a particle is drawn of are at the height of its life.
const GLINT_ALPHA = 0.34;
const HALO_ALPHA = 0.22;
const STAR_ALPHA = 0.82;
// The halo of a star is the sprite of a glint blown up around it.
const HALO_GAIN = 2.6;

/*
 * The sprite of a glint: a round fade of the glow of the scheme, baked once per scheme and drawn at every
 * size a particle asks for. It is the one thing an effect of the mockup builds anew for every frame it
 * appears in.
 */
const SPRITE_SIZE = 96;
const SPRITE_STOPS = 8;
const SPRITE_FALLOFF = 4.2;
const SPRITE_ALPHA = 0.7;

// A star is not the colour of the glow of the scheme but that colour lifted towards white: the rays by half
// of the way, the heart of it almost all the way.
const STAR_LIFT = 0.5;
const CORE_LIFT = 0.74;
const CHANNEL_MAX = 255;

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
	rotation: number;
	spin: number;
	// Where the twinkle of the star stands. A glint does not twinkle.
	phase: number;
	life: number;
	fullLife: number;
	glint: boolean;
};

type Place = {
	x: number;
	y: number;
};

const between = (from: number, to: number): number => from + Math.random() * (to - from);

// The colour of the scheme moved towards white by a share of the way left.
const lift = (channels: number[], share: number): string => {
	const run: number[] = channels.map((channel: number) => {
		return Math.round(channel + (CHANNEL_MAX - channel) * share);
	});

	return `rgb(${run[0]}, ${run[1]}, ${run[2]})`;
};

// A four-rayed star around the point the canvas stands at, the rays of one pair shorter than of the other.
const fillStar = (context: CanvasRenderingContext2D, radius: number): void => {
	context.beginPath();

	for (let ray = 0; ray < STAR_RAYS; ray++)
	{
		const angle: number = (ray * FULL_TURN) / STAR_RAYS;
		const length: number = ray % 2 === 0 ? radius : radius * STAR_SHORT;
		const waist: number = angle + FULL_TURN / (STAR_RAYS * 2);

		const tipX: number = Math.cos(angle) * length;
		const tipY: number = Math.sin(angle) * length;

		if (ray === 0)
		{
			context.moveTo(tipX, tipY);
		}
		else
		{
			context.lineTo(tipX, tipY);
		}

		context.lineTo(Math.cos(waist) * radius * STAR_WAIST, Math.sin(waist) * radius * STAR_WAIST);
	}

	context.closePath();
	context.fill();
};

/**
 * The trail of the pointer: little stars and soft glints born along the way it walks, thrown apart, pulled
 * down, twinkling and turning until they burn out. Everything is drawn in the mode of added brightness, so
 * the trail lights the composition up instead of lying on top of it.
 *
 * The composition itself is not the business of this unit: the brush lays it down from its buffer, and the
 * effect only adds what the pointer left. Once the last particle has burnt out the effect says so, and the
 * loop of the engine stands still until the pointer moves again - in the sources of the mockup the frames
 * are counted, and the whole backdrop redrawn with them, over a card nobody has ever touched.
 */
export class SparkleEffect implements WhatsNewBackdropEffect
{
	#brush: BackdropBrush;

	#particles: Particle[] = [];
	// Where the pointer was on the previous frame, and how much of a hundred pixels of the path is left
	// unspent. Both are lost the moment the pointer leaves the card: the way back in is not a path walked.
	#trail: Place | null = null;
	#path: number = 0;
	// How many particles the trail has ever born. Every ninth of them is a big one.
	#born: number = 0;

	#sprite: HTMLCanvasElement = document.createElement('canvas');
	#starColor: string = '';
	#coreColor: string = '';
	// Whether the colour of the scheme was read at all. A colour that does not read leaves the effect with no
	// star to draw, and that is a refusal: the engine keeps the static composition.
	#hasColors: boolean = false;

	// The token is read off the canvas once: the styles of the portal do not change under a window that is
	// already open.
	#blur: number | null = null;

	constructor(scheme: WhatsNewColorScheme)
	{
		this.#brush = new BackdropBrush(scheme);
		this.#sprite.width = SPRITE_SIZE;
		this.#sprite.height = SPRITE_SIZE;
		this.#applyScheme(scheme);
	}

	// The one path of refusal the contract of an effect has: the engine takes the canvas away and the card
	// keeps the static composition it already stands on.
	prepare(): boolean
	{
		return this.#hasColors;
	}

	draw(frame: WhatsNewBackdropFrame): void
	{
		const { context, width, height, time, delta } = frame;

		this.#brush.paint(context, {
			width,
			height,
			time,
			blur: this.#requireBlur(context.canvas),
		});

		this.#trace(frame);
		this.#live(delta);
		this.#paint(context);
	}

	// The trail is everything this effect draws: with no particle left there is nothing to count a frame for.
	isResting(): boolean
	{
		return this.#particles.length === 0;
	}

	// How many particles are alive. The count is the only way from the outside to tell a trail that keeps
	// within its ceiling from one that grows without end.
	getParticleCount(): number
	{
		return this.#particles.length;
	}

	setScheme(scheme: WhatsNewColorScheme): void
	{
		this.#brush.setScheme(scheme);
		this.#applyScheme(scheme);
	}

	destroy(): void
	{
		this.#brush.destroy();
		this.#particles = [];
		this.#trail = null;

		// A canvas of no size holds no memory.
		this.#sprite.width = 0;
		this.#sprite.height = 0;
	}

	/*
	 * The colours a particle is drawn with are the glow of the scheme and nothing else, so they are read once
	 * per scheme and not once per particle. A glow that does not read leaves the colours the effect had: the
	 * palette of the component is the only source of them, so this is a refusal of the effect and not a state
	 * to draw around.
	 */
	#applyScheme(scheme: WhatsNewColorScheme): void
	{
		const channels: number[] | null = toChannels(scheme.glow);
		if (!channels)
		{
			return;
		}

		this.#starColor = lift(channels, STAR_LIFT);
		this.#coreColor = lift(channels, CORE_LIFT);
		this.#hasColors = true;
		this.#bakeSprite(channels);
	}

	#bakeSprite(channels: number[]): void
	{
		const context: CanvasRenderingContext2D | null = this.#sprite.getContext('2d');
		if (!context)
		{
			return;
		}

		const centre: number = SPRITE_SIZE / 2;
		const gradient: CanvasGradient = context.createRadialGradient(centre, centre, 0, centre, centre, centre);

		for (let stop = 0; stop <= SPRITE_STOPS; stop++)
		{
			const share: number = stop / SPRITE_STOPS;
			const alpha: number = Math.exp(-SPRITE_FALLOFF * share * share) * SPRITE_ALPHA;

			gradient.addColorStop(share, `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`);
		}

		context.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
		context.fillStyle = gradient;
		context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
	}

	#requireBlur(canvas: HTMLCanvasElement): number
	{
		this.#blur ??= toBlurRadius(canvas);

		return this.#blur;
	}

	// Sows the piece of the path the pointer has walked since the previous frame.
	#trace({ pointer, width, height, delta }: WhatsNewBackdropFrame): void
	{
		if (!pointer.inside)
		{
			this.#trail = null;
			this.#path = 0;

			return;
		}

		const place: Place = { x: pointer.x * width, y: pointer.y * height };
		const from: Place | null = this.#trail;
		this.#trail = place;

		if (!from)
		{
			return;
		}

		const dx: number = place.x - from.x;
		const dy: number = place.y - from.y;
		const walked: number = Math.hypot(dx, dy);
		if (walked === 0)
		{
			return;
		}

		this.#path += (walked / PATH) * PARTICLES_PER_PATH;

		const count: number = Math.min(Math.floor(this.#path), MAX_PER_FRAME);
		this.#path = count === MAX_PER_FRAME ? 0 : this.#path - count;

		const side: number = Math.min(width, height);

		for (let born = 1; born <= count; born++)
		{
			const share: number = born / count;

			this.#spawn(from.x + dx * share, from.y + dy * share, dx / delta, dy / delta, side);
		}
	}

	#spawn(x: number, y: number, speedX: number, speedY: number, side: number): void
	{
		if (this.#particles.length >= MAX_PARTICLES)
		{
			return;
		}

		const big: boolean = this.#born % BIG_EVERY === 0;
		const glint: boolean = Math.random() < GLINT_SHARE;
		const star: number = side * between(STAR_RADIUS_MIN, STAR_RADIUS_MAX) * (big ? BIG_GAIN : 1);
		const angle: number = Math.random() * FULL_TURN;
		const scatter: number = Math.random() * SCATTER;
		const life: number = between(LIFE_MIN, LIFE_MAX);

		this.#particles.push({
			x,
			y,
			vx: Math.cos(angle) * scatter + speedX * INHERIT,
			vy: Math.sin(angle) * scatter + speedY * INHERIT,
			radius: glint ? star * between(GLINT_RADIUS_MIN, GLINT_RADIUS_MAX) : star,
			rotation: Math.random() * Math.PI,
			spin: (Math.random() * 2 - 1) * SPIN,
			phase: Math.random() * FULL_TURN,
			life,
			fullLife: life,
			glint,
		});

		this.#born += 1;
	}

	// Moves what is alive and buries what is not. The array is walked from the end, so that a particle taken
	// out of it never moves the ones not looked at yet.
	#live(delta: number): void
	{
		const step: number = delta / FRAME;
		const drag: number = DRAG ** step;

		for (let at = this.#particles.length - 1; at >= 0; at--)
		{
			const particle: Particle = this.#particles[at];

			particle.life -= delta;
			if (particle.life <= 0)
			{
				this.#particles.splice(at, 1);

				continue;
			}

			particle.vy += GRAVITY * step;
			particle.x += particle.vx * step;
			particle.y += particle.vy * step;
			particle.vx *= drag;
			particle.vy *= drag;
			particle.rotation += particle.spin * delta;
			particle.phase += TWINKLE_PACE * delta;
		}
	}

	#paint(context: CanvasRenderingContext2D): void
	{
		if (this.#particles.length === 0)
		{
			return;
		}

		context.save();
		context.globalCompositeOperation = 'lighter';

		this.#particles.forEach((particle: Particle) => this.#paintParticle(context, particle));

		context.restore();
	}

	#paintParticle(context: CanvasRenderingContext2D, particle: Particle): void
	{
		const left: number = particle.life / particle.fullLife;
		const fade: number = left > 1 - FADE_IN ? (1 - left) / FADE_IN : left / (1 - FADE_IN);
		const twinkle: number = particle.glint ? 1 : 1 + Math.sin(particle.phase) * TWINKLE_DEPTH;
		const radius: number = particle.radius * twinkle * (SHRINK + (1 - SHRINK) * fade);

		if (particle.glint)
		{
			context.globalAlpha = GLINT_ALPHA * fade;
			this.#drawSprite(context, particle, radius);

			return;
		}

		context.globalAlpha = HALO_ALPHA * fade;
		this.#drawSprite(context, particle, radius * HALO_GAIN);

		context.globalAlpha = STAR_ALPHA * fade;
		context.save();
		context.translate(particle.x, particle.y);
		context.rotate(particle.rotation);

		context.fillStyle = this.#starColor;
		fillStar(context, radius);
		context.fillStyle = this.#coreColor;
		fillStar(context, radius * STAR_CORE);

		context.restore();
	}

	#drawSprite(context: CanvasRenderingContext2D, { x, y }: Place, radius: number): void
	{
		context.drawImage(this.#sprite, x - radius, y - radius, radius * 2, radius * 2);
	}
}
