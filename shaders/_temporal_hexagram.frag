/*
 * _temporal_hexagram.frag
 * Temporal Hexagram — Clock-driven Yarrow Stem Casting
 *
 * The yarrow stem oracle produces four possible line values per throw:
 *   6 (old yin,  moving): probability 1/16 — line changes to yang
 *   7 (young yang, stable): probability 5/16 — stays yang
 *   8 (young yin,  stable): probability 7/16 — stays yin
 *   9 (old yang, moving): probability 3/16 — line changes to yin
 *
 * Cumulative weights: [1/16, 6/16, 13/16, 16/16]
 * The shader casts a new hexagram every 8 seconds using time-based entropy.
 * Both primary and resultant hexagrams are displayed side-by-side.
 * Changing lines pulse with crimson (old yang) or cyan (old yin) glow.
 *
 * Probability derivation: 50 yarrow stalks, 3 divisions, 6 casts.
 * Leibniz correspondence with Bouvet, 1701: "your figures are binary."
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float hash(float n) { return fract(sin(n) * 43758.5453); }
float hash2(vec2 n) { return fract(sin(dot(n, vec2(127.1, 311.7))) * 43758.5453); }

// Cast one line using yarrow stem probabilities
// Returns: 6=old yin, 7=young yang, 8=young yin, 9=old yang
float castLine(float seed) {
    float r = hash(seed);
    // Cumulative: 6→1/16, 7→6/16, 8→13/16, 9→16/16
    if (r < 1.0/16.0)  return 6.0;  // old yin
    if (r < 6.0/16.0)  return 7.0;  // young yang
    if (r < 13.0/16.0) return 8.0;  // young yin
    return 9.0;                       // old yang
}

// Get line binary value (0=yin, 1=yang) from cast value
float lineBit(float castVal) {
    return (castVal == 7.0 || castVal == 9.0) ? 1.0 : 0.0;
}

// Draw a single hexagram at position center, with given cast values [6]
// lineVals[i]: cast value for line i (0=bottom)
vec3 drawHexagram(vec2 uv, vec2 center, float lineVals[6], bool showChanging, float t) {
    vec2 p = uv - center;
    float hexW = 0.18;
    float hexH = 0.32;

    // Outside hexagram bounds?
    if (abs(p.x) > hexW || abs(p.y) > hexH) return vec3(-1.0); // sentinel

    // Which line?
    float lineIdx_f = (p.y + hexH) / (hexH * 2.0) * 6.0;
    int lineIdx = int(floor(lineIdx_f));
    lineIdx = clamp(lineIdx, 0, 5);
    float lineLocal_y = fract(lineIdx_f);
    float lineLocal_x = (p.x + hexW) / (hexW * 2.0);

    float castVal = lineVals[lineIdx];
    float bitVal  = lineBit(castVal);
    bool  isMoving = (castVal == 6.0 || castVal == 9.0);

    float padding = 0.08;
    float gap = 0.15;
    float inBar;
    if (bitVal > 0.5) {
        // Yang: solid
        inBar = step(padding, lineLocal_x) * step(lineLocal_x, 1.0 - padding) *
                step(0.15, lineLocal_y) * step(lineLocal_y, 0.85);
    } else {
        // Yin: broken
        float lb = step(padding, lineLocal_x) * step(lineLocal_x, 0.5 - gap);
        float rb = step(0.5 + gap, lineLocal_x) * step(lineLocal_x, 1.0 - padding);
        inBar = (lb + rb) * step(0.15, lineLocal_y) * step(lineLocal_y, 0.85);
    }

    vec3 yangCol = vec3(1.0, 0.82, 0.25);
    vec3 yinCol  = vec3(0.22, 0.38, 0.78);
    vec3 movYang = mix(vec3(0.9, 0.1, 0.05), vec3(1.0, 0.5, 0.0), sin(t * 4.0) * 0.5 + 0.5);
    vec3 movYin  = mix(vec3(0.0, 0.8, 0.9), vec3(0.0, 0.4, 1.0), sin(t * 4.0 + 1.0) * 0.5 + 0.5);

    vec3 lineColor = bitVal > 0.5 ? yangCol : yinCol;
    if (isMoving && showChanging) {
        lineColor = (castVal == 9.0) ? movYang : movYin;
    }

    return mix(vec3(0.0), lineColor, inBar);
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Cast new hexagram every 8 seconds
    float castEpoch = floor(u_time / 8.0);
    float lineVals[6];
    float resultVals[6];
    for (int i = 0; i < 6; i++) {
        lineVals[i] = castLine(castEpoch * 13.7 + float(i) * 1.9 + 7.3);
        // Resultant: moving lines flip
        float b = lineBit(lineVals[i]);
        float isMoving = (lineVals[i] == 6.0 || lineVals[i] == 9.0) ? 1.0 : 0.0;
        float newBit = mix(b, 1.0 - b, isMoving);
        resultVals[i] = newBit > 0.5 ? 7.0 : 8.0; // stable values
    }

    float t = u_time;
    vec3 bg = vec3(0.04, 0.04, 0.09);
    vec3 col = bg;

    // Draw primary hexagram (left)
    vec3 primarySample = drawHexagram(uv, vec2(-0.4, 0.0), lineVals, true, t);
    if (primarySample.r >= 0.0) col = primarySample + bg;

    // Draw resultant hexagram (right)
    float resultValsArr[6];
    for (int i = 0; i < 6; i++) resultValsArr[i] = resultVals[i];
    vec3 resultSample = drawHexagram(uv, vec2(0.4, 0.0), resultValsArr, false, t);
    if (resultSample.r >= 0.0) col = resultSample + bg;

    // Arrow between hexagrams
    float arrowX = abs(uv.x) < 0.06 ? 1.0 : 0.0;
    float arrowY = abs(uv.y) < 0.005 ? 1.0 : 0.0;
    float transition = fract(u_time / 8.0);
    col += vec3(0.5, 0.4, 0.1) * arrowX * arrowY * smoothstep(0.0, 0.3, transition);

    // Label areas
    float topLabel = step(0.7, uv.y) * step(-1.0, uv.y) * step(-0.5, uv.x) * step(uv.x, -0.1);
    col += vec3(0.3, 0.2, 0.05) * topLabel * 0.1;

    // Time bar at bottom
    float timeBarY = step(uv.y, -0.85);
    float timeBarFill = step(uv.x, -1.0 + transition * 2.0);
    col += vec3(0.4, 0.3, 0.1) * timeBarY * timeBarFill * 0.5;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
