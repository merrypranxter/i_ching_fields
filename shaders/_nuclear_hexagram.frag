/*
 * _nuclear_hexagram.frag
 * Nuclear Hexagram — Inner Trigram Extraction
 *
 * The nuclear hexagram reveals the hidden essence within any hexagram.
 * Formula (Wilhelm/Baynes, Needham):
 *   Lines 2,3,4 form the lower nuclear trigram
 *   Lines 3,4,5 form the upper nuclear trigram
 *   → nuclear = lower_nuclear | (upper_nuclear << 3)
 *
 * In 6-bit binary: nuclear = ((hex>>1)&7) | (((hex>>2)&7)<<3)
 *
 * Visualization: the outer hexagram occupies the full frame,
 * and the nuclear hexagram emerges from the inner 4 lines,
 * glowing with a different hue to show the "seed within the seed."
 * A slow orbit cycles through all 64 hexagrams, dwelling on each.
 *
 * Note: Some hexagrams are self-nuclear (e.g., Hex 1 Qian → nuclear Qian).
 * Pairs 29/30 (Kan/Li) have each other as nuclear — Water contains Fire's seed.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

// Bit extraction from 6-bit integer
float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

// Nuclear hexagram computation
float nuclearHex(float hex) {
    float lo_nuc = mod(floor(hex / 2.0), 8.0);   // bits 1-3
    float up_nuc = mod(floor(hex / 4.0), 8.0);   // bits 2-4
    return lo_nuc + up_nuc * 8.0;
}

// Draw a single line of a hexagram
// lineIdx: 0-5 (0=bottom), local: vec2 in cell, isNuclear: highlight inner lines
float drawLine(float hexVal, int lineIdx, vec2 localXY, bool isNuclear) {
    float bitVal = getBit(hexVal, lineIdx);
    float padding = 0.1;
    float gap = 0.18;
    float ly = localXY.y;
    float lx = localXY.x;

    float inBar;
    if (bitVal > 0.5) {
        // Yang: solid bar
        inBar = step(padding, lx) * step(lx, 1.0 - padding) *
                step(0.12, ly) * step(ly, 0.88);
    } else {
        // Yin: broken bar
        float lb = step(padding, lx) * step(lx, 0.5 - gap);
        float rb = step(0.5 + gap, lx) * step(lx, 1.0 - padding);
        inBar = (lb + rb) * step(0.12, ly) * step(ly, 0.88);
    }
    return inBar;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // Cycle through all 64 hexagrams, 3 seconds each
    float hexIdx = mod(floor(u_time / 3.0), 64.0);
    float outerHex = hexIdx;
    float innerHex = nuclearHex(outerHex);

    vec3 bg = vec3(0.03, 0.03, 0.07);
    vec3 col = bg;

    // Layout: outer hexagram centered, nuclear shown as inset
    float hexW = 0.22;
    float hexH = 0.42;
    vec2 hexCenter = vec2(0.0);
    vec2 p = uv - hexCenter;

    if (abs(p.x) < hexW && abs(p.y) < hexH) {
        // Determine which of 6 lines
        float normY = (p.y + hexH) / (hexH * 2.0);
        float lineIdx_f = normY * 6.0;
        int lineIdx = int(clamp(floor(lineIdx_f), 0.0, 5.0));
        float lineLocal_y = fract(lineIdx_f);
        float lineLocal_x = (p.x + hexW) / (hexW * 2.0);
        vec2 local = vec2(lineLocal_x, lineLocal_y);

        // Nuclear lines are 2,3,4 (indices 1,2,3 in 0-based)
        bool isNuclearLine = (lineIdx >= 1 && lineIdx <= 3);
        // Nuclear contributing to upper: lines 3,4,5 (indices 2,3,4)
        bool isUpperNuclear = (lineIdx >= 2 && lineIdx <= 4);

        // Draw outer hexagram
        float outerBar = drawLine(outerHex, lineIdx, local, false);
        
        // Color based on nuclear membership
        float phase = fract(u_time / 3.0);
        float pulse = sin(u_time * 2.5) * 0.5 + 0.5;
        
        vec3 outerYang = vec3(1.0, 0.85, 0.3);
        vec3 outerYin  = vec3(0.25, 0.35, 0.75);
        vec3 nucYang   = vec3(0.4, 1.0, 0.6);   // nuclear = green-gold
        vec3 nucYin    = vec3(0.8, 0.3, 0.9);   // nuclear yin = violet

        float bitVal = getBit(outerHex, lineIdx);
        vec3 lineColor = bitVal > 0.5 ? outerYang : outerYin;
        if (isNuclearLine) {
            vec3 nYang = mix(outerYang, nucYang, 0.6 + 0.4 * pulse);
            vec3 nYin  = mix(outerYin,  nucYin,  0.6 + 0.4 * pulse);
            lineColor = bitVal > 0.5 ? nYang : nYin;
        }
        col = mix(bg, lineColor, outerBar);

        // Nuclear line bracket markers on sides
        if (isNuclearLine && abs(p.x) > hexW * 0.85) {
            col = mix(col, vec3(0.3, 0.9, 0.5) * pulse, 0.6);
        }
    }

    // Right inset: nuclear hexagram (smaller)
    float nucW = 0.10;
    float nucH = 0.20;
    vec2 nucCenter = vec2(aspect * 0.55, 0.0);
    vec2 np = uv - nucCenter;
    if (abs(np.x) < nucW && abs(np.y) < nucH) {
        float normY = (np.y + nucH) / (nucH * 2.0);
        float lineIdx_f = normY * 6.0;
        int lineIdx = int(clamp(floor(lineIdx_f), 0.0, 5.0));
        float lineLocal_y = fract(lineIdx_f);
        float lineLocal_x = (np.x + nucW) / (nucW * 2.0);
        vec2 local = vec2(lineLocal_x, lineLocal_y);

        float nucBar = drawLine(innerHex, lineIdx, local, true);
        float nucBit = getBit(innerHex, lineIdx);
        vec3 nucColor = nucBit > 0.5 ? vec3(0.4, 1.0, 0.55) : vec3(0.78, 0.3, 0.9);
        col = mix(col, nucColor, nucBar);

        // Border glow
        float border = max(
            1.0 - smoothstep(0.0, 0.05, abs(abs(np.x) - nucW)),
            1.0 - smoothstep(0.0, 0.05, abs(abs(np.y) - nucH))
        );
        col += vec3(0.3, 0.8, 0.4) * border * 0.3;
    }

    // Hex number display (top left: binary visual)
    vec2 bp = uv - vec2(-aspect * 0.7, 0.6);
    for (int b = 0; b < 6; b++) {
        float bit = getBit(outerHex, b);
        float bx = float(b) * 0.06;
        if (abs(bp.x - bx) < 0.022 && abs(bp.y) < 0.022) {
            col = mix(col, bit > 0.5 ? vec3(1.0, 0.85, 0.3) : vec3(0.2, 0.3, 0.6), 0.9);
        }
    }

    // Transition fade
    float fadeCycle = fract(u_time / 3.0);
    float fadeIn  = smoothstep(0.0, 0.1, fadeCycle);
    float fadeOut = 1.0 - smoothstep(0.9, 1.0, fadeCycle);
    col = mix(bg, col, fadeIn * fadeOut);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
