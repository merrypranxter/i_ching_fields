/*
 * _lo_shu_square.frag
 * Lo Shu Square — 3×3 Magic Square with Trigram Resonance Fields
 *
 * The Lo Shu (洛書) is a 3×3 magic square where every row, column,
 * and diagonal sums to 15. It encodes the 8 directions + center:
 *
 *   4  9  2
 *   3  5  7
 *   8  1  6
 *
 * Mapping: Lo Shu number → trigram (Later Heaven arrangement)
 *   1=Kan(Water,2),  2=Kun(Earth,0),  3=Zhen(Thunder,1)
 *   4=Xun(Wind,6),   5=center/balance, 6=Qian(Heaven,7)
 *   7=Dui(Lake,3),   8=Gen(Mountain,4), 9=Li(Fire,5)
 *
 * Each cell generates a force field based on its trigram element.
 * Adjacent cells interact: the sum-15 constraint creates resonance.
 * The magic constant 15 = sum of any line = 3 × 5 (center).
 *
 * Visualization: 3×3 grid, each cell shows its Lo Shu number,
 * its trigram glyph, and its elemental force field lines.
 * The sum-15 "magic paths" pulse as overlaid trails.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358979

float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

// Lo Shu grid (row 0 = top, col 0 = left), 1-indexed values
float loShu(int row, int col) {
    // Row 0: 4 9 2 / Row 1: 3 5 7 / Row 2: 8 1 6
    float grid[9];
    grid[0]=4.0; grid[1]=9.0; grid[2]=2.0;
    grid[3]=3.0; grid[4]=5.0; grid[5]=7.0;
    grid[6]=8.0; grid[7]=1.0; grid[8]=6.0;
    return grid[row * 3 + col];
}

// Lo Shu number → trigram value (Later Heaven)
float loShuToTrigram(float n) {
    if (n == 1.0) return 2.0;  // Kan/Water
    if (n == 2.0) return 0.0;  // Kun/Earth
    if (n == 3.0) return 1.0;  // Zhen/Thunder
    if (n == 4.0) return 6.0;  // Xun/Wind
    if (n == 5.0) return -1.0; // center (no trigram)
    if (n == 6.0) return 7.0;  // Qian/Heaven
    if (n == 7.0) return 3.0;  // Dui/Lake
    if (n == 8.0) return 4.0;  // Gen/Mountain
    return 5.0;                 // 9→Li/Fire
}

// Trigram color
vec3 trigramColor(float tri) {
    if (tri == 5.0) return vec3(1.0, 0.2, 0.05);   // Fire: red
    if (tri == 0.0) return vec3(0.3, 0.55, 0.2);   // Earth: green
    if (tri == 3.0) return vec3(0.25, 0.7, 0.95);  // Lake: blue
    if (tri == 7.0) return vec3(1.0, 0.9, 0.4);    // Heaven: gold
    if (tri == 2.0) return vec3(0.1, 0.3, 0.85);   // Water: deep blue
    if (tri == 4.0) return vec3(0.5, 0.48, 0.42);  // Mountain: stone
    if (tri == 1.0) return vec3(0.9, 0.5, 0.1);    // Thunder: orange
    if (tri == 6.0) return vec3(0.45, 0.82, 0.5);  // Wind: green
    return vec3(0.9, 0.9, 0.9);                      // center: white
}

// Trigram force direction
vec2 trigramForce(float tri, vec2 p, float t) {
    if (tri < 0.0) return vec2(0.0); // center
    if (tri == 7.0) return normalize(p) * 0.8; // Heaven: outward
    if (tri == 0.0) return vec2(0.0, -1.0);    // Earth: down
    if (tri == 1.0) return vec2(cos(t*2.0), sin(t*2.0)) * (sin(length(p)*10.0-t*3.0)); // Thunder: pulse
    if (tri == 2.0) return vec2(sin(p.y*3.0+t)*0.3, -0.8); // Water: down
    if (tri == 4.0) return vec2(0.0); // Mountain: zero
    if (tri == 6.0) return vec2(0.7, 0.2*sin(p.y*4.0+t)); // Wind: horizontal
    if (tri == 5.0) return vec2(0.0, 0.8+0.2*sin(p.x*5.0+t*2.0)); // Fire: up
    return vec2(0.6, 0.3*sin(p.x*4.0+t)); // Lake: horizontal
}

// Draw trigram glyph (3 lines)
float trigramGlyph(vec2 p, float triVal, float s) {
    float result = 0.0;
    float lh = s * 0.1;
    float lw = s * 0.38;
    float gap = s * 0.07;
    for (int li = 0; li < 3; li++) {
        if (triVal < 0.0) continue; // center
        float bit = getBit(triVal, li);
        float cy = (float(li) - 1.0) * (lh * 2.0 + gap);
        vec2 lp = p - vec2(0.0, cy);
        if (bit > 0.5) {
            if (abs(lp.x) < lw && abs(lp.y) < lh) result = 1.0;
        } else {
            if ((abs(lp.x + lw * 0.3) < lw * 0.55 || abs(lp.x - lw * 0.3) < lw * 0.55) && abs(lp.y) < lh) result = 1.0;
        }
    }
    return result;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // 3×3 grid spanning [-0.9*aspect, 0.9*aspect] × [-0.9, 0.9]
    float gridW = aspect * 0.9;
    float gridH = 0.9;
    float cellW = gridW * 2.0 / 3.0;
    float cellH = gridH * 2.0 / 3.0;

    vec3 bg = vec3(0.04, 0.04, 0.08);
    vec3 col = bg;

    // Find which cell we're in
    vec2 gridPos = (uv + vec2(gridW, gridH)) / vec2(cellW, cellH);
    int gx = int(clamp(floor(gridPos.x), 0.0, 2.0));
    int gy = int(clamp(floor(gridPos.y), 0.0, 2.0));
    int gyFlip = 2 - gy; // flip row so row 0 = top

    // Only render inside grid
    if (uv.x > -gridW && uv.x < gridW && uv.y > -gridH && uv.y < gridH) {
        float lsVal = loShu(gyFlip, gx);
        float triVal = loShuToTrigram(lsVal);
        vec3 baseColor = trigramColor(triVal);

        // Local UV within cell
        vec2 localUV = fract(gridPos) * 2.0 - 1.0;
        localUV.x *= cellW / cellH; // correct aspect

        // Elemental force field visualization
        vec2 force = trigramForce(triVal, localUV, u_time);
        float forceMag = length(force);
        float fieldViz = sin(dot(localUV, normalize(force + 0.001) * vec2(-1.0, 1.0)) * 15.0 + u_time);
        fieldViz = smoothstep(0.5, 1.0, abs(fieldViz)) * forceMag;

        col = baseColor * (0.1 + 0.2 * fieldViz);

        // Trigram glyph
        float glyph = trigramGlyph(localUV, triVal, 0.5);
        col = mix(col, baseColor * 1.4, glyph * 0.9);

        // Lo Shu number as brightness ring
        float numR = length(localUV) - 0.6;
        float numRing = 1.0 - smoothstep(0.0, 0.05, abs(numR));
        col += baseColor * numRing * lsVal / 9.0 * 0.3;

        // Magic path pulse: rows, cols, diagonals sum to 15
        float pathPulse = sin(u_time * 1.5 - lsVal * 0.4) * 0.5 + 0.5;
        col += baseColor * pathPulse * 0.15;
    }

    // Grid lines
    vec2 gfrac = fract((uv + vec2(gridW, gridH)) / vec2(cellW, cellH));
    float gridLine = (1.0 - smoothstep(0.0, 0.025, min(gfrac.x, 1.0 - gfrac.x))) +
                     (1.0 - smoothstep(0.0, 0.025, min(gfrac.y, 1.0 - gfrac.y)));
    col += vec3(0.25, 0.2, 0.4) * clamp(gridLine, 0.0, 1.0) * 0.6;

    // Outer border
    float outerLine = (1.0 - smoothstep(0.0, 0.02, abs(abs(uv.x) - gridW))) +
                      (1.0 - smoothstep(0.0, 0.02, abs(abs(uv.y) - gridH)));
    col += vec3(0.6, 0.5, 0.3) * clamp(outerLine, 0.0, 1.0) * 0.5;

    // Sum-15 diagonal pulses
    float diagPulse1 = sin((uv.x - uv.y) * 4.0 + u_time * 0.8) * 0.5 + 0.5;
    float diagPulse2 = sin((uv.x + uv.y) * 4.0 - u_time * 0.8) * 0.5 + 0.5;
    col += vec3(0.3, 0.2, 0.1) * smoothstep(0.9, 1.0, diagPulse1) * 0.2;
    col += vec3(0.1, 0.2, 0.3) * smoothstep(0.9, 1.0, diagPulse2) * 0.2;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
