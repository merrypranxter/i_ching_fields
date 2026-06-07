/*
 * _combined_hexagram.frag
 * Combined Hexagram — Primary, Nuclear, and Reverse in Three-State Field
 *
 * Shows three related hexagrams simultaneously:
 *   1. Primary hexagram (center) — the present moment
 *   2. Nuclear hexagram (left) — the hidden essence (lines 2-4, 3-5)
 *   3. Reverse hexagram (right) — the inverted perspective (180° rotation)
 *
 * The three form a triadic system: nuclear is interior, primary is present,
 * reverse is the complementary viewpoint. Together they describe the full
 * dynamic range of a hexagram's meaning.
 *
 * Binary relationships:
 *   nuclear = ((primary>>1)&7) | (((primary>>2)&7)<<3)
 *   reverse = bit-reversal of primary (6-bit)
 *
 * A slow morphing field connects the three: gradient lines show how
 * bits migrate between states. XOR difference fields highlight the
 * changed positions in green.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

float nuclearHex(float h) {
    return mod(floor(h / 2.0), 8.0) + mod(floor(h / 4.0), 8.0) * 8.0;
}

float reverseHex(float h) {
    float r = 0.0;
    for (int i = 0; i < 6; i++) r += getBit(h, i) * pow(2.0, float(5 - i));
    return r;
}

float drawYao(float hexVal, int lineIdx, vec2 loc, float gapMult) {
    float bitVal = getBit(hexVal, lineIdx);
    float pad = 0.1;
    float gap = 0.16 * gapMult;
    float inBar;
    if (bitVal > 0.5) {
        inBar = step(pad, loc.x) * step(loc.x, 1.0 - pad) * step(0.12, loc.y) * step(loc.y, 0.88);
    } else {
        inBar = (step(pad, loc.x) * step(loc.x, 0.5 - gap) + step(0.5 + gap, loc.x) * step(loc.x, 1.0 - pad))
              * step(0.12, loc.y) * step(loc.y, 0.88);
    }
    return inBar;
}

vec3 renderHex(vec2 uv, vec2 center, float hexVal, vec3 yangCol, vec3 yinCol, float W, float H) {
    vec2 p = uv - center;
    if (abs(p.x) > W || abs(p.y) > H) return vec3(-1.0);
    float normY = (p.y + H) / (H * 2.0);
    float lf = normY * 6.0;
    int li = int(clamp(floor(lf), 0.0, 5.0));
    vec2 loc = vec2((p.x + W) / (W * 2.0), fract(lf));
    float bar = drawYao(hexVal, li, loc, 1.0);
    float bit = getBit(hexVal, li);
    if (bar < 0.5) return vec3(0.0);
    return bit > 0.5 ? yangCol : yinCol;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // Cycle 64 hexagrams, 5s each
    float hexIdx = mod(floor(u_time / 5.0), 64.0);
    float primary = hexIdx;
    float nuclear  = nuclearHex(primary);
    float reverse  = reverseHex(primary);
    float compHex  = 63.0 - primary;

    float t = fract(u_time / 5.0);
    vec3 bg = vec3(0.03, 0.025, 0.06);
    vec3 col = bg;

    // Three hexagram panels
    float W = 0.13; float H = 0.28;
    float spacing = aspect * 0.42;

    // Left: nuclear (green hues — inner essence)
    vec3 nucSample = renderHex(uv, vec2(-spacing, 0.0), nuclear,
        vec3(0.3, 0.95, 0.4), vec3(0.15, 0.55, 0.25), W, H);
    if (nucSample.r >= 0.0) col = nucSample + bg * 0.5;

    // Center: primary (gold — present)
    vec3 primSample = renderHex(uv, vec2(0.0, 0.0), primary,
        vec3(1.0, 0.85, 0.25), vec3(0.25, 0.35, 0.75), W * 1.2, H * 1.2);
    if (primSample.r >= 0.0) col = primSample + bg * 0.5;

    // Right: reverse (blue hues — perspective shift)
    vec3 revSample = renderHex(uv, vec2(spacing, 0.0), reverse,
        vec3(0.3, 0.55, 1.0), vec3(0.15, 0.25, 0.7), W, H);
    if (revSample.r >= 0.0) col = revSample + bg * 0.5;

    // XOR difference field between primary and reverse as background glow
    float xorVal = mod(primary + reverse, 64.0); // approximate XOR
    float xorNorm = xorVal / 63.0;
    vec2 p = uv;
    float fieldLine = sin(p.x * 8.0 * xorNorm + p.y * 5.0 + u_time) * 0.5 + 0.5;
    col += vec3(0.05, 0.03, 0.1) * fieldLine * (1.0 - length(col));

    // Connecting lines between panels
    float lineY = abs(uv.y) < 0.005 ? 1.0 : 0.0;
    float inBetween = (abs(uv.x) < spacing - W * 0.5) ? 1.0 : 0.0;
    col += vec3(0.3, 0.25, 0.15) * lineY * inBetween * 0.4;

    // Labels: binary value dots above each hexagram
    for (int panel = 0; panel < 3; panel++) {
        float panelX = (panel == 0) ? -spacing : (panel == 1) ? 0.0 : spacing;
        float panelHex = (panel == 0) ? nuclear : (panel == 1) ? primary : reverse;
        for (int b = 0; b < 6; b++) {
            float bit = getBit(panelHex, b);
            vec2 dotPos = vec2(panelX + (float(b) - 2.5) * 0.04, H * 1.5);
            float dotR = length(uv - dotPos);
            col += (bit > 0.5 ? vec3(1.0, 0.9, 0.3) : vec3(0.2, 0.25, 0.6))
                   * (1.0 - smoothstep(0.012, 0.018, dotR));
        }
    }

    // Transition fade
    col = mix(bg, col, smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.92, t));

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
