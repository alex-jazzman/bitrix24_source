export const vertexShader: string = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;

  attribute vec2 a_Position;
  uniform mat3 u_ViewProjectionInvMatrix;
  varying vec2 v_Position;

  vec2 project_clipspace(vec2 p) {
  	return (u_ViewProjectionInvMatrix * vec3(p, 1)).xy;
  }

  void main() {
  	v_Position = project_clipspace(a_Position);
  	gl_Position = vec4(a_Position, 0, 1);
  }
`;

export const fragmentShader: string = `
  #extension GL_OES_standard_derivatives : enable

  // Cross-fade needs the coarse grid lines to land exactly on fine ones, and that
  // survives only while world coordinates keep their precision: a mediump float
  // (10-bit mantissa) drifts by a noticeable fraction of a cell a few thousand
  // world units away from the origin. highp in fragment shaders is optional in
  // GLSL ES 1.00, so it is taken when the implementation reports it.
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform vec4 u_BackgroundColor;
  uniform vec4 u_CoarseColor;
  uniform vec4 u_FineColor;
  uniform float u_CoarseSize;
  uniform float u_FineSize;
  uniform float u_Blend;
  varying vec2 v_Position;

  const float MAX_LINE_ALPHA = 0.222;

  float line_coverage(vec2 coord, float size) {
  	vec2 grid = abs(fract(coord / size - 0.5) - 0.5) / fwidth(coord) * size / 0.95;

  	return 1.0 - min(min(grid.x, grid.y), 1.0);
  }

  vec4 render_grid(vec2 coord) {
  	// Each level is capped before the blend is applied: capping the product
  	// instead would saturate the fine level once u_Blend reaches MAX_LINE_ALPHA
  	// and collapse the rest of the fade into the antialiased edges.
  	float coarse = clamp(line_coverage(coord, u_CoarseSize), 0.0, MAX_LINE_ALPHA);
  	float fine = clamp(line_coverage(coord, u_FineSize), 0.0, MAX_LINE_ALPHA);
  	float alpha = max(coarse, fine * u_Blend);
  	// Coarse lines are a subset of the fine ones, so the visible grid belongs to
  	// whichever level the blend currently favours - hence a single interpolated
  	// color rather than one per level. Equal colors reduce to the plain case.
  	vec4 gridColor = mix(u_CoarseColor, u_FineColor, u_Blend);

  	return mix(u_BackgroundColor, gridColor, alpha);
  }

  void main() {
  	gl_FragColor = render_grid(v_Position);
  }
`;
