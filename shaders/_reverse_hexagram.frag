/*
 * _reverse_hexagram.frag
 * Reverse Hexagram — Bit Reversal and Perspective Shift
 *
 * In the King Wen sequence, most hexagrams are paired with their
 * reversal (rotated 180°), which flips all 6 lines top-to-bottom.
 * In binary: reverse_6bit(n) — bit 0 ↔ bit 5, bit 1 ↔ bit 4, etc.
 *
 * Examples:
 *   Hex 1 (Qian, 111111=63) ↔ Hex 1 (self-reverse, all yang)
 *   Hex 3 (Zhun, 010001=17) ↔ Hex 4 (Meng, 100010=34) — reversed pair
 *   Hex 63 (Ji Ji, 010101=21) ↔ Hex 64 (Wei Ji, 101010=42) — mirror pair
 *
 * Shader shows the original hexagram splitting into its reverse,
 * the split traveling through the frame from left to right over time.
 * The transition reveals that reversal is spatial — a 180° rotation.
 *
 * The complement (XOR 63) is also shown: flipping every line type.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

// Reverse all 6 bits
float reverse6bit(float n) {
    float r = 0.0;
    for (int i = 0; i < 6; i++) {
        float b = getBit(n, i);
        r += b * pow(2.0, float(5 - i));
    }
    return r;
}

// Complement: XOR with 63 (flip all bits)
float complement6bit(float n) {
    return 63.0 - n; // since XOR 111111 = 63 - n for 6-bit
}

float drawYao(float hexVal, int lineIdx, vec2 localXY) {
    float bitVal = getBit(hexVal, lineIdx);
    float padding = 0.1;
    float gap = 0.18;
    float inBar;
    if (bitVal > 0.5) {
        inBar = step(padding, localXY.x) * step(localXY.x, 1.0 - padding) *
                step(0.12, localXY.y) * step(localXY.y, 0.88);
    } else {
        float lb = step(padding, localXY.x) * step(localXY.x, 0.5 - gap);
        float rb = step(0.5 + gap, localXY.x) * step(localXY.x, 1.0 - padding);
        inBar = (lb + rb) * step(0.12, localXY.y) * step(localXY.y, 0.88);
    }
    return inBar;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // Cycle through hexagram pairs, 4s each
    float hexIdx = mod(floor(u_time / 4.0), 64.0);
    float origHex = hexIdx;
    float revHex  = reverse6bit(origHex);
    float compHex = complement6bit(origHex);

    // Split position: travels left to right over 4 seconds
    float splitT = fract(u_time / 4.0);
    float splitX = mix(-aspect, aspect, smoothstep(0.1, 0.9, splitT));

    vec3 bg = vec3(0.03, 0.02, 0.07);
    vec3 col = bg;

    // Determine which hexagram to show at this pixel
    float activeHex = uv.x < splitX ? origHex : revHex;
    bool isRevSide = uv.x >= splitX;

    // Draw hexagram
    float hexW = 0.28;
    float hexH = 0.48;
    if (abs(uv.x) < hexW * 1.5 && abs(uv.y) < hexH) {
        // Center the hexagram around origin, but shift based on split
        vec2 p = uv;
        // Shrink each side toward its center
        float sideCenter = isRevSide ? (splitX + aspect) * 0.5 : (splitX - aspect) * 0.5;
        p.x = p.x - sideCenter * 0.0; // keep centered for now

        float normY = (p.y + hexH) / (hexH * 2.0);
        if (normY >= 0.0 && normY <= 1.0) {
            float lineIdx_f = normY * 6.0;
            int lineIdx = int(clamp(floor(lineIdx_f), 0.0, 5.0));
            float lineLocal_y = fract(lineIdx_f);
            float lineLocal_x = (p.x + hexW) / (hexW * 2.0);

            if (lineLocal_x >= 0.0 && lineLocal_x <= 1.0) {
                vec2 local = vec2(lineLocal_x, lineLocal_y);
                float bar = drawYao(activeHex, lineIdx, local);

                vec3 yangColor = isRevSide ? vec3(0.3, 0.7, 1.0) : vec3(1.0, 0.82, 0.25);
                vec3 yinColor  = isRevSide ? vec3(0.1, 0.3, 0.7) : vec3(0.25, 0.35, 0.75);
                float bitVal = getBit(activeHex, lineIdx);
                col = mix(bg, bitVal > 0.5 ? yangColor : yinColor, bar);
            }
        }
    }

    // Split line glow
    float splitDist = abs(uv.x - splitX);
    float splitGlow = exp(-splitDist * 30.0);
    col += vec3(0.8, 0.6, 0.2) * splitGlow * 0.8;

    // Complement hexagram displayed as small icon top right
    float cW = 0.08; float cH = 0.16;
    vec2 cCenter = vec2(aspect * 0.7, 0.65);
    vec2 cp = uv - cCenter;
    if (abs(cp.x) < cW && abs(cp.y) < cH) {
        float normY = (cp.y + cH) / (cH * 2.0);
        float lf = normY * 6.0;
        int li = int(clamp(floor(lf), 0.0, 5.0));
        vec2 loc = vec2((cp.x + cW) / (cW * 2.0), fract(lf));
        float bar = drawYao(compHex, li, loc);
        float cBit = getBit(compHex, li);
        col = mix(col, cBit > 0.5 ? vec3(1.0, 0.4, 0.4) : vec3(0.4, 1.0, 0.4), bar);
    }

    // Background gradient: left=warm, right=cool
    float bgGrad = (uv.x / aspect + 1.0) * 0.5;
    col += mix(vec3(0.08, 0.04, 0.02), vec3(0.02, 0.04, 0.08), bgGrad) * (1.0 - length(col));

    // Transition flash at split
    col += vec3(1.0, 0.9, 0.7) * step(splitT, 0.05) * 0.3;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
