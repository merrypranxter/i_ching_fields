/*
 * _changing_lines_flow.frag
 * Changing Lines Cellular Automaton
 *
 * Each tile holds a 6-bit hexagram. Lines evolve by the classic I Ching rule:
 * moving yang (9) → stable yin (8), moving yin (6) → stable yang (7).
 * Spatially, a cell inherits "tension" from neighbors via bitwise XOR,
 * simulating the wave-like propagation of change through the 64-state space.
 *
 * Theory: In yarrow-stem casting, lines 6 and 9 are "moving" (changing).
 * The field shows all 6 lines stacked per cell, color-coded:
 *   yang (solid) = warm amber, yin (broken) = cool indigo,
 *   changing yang = crimson pulse, changing yin = cyan pulse.
 *
 * Leibniz observed in 1703 that the Fu Xi sequence was binary arithmetic.
 * Here each cell IS a binary number evolving through state space.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

// Extract bit i from integer n (0=bottom)
float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

// Hash for pseudo-random cell state
float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * 47.11);
}

// Get cell hexagram value (0-63) from grid position and time phase
float cellHex(vec2 cell, float phase) {
    // Base state from hash
    float base = floor(hash(cell + floor(phase) * vec2(3.7, 1.3)) * 64.0);
    // Neighbor XOR influence — propagate change
    float left  = floor(hash(cell + vec2(-1.0, 0.0) + floor(phase) * vec2(3.7, 1.3)) * 64.0);
    float right = floor(hash(cell + vec2( 1.0, 0.0) + floor(phase) * vec2(3.7, 1.3)) * 64.0);
    float up    = floor(hash(cell + vec2( 0.0, 1.0) + floor(phase) * vec2(3.7, 1.3)) * 64.0);
    float down  = floor(hash(cell + vec2( 0.0,-1.0) + floor(phase) * vec2(3.7, 1.3)) * 64.0);
    // XOR pressure from neighbors (moving lines)
    float pressure = mod(left + right + up + down, 64.0);
    // Blend: fract(phase) controls transition
    float t = fract(phase);
    float evolved = mod(base + floor(pressure * t), 64.0);
    return mix(base, evolved, smoothstep(0.3, 0.7, t));
}

// Is this line a changing yang (probability 3/16 → bright)
float isChangingYang(float hexVal, int lineIdx) {
    return getBit(hexVal, lineIdx) * step(0.8, hash(vec2(hexVal, float(lineIdx)) + u_time * 0.1));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // Grid of hexagram cells
    float cellSize = 0.08;
    vec2 cell = floor(uv / cellSize);
    vec2 localUV = fract(uv / cellSize); // 0-1 within cell

    float phase = u_time * 0.4;
    float hexVal = floor(cellHex(cell, phase));

    // Draw 6 stacked lines within cell
    // Lines 1-6 bottom to top, each occupies 1/6 of cell height
    float lineIdx_f = localUV.y * 6.0;
    int lineIdx = int(floor(lineIdx_f));
    float lineLocal = fract(lineIdx_f);

    float bitVal = getBit(hexVal, lineIdx);
    float gap = 0.2; // gap between yao halves for yin line

    // Changing line detection (moving lines pulse)
    float changePulse = sin(u_time * 3.0 + hexVal * 0.4 + float(lineIdx)) * 0.5 + 0.5;
    float isMoving = step(0.85, hash(vec2(hexVal * 7.3 + float(lineIdx), cell.x * 3.1 + cell.y)));
    
    // Yang line = solid bar, Yin line = broken bar (gap in middle)
    float inBar;
    float padding = 0.15;
    float x = localUV.x;
    if (bitVal > 0.5) {
        // Yang: solid bar
        inBar = step(padding, x) * step(x, 1.0 - padding) *
                step(0.15, lineLocal) * step(lineLocal, 0.85);
    } else {
        // Yin: two half-bars with gap
        float leftBar  = step(padding, x) * step(x, 0.5 - gap * 0.5);
        float rightBar = step(0.5 + gap * 0.5, x) * step(x, 1.0 - padding);
        inBar = (leftBar + rightBar) * step(0.15, lineLocal) * step(lineLocal, 0.85);
    }

    // Colors
    vec3 yangColor   = vec3(1.0, 0.78, 0.2);   // amber
    vec3 yinColor    = vec3(0.2, 0.35, 0.75);   // indigo
    vec3 changingY   = mix(vec3(0.9, 0.1, 0.1), vec3(1.0, 0.5, 0.0), changePulse); // crimson→orange
    vec3 changingYin = mix(vec3(0.0, 0.8, 0.9), vec3(0.1, 0.4, 1.0), changePulse); // cyan→blue

    vec3 lineColor = bitVal > 0.5 ? yangColor : yinColor;
    if (isMoving > 0.5) {
        lineColor = bitVal > 0.5 ? changingY : changingYin;
    }

    vec3 bgColor = vec3(0.04, 0.04, 0.08); // near-black background
    vec3 col = mix(bgColor, lineColor, inBar);

    // Cell border glow (neighbor tension)
    float border = (1.0 - step(0.03, localUV.x)) + (1.0 - step(localUV.x, 0.97)) +
                   (1.0 - step(0.03, localUV.y)) + (1.0 - step(localUV.y, 0.97));
    col += vec3(0.08, 0.05, 0.15) * clamp(border, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
