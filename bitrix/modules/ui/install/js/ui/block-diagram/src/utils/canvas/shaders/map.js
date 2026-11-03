export const vertexShader: string = `
  precision mediump float;

  attribute vec2 a_Position;
  attribute vec2 a_Center;
  attribute vec2 a_HalfSize;
  attribute vec4 a_Color;
  // x - corner radius, y - half of the outline width (zero means a filled shape)
  attribute vec2 a_Shape;

  uniform vec2 u_Resolution;

  varying vec2 v_Local;
  varying vec2 v_HalfSize;
  varying vec4 v_Color;
  varying vec2 v_Shape;

  void main() {
  	v_Local = a_Position - a_Center;
  	v_HalfSize = a_HalfSize;
  	v_Color = a_Color;
  	v_Shape = a_Shape;

  	// Map pixels grow right and down, clip space grows right and up.
  	vec2 clip = (a_Position / u_Resolution) * 2.0 - 1.0;
  	gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  }
`;

export const fragmentShader: string = `
  precision mediump float;

  // Half-width of the coverage ramp, in map pixels. It is driven by pixel density, so the
  // edge fades over the same distance on the screen whatever the density is.
  uniform float u_EdgeSoftness;

  varying vec2 v_Local;
  varying vec2 v_HalfSize;
  varying vec4 v_Color;
  varying vec2 v_Shape;

  // Signed distance to a rounded rectangle centered at the origin: negative inside,
  // positive outside, zero on the edge. This is what gives the corners their radius
  // without a single extra vertex.
  float rounded_box(vec2 point, vec2 halfSize, float radius) {
  	vec2 corner = abs(point) - halfSize + radius;

  	return min(max(corner.x, corner.y), 0.0) + length(max(corner, 0.0)) - radius;
  }

  void main() {
  	float radius = min(v_Shape.x, min(v_HalfSize.x, v_HalfSize.y));
  	float edge = rounded_box(v_Local, v_HalfSize, radius);
  	// A non-zero outline width turns the shape into a band of that width centered on the
  	// edge - the same way a stroked rectangle is drawn.
  	float shape = v_Shape.y > 0.0 ? abs(edge) - v_Shape.y : edge;
  	float coverage = 1.0 - smoothstep(-u_EdgeSoftness, u_EdgeSoftness, shape);

  	gl_FragColor = vec4(v_Color.rgb, v_Color.a * coverage);
  }
`;
