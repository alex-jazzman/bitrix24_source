/**
 * The two programs the wall of balloons is drawn by. Everything of the picture lives in the fragment
 * program: it meets the ray of every pixel with every body, takes the nearest surface, lights it and lets
 * the composition of the backdrop through it. The simulation on the processor only says where the bodies
 * stand - see `balloons.ts`.
 *
 * The programs are carried over from the sources of the mockup formula by formula. Nothing here is to be
 * improved: there is nothing to check a changed picture against but those very sources. The comments that
 * explain the numbers are carried over with them - without them the numbers are magic.
 */

/*
 * The most bodies the programs can be handed at once. The arrays of the programs are declared of this very
 * length, so the limit is named here and nowhere else: the simulation fills no more bodies than this, and
 * a wall that would need more is simply cut short.
 */
export const MAX_BALLOONS = 120;

// A full-screen triangle: three vertices and no buffer at all, the place of each counted from its number.
// eslint-disable-next-line unicorn/template-indent -- WebGL2 requires #version on the first line.
export const VERTEX_SOURCE = `#version 300 es
  out vec2 v_uv;
  void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    v_uv = p;
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }
`;

// eslint-disable-next-line unicorn/template-indent -- WebGL2 requires #version on the first line.
export const FRAGMENT_SOURCE = `#version 300 es
  precision highp float;

  in vec2 v_uv;
  out vec4 outColor;

  uniform vec2 u_res;
  uniform int u_count;
  /** xy - the centre in pixels, z - the radius across (and along the depth), w - the radius down. */
  uniform vec4 u_ball[${MAX_BALLOONS}];
  /**
   * x - the shift along the depth (px), y - the tilt of the body (radians), z - the seed of the film,
   * w - how far the pointer presses the body in.
   *
   * The spread along the depth is MICROSCOPIC and is there for one thing only: a steady order of drawing.
   * It used to be large and drew the bodies apart, so that they could lie over one another on the screen
   * without running into each other. Overlaps are forbidden by a decision of the product (2026-08-12): the
   * balloons only TOUCH and crumple a little at the contact, so there is nothing to draw apart - and the
   * facets (the lens on the crossing of two spheres) never show up, because there is next to no crossing.
   */
  uniform vec4 u_extra[${MAX_BALLOONS}];
  uniform sampler2D u_bg;
  /** The direction TOWARDS the light. y is negative: the normals are in the axes of the screen, y grows down. */
  uniform vec3 u_light;
  uniform vec3 u_spark;
  uniform vec3 u_shadow;
  /** The darkening towards the bottom: the strength at the top and at the bottom. */
  uniform vec2 u_scrim;
  /** Seconds since the animation started: it slowly carries the streaks of the film away. */
  uniform float u_time;
  /** xy - the pointer in pixels, z - how far it reaches. z = 0 means there is no pointer. */
  uniform vec3 u_press;

  /* -- The material: the very one of the bubble effect ----------------------------------------------
     A decision of the product (2026-08-13): "take the colour and the look of the balloons from the bubble
     effect". So this is not a recipe of its own but the model of bubble-backdrop.tsx carried over:

       - THE COLOUR OF THE FILM is real interference over the wavelengths: the brightness of a channel goes
         as 1 - cos(2*pi*path/lambda), path = 2*n*d. At a thickness where a whole number of half-waves fits
         the wavelength the reflection is put out and the colour goes to its complement - hence the green
         and purple bands of soap. A cosine "rainbow palette" gives none of that: it draws an even spectrum
         and the balloon looks like an oiled ball;
       - THE SHARE OF THE FILM IS TINY (single per cent) - that is the physics and not caution: a soap film
         reflects just that much, so a bubble is TRANSPARENT and the rainbow lives at the rim, where the
         eye goes along the film;
       - THE BODY is next to not darkened at all - the background reads through the balloon almost without
         loss. The volume is held by the rim, the sheen and the play of colour at the edge;
       - REFRACTION with the channels running apart (the coloured fringe at the rim) and the caustic - the
         lens squeezing the picture adds light.
     The numbers are taken from bubble one to one: these two effects must not drift apart. */
  const float FILM_N = 1.33;
  const float FILM_THICKNESS = 260.0;
  const float FILM_EDGE_GAIN = 0.9;
  const float FILM_FLOW_A = 0.12;
  const float FILM_FLOW_B = 0.07;
  const float LAMBDA_R = 650.0;
  const float LAMBDA_G = 550.0;
  const float LAMBDA_B = 460.0;
  /** The share of the film in the middle and at the rim. */
  const float FILM_MIX_CENTER = 0.004;
  const float FILM_MIX_EDGE = 0.085;
  /**
   * The darkening of the body: the multiplier in the middle and the fall towards the rim.
   *
   * The transparency of the wall is not held by these two numbers alone. The texts of the card lie OVER the
   * backdrop, and what troubles them is not the density of the body (there is next to none of it) but the
   * sheen, the rim, the caustic and the play of the film: that is a bright ripple under the letters. So
   * "make it more transparent" means quieting the light down (SPECULAR, rim, window, CAUSTIC,
   * FILM_MIX_EDGE), and not darkening the body - darkening is exactly what kills the colour of the scheme.
   */
  const float DIM_CENTER = 1.0;
  const float DIM_EDGE_DROP = 0.03;
  /** The strength of the refraction in shares of the radius, and how far the channels run apart at the rim. */
  const float REFRACT = 0.3;
  const float CHROMA = 0.16;
  /** The strength of the caustic. */
  const float CAUSTIC = 0.6;
  /**
   * How many times the semi-axis of the DEPTH is bigger than the radius across.
   *
   * One is a ball (the depth equals the radius). Above one the body bulges TOWARDS the viewer: the surface
   * rises higher, the normals grow steeper, and the shadows between the balloons and the sheen gain
   * strength. A decision of the product (2026-08-13): "let them bulge forward more".
   */
  const float DEPTH_GAIN = 1.4;
  /** The brightness of the sheen. */
  const float SPECULAR = 0.4;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 34.56);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  /** The colour of the film by the optical path (nm). */
  vec3 filmColor(float path) {
    return vec3(
      0.5 - 0.5 * cos(6.28318 * path / LAMBDA_R),
      0.5 - 0.5 * cos(6.28318 * path / LAMBDA_G),
      0.5 - 0.5 * cos(6.28318 * path / LAMBDA_B)
    );
  }

  /**
   * The width of the rounding at the place of the contact, in shares of the radius.
   *
   * The bodies are joined by a SMOOTH maximum: where two balloons meet, the surface does not cross itself
   * with a sharp lens but flows over in a fillet - that is how a squeezed bubble looks in a foam.
   *
   * The balloons do cross a little: the overlap gives density without gaps, and it is not taken away.
   *
   * This is counted anew every time the radii change. The radii were raised twice for the sake of full
   * cover (see RADIUS_OF_CELL_* in the effect), and at a bigger overlap the same smoothing melts the wall
   * into one even mass - so it was narrowed twice. On the gaps it has no bearing at all: those come from
   * the geometry of the layout and not from the smoothing. The balloons have to be STUCK TOGETHER (a
   * decision of the product, 2026-08-13): at the contact the surfaces run into one neck, the way soap
   * bubbles do in a foam. But 0.6 and above at such an overlap melts the wall into ONE lumpy mass - the
   * separate bubbles stop reading; 0.28 and below, the other way round, draws them apart into "balls side
   * by side".
   */
  const float FILLET = 0.4;
  /* -- The pressing in under the pointer -------------------------------------------------------------
     The surface goes in locally, and the normal TILTS with it - without the tilt the dent shows only by
     the silhouette and is next to unreadable. The depth is led by a spring in the simulation, body by
     body, and arrives here ready in u_extra.w.

     There is NO wave over the dent. There used to be one (a shiver of jelly, a sine over the radius and
     the time) and it read as a pulsing wave from the pointer, which is not what should happen: a small
     pressing in is all that is wanted (a decision of the product, 2026-08-13). The depth is small for the
     very same reason. */
  /**
   * The depth of the dent from the pointer, in shares of the radius.
   *
   * Small on purpose: by the balance of the product (2026-08-13) the pointer presses the balloons in
   * WEAKER, and they crumple mostly against one another - that is what CONTACT_SQUASH in the simulation is
   * for.
   */
  const float DENT_DEPTH = 0.34;

  /**
   * How far the shell sags under the pointer at the point p, for a body of radius r and a press of dent.
   * Answers in pixels.
   */
  float dentAt(vec2 p, float r, float dent) {
    if (u_press.z <= 0.0 || dent <= 0.001) return 0.0;
    float d = length(p - u_press.xy) / u_press.z;
    if (d >= 1.0) return 0.0;
    float f = 1.0 - d * d;
    return r * DENT_DEPTH * dent * f * f;
  }

  /**
   * The meeting of an orthographic ray (going along -z) with an ellipsoid.
   * Answers the height of the surface over the plane of the card (px), or -1 if the ray goes past.
   * The ray is upright, so the equation comes down to what is left of the height of a unit sphere.
   */
  float hitZ(vec2 p, vec4 b, float tilt, out vec3 nrm) {
    float c = cos(-tilt), s = sin(-tilt);
    vec2 d = p - b.xy;
    vec2 l = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
    vec2 k = l / vec2(b.z, b.w);
    float q = dot(k, k);
    if (q > 1.0) return -1.0;
    float zn = sqrt(1.0 - q);
    // The semi-axis of the depth is bigger than the radius across (DEPTH_GAIN) - the body bulges towards
    // the viewer. The same semi-axis stands under the z part of the normal, or the light would be counted
    // as if for a ball.
    float rz = b.z * DEPTH_GAIN;
    vec3 n = normalize(vec3(k.x / b.z, k.y / b.w, zn / rz));
    nrm = vec3(n.x * c + n.y * s, -n.x * s + n.y * c, n.z);
    return zn * rz;
  }

  /**
   * Whether another body stands in the way from the point to the light - a real shadow ray.
   * Answers 0 (in the shadow) ... 1 (lit). The softness comes from how close the ray runs to the body and
   * not from a yes-or-no test: a hard shadow on matt latex looks cut out with scissors.
   */
  float lightReach(vec3 pos, vec3 L) {
    float vis = 1.0;
    for (int i = 0; i < ${MAX_BALLOONS}; i++) {
      if (i >= u_count) break;
      vec4 b = u_ball[i];
      vec3 c = vec3(b.xy, u_extra[i].x);
      vec3 sc = vec3(b.z, b.w, b.z);
      // In the space where the body is a unit sphere: the offset and the direction are divided by the radii.
      vec3 o = (pos - c) / sc;
      vec3 dir = normalize(L / sc);
      float tca = dot(-o, dir);
      if (tca < 0.02) continue;               // the body is behind the point - it casts nothing
      float d2 = dot(o, o) - tca * tca;       // the square of the distance from the centre to the ray
      if (d2 > 1.0) continue;                 // the ray goes past
      // The deeper the ray goes into the body, the denser the shadow.
      vis *= smoothstep(0.0, 1.0, d2);
    }
    return clamp(vis, 0.0, 1.0);
  }

  void main() {
    vec2 p = vec2(v_uv.x, 1.0 - v_uv.y) * u_res;
    vec3 bg = texture(u_bg, vec2(v_uv.x, 1.0 - v_uv.y)).rgb;

    float bestZ = -1.0;
    float secondZ = -1.0;
    float bestR = 1.0;
    vec3 bestN = vec3(0.0);

    float bestSeed = 0.0;
    for (int i = 0; i < ${MAX_BALLOONS}; i++) {
      if (i >= u_count) break;
      vec4 b = u_ball[i];
      vec3 n;
      float z = hitZ(p, b, u_extra[i].y, n);
      if (z <= 0.0) continue;
      z += u_extra[i].x;
      // The dent: the surface sags and the normal tilts towards the pit, or the jelly reads by the
      // silhouette alone. The tilt is taken as the difference of the sag along the two axes.
      float dnt = u_extra[i].w;
      if (dnt > 0.001 && u_press.z > 0.0) {
        float dz = dentAt(p, b.z, dnt);
        if (dz > 0.0) {
          float e = max(b.z * 0.12, 1.0);
          vec2 g = vec2(
            dentAt(p + vec2(e, 0.0), b.z, dnt) - dentAt(p - vec2(e, 0.0), b.z, dnt),
            dentAt(p + vec2(0.0, e), b.z, dnt) - dentAt(p - vec2(0.0, e), b.z, dnt)
          ) / (2.0 * e);
          z -= dz;
          n = normalize(vec3(n.xy + g * 1.6, n.z));
        }
      }
      if (bestZ < 0.0) {
        bestZ = z;
        bestR = b.z;
        bestN = n;
        bestSeed = u_extra[i].z;
        continue;
      }
      // The smooth maximum: at the contact the surfaces run together in a fillet, and the normals and the
      // tone are mixed by the very same weight. A hard maximum gave an edge, and that edge read as "it
      // went right through".
      float k = max(bestR, b.z) * FILLET;
      float hh = clamp(0.5 + 0.5 * (z - bestZ) / k, 0.0, 1.0);
      secondZ = max(secondZ, min(z, bestZ));
      bestZ = mix(bestZ, z, hh) + k * hh * (1.0 - hh);
      bestN = normalize(mix(bestN, n, hh));
      bestR = mix(bestR, b.z, hh);
      bestSeed = mix(bestSeed, u_extra[i].z, hh);
    }

    vec3 col;
    if (bestZ < 0.0) {
      col = bg;
    } else {
      vec3 N = bestN;
      vec3 L = normalize(u_light);
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 pos = vec3(p, bestZ);

      // A real cast shadow from the neighbouring balloons. The point is lifted along the normal, or the
      // body catches its own surface and everything goes into the shadow (the classic self-shadow acne).
      float lit = lightReach(pos + N * bestR * 0.06, L);

      // The sheen is matt: the exponent is low and the spot is wide. With a high (glassy) one the balloons
      // read as plastic - on a matt surface the sheen has to be blurred.
      vec3 H = normalize(L + V);
      float sheen = pow(clamp(dot(N, H), 0.0, 1.0), 6.0) * 0.4;
      // A narrow "window" - a sharp bright stroke, like the source reflected in the film on the reference.
      float window = pow(clamp(dot(N, H), 0.0, 1.0), 48.0) * 0.34;

      // The rim: the light re-reflected from the neighbours in a dense wall. Thanks to it the dark side
      // does not go black.
      float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0) * 0.3;

      // The shell shining through: the thin edge glows, because the light passes through the film.
      float sss = pow(clamp(dot(-N, L) * 0.5 + 0.5, 0.0, 1.0), 2.0) * 0.08
                  * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.6);

      // The occlusion of the seams: by the gap down to the SECOND surface under the pixel. The former way
      // added darkening for any overlap of the silhouettes and put the wall out evenly, eating the relief.
      // The denominator is narrow on purpose. At bestR * 0.9 the gap counted as "small" over a wide band
      // around every joint, and at the points where THREE balloons meet the darkening ran together into a
      // dark TRIANGULAR patch - it was taken for a hole in the wall (the study of 2026-08-13: the zones
      // with occ > 0.8 were lit up right in the program, and the net of joints with triangles at the
      // triple points matched what the product had seen). The wall is whole all the while: not one pixel
      // is left uncovered, checked by the same probe. A narrow denominator leaves a thin seam and not
      // patches.
      float gap = secondZ > 0.0 ? clamp((bestZ - secondZ) / (bestR * 0.9), 0.0, 1.0) : 1.0;
      float occ = 1.0 - gap;

      // The shadow quiets the sheen down but does not kill it: the fill light stays. On a transparent
      // material the shadow is weak anyway - the light passes through the film.
      float shade = mix(0.68, 1.0, lit);
      float grazing = 1.0 - clamp(dot(N, V), 0.0, 1.0);

      // A BALLOON HAS NO COLOUR OF ITS OWN (a decision of the product, 2026-08-13): it is transparent and
      // takes its colour from the backdrop seen through it. What follows is the material model of the
      // bubble effect.

      // REFRACTION with the channels running apart: at the rim the shift is bigger and the channels part -
      // a coloured fringe.
      vec2 dir = N.xy;
      float shift = bestR * REFRACT * grazing;

      vec2 uvR = clamp((p + dir * shift * (1.0 + CHROMA)) / u_res, vec2(0.0), vec2(1.0));
      vec2 uvG = clamp((p + dir * shift) / u_res, vec2(0.0), vec2(1.0));
      vec2 uvB = clamp((p + dir * shift * (1.0 - CHROMA)) / u_res, vec2(0.0), vec2(1.0));
      vec3 through = vec3(
        texture(u_bg, vec2(uvR.x, 1.0 - uvR.y)).r,
        texture(u_bg, vec2(uvG.x, 1.0 - uvG.y)).g,
        texture(u_bg, vec2(uvB.x, 1.0 - uvB.y)).b
      );

      // THE CAUSTIC: the lens squeezes the picture - where the shift changes fast, the light runs together.
      float e = max(bestR * 0.08, 1.0);
      vec2 uvC = clamp((p + dir * shift + vec2(e, 0.0)) / u_res, vec2(0.0), vec2(1.0));
      vec3 near = texture(u_bg, vec2(uvC.x, 1.0 - uvC.y)).rgb;
      float caustic = clamp(length(near - through) * CAUSTIC, 0.0, 0.35) * pow(grazing, 1.5);

      // THE BODY is next to not darkened: the background reads through the balloon. The volume is held by
      // the rim, the sheen and the play of colour.
      float dim = DIM_CENTER - DIM_EDGE_DROP * grazing;
      col = through * dim;
      col = mix(col, u_shadow, occ * 0.09);

      // THE FILM: the thickness grows towards the rim (the path of the eye goes as 1/cos(theta)) and slowly
      // flows. The coordinate is taken from the NORMAL, or the pattern sticks to the card and does not
      // travel with the balloon.
      vec2 fuv = N.xy * 2.1 + vec2(bestSeed, bestSeed * 1.7);
      float flow = FILM_FLOW_A * vnoise(fuv * 2.2 + vec2(u_time * 0.05, -u_time * 0.04))
                 + FILM_FLOW_B * vnoise(fuv * 4.7 - vec2(u_time * 0.03, u_time * 0.02));
      float thickness = FILM_THICKNESS * (1.0 + FILM_EDGE_GAIN * grazing) * (1.0 + flow);
      vec3 film = filmColor(2.0 * FILM_N * thickness);
      float filmMix = mix(FILM_MIX_CENTER, FILM_MIX_EDGE, pow(grazing, 1.6));
      col = mix(col, film, filmMix);

      // The light: the sheen, the rim, the caustic, the faint shine-through. All of it added in the tone of
      // the scheme.
      col += u_spark * (sheen * shade * SPECULAR + window * SPECULAR + rim * 0.7 + sss + caustic);
    }

    // The darkening towards the bottom: the texts of the card are white and the wall is light (see SCRIM_*
    // in the effect).
    float t = clamp(v_uv.y, 0.0, 1.0);
    col = mix(col, u_shadow, mix(u_scrim.y, u_scrim.x, t));

    outColor = vec4(col, 1.0);
  }
`;
