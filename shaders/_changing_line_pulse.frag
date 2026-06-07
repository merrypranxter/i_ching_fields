/*
 * _changing_line_pulse.frag
 * Changing Line Pulse — Wave Propagation of Moving Lines
 *
 * Old yang (9) and old yin (6) are "moving" lines — they change.
 * This shader propagates changing lines as waves through space.
 * Each of 6 line positions in the hexagram emits a circular wave
 * when it is a moving line; the waves interfere creating complex fields.
 *
 * Physical analogy: in the divination, each line is independently cast.
 * Moving lines carry transformative energy — they are like action potentials
 * in the oracle's nervous system, propagating change outward.
 *
 * Yarrow stem probabilities:
 *   Old yin (6):   1/16 = 6.25%  — rarest yin, most transformative
 *   Young yang (7): 5/16 = 31.25% — stable yang
 *   Young yin (8):  7/16 = 43.75% — most common, stable yin
 *   Old yang (9):   3/16 = 18.75% — rare yang, transformative
 *
 * Color coding: Old yang (9) = crimson waves, Old yin (6) = cyan waves.
 * Static yang (7) = amber, static yin (8) = indigo.
 * Wave interference creates moire patterns showing the I Ching field.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358979

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 v) { return fract(sin(dot(v, vec2(127.1, 311.7))) * 43758.5453123); }

// Cast line value 6/7/8/9 using yarrow probabilities
float castLine(float seed) {
    float r = hash(seed);
    if (r < 1.0/16.0)  return 6.0;  // old yin
    if (r < 6.0/16.0)  return 7.0;  // young yang
    if (r < 13.0/16.0) return 8.0;  // young yin
    return 9.0;                       // old yang
}

// Wave from a single changing line at screen position lineCenter
float lineWave(vec2 uv, vec2 lineCenter, float speed, float freq, float phase) {
    float dist = length(uv - lineCenter);
    float wave = sin(dist * freq - u_time * speed + phase);
    float envelope = exp(-dist * 2.5);
    return wave * envelope;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    // Cast a new hexagram every 6 seconds
    float castEpoch = floor(u_time / 6.0);
    float lineVals[6];
    for (int i = 0; i < 6; i++) {
        lineVals[i] = castLine(castEpoch * 17.3 + float(i) * 2.7 + 5.1);
    }

    vec3 col = vec3(0.03, 0.03, 0.07);

    // Line positions within the hexagram display panel
    float hexX = 0.0;
    float hexHalfH = 0.7;
    float lineSpacing = hexHalfH * 2.0 / 5.0;

    for (int i = 0; i < 6; i++) {
        float lineY = -hexHalfH + float(i) * lineSpacing;
        vec2 lineCenter = vec2(hexX, lineY);
        float castVal = lineVals[i];
        bool isMoving = (castVal == 6.0 || castVal == 9.0);
        bool isYang   = (castVal == 7.0 || castVal == 9.0);

        // Wave emission from changing lines only
        if (isMoving) {
            float waveSeed = castEpoch * 3.1 + float(i) * 0.7;
            float speed = 2.5 + hash(waveSeed) * 1.5;
            float freq  = 8.0 + hash(waveSeed + 1.0) * 6.0;

            float wave = lineWave(uv, lineCenter, speed, freq, waveSeed);
            float wavePosNeg = wave * 0.5 + 0.5;

            if (castVal == 9.0) { // old yang → crimson/orange wave
                col += vec3(0.8, 0.1, 0.0) * wavePosNeg * 0.6;
                col += vec3(1.0, 0.4, 0.0) * max(0.0, wave) * 0.4;
            } else { // old yin (6) → cyan/blue wave
                col += vec3(0.0, 0.5, 0.8) * wavePosNeg * 0.6;
                col += vec3(0.0, 0.9, 1.0) * max(0.0, wave) * 0.4;
            }
        }

        // Static line glow (proximity to line position)
        float lineDist = abs(uv.y - lineY);
        float inLineX = abs(uv.x) < 0.25 ? 1.0 : 0.0; // line horizontal extent
        float lineGlow = exp(-lineDist * 15.0) * inLineX;

        vec3 staticColor;
        if (castVal == 7.0) staticColor = vec3(1.0, 0.82, 0.25);      // young yang: amber
        else if (castVal == 8.0) staticColor = vec3(0.22, 0.38, 0.78); // young yin: indigo
        else if (castVal == 9.0) staticColor = vec3(0.9, 0.2, 0.05);   // old yang: crimson
        else staticColor = vec3(0.0, 0.75, 0.9);                        // old yin: cyan

        col += staticColor * lineGlow * 0.5;

        // Draw the actual line bar
        float barDist = abs(uv.y - lineY);
        float barY = step(barDist, 0.015);
        float barX;
        if (isYang) {
            // Yang: solid bar
            barX = step(abs(uv.x), 0.22);
        } else {
            // Yin: broken bar
            barX = step(abs(abs(uv.x) - 0.13), 0.09);
        }
        col += staticColor * barY * barX * 1.2;
    }

    // Wave interference field (all moving waves combined)
    float totalWave = 0.0;
    for (int i = 0; i < 6; i++) {
        if (lineVals[i] == 6.0 || lineVals[i] == 9.0) {
            float lineY = -hexHalfH + float(i) * lineSpacing;
            vec2 lc = vec2(hexX, lineY);
            float ws = castEpoch * 3.1 + float(i) * 0.7;
            float sp = 2.5 + hash(ws) * 1.5;
            float fr = 8.0 + hash(ws + 1.0) * 6.0;
            totalWave += lineWave(uv, lc, sp, fr, ws);
        }
    }

    // Interference coloring
    float interf = totalWave * 0.15;
    col += vec3(0.1, 0.05, 0.15) * interf;

    // Hexagram boundary outline
    float hexBorderX = 1.0 - smoothstep(0.0, 0.015, abs(abs(uv.x) - 0.26));
    float hexBorderY = 1.0 - smoothstep(0.0, 0.015, abs(abs(uv.y) - 0.75));
    float inHex = step(abs(uv.x), 0.26) * step(abs(uv.y), 0.75);
    col += vec3(0.2, 0.15, 0.35) * hexBorderX * step(abs(uv.y), 0.76) * 0.4;
    col += vec3(0.2, 0.15, 0.35) * hexBorderY * step(abs(uv.x), 0.27) * 0.4;

    // Time bar showing casting cycle
    float cycleT = fract(u_time / 6.0);
    float timerY = step(abs(uv.y - 0.88), 0.02);
    float timerX = step(uv.x, -aspect + cycleT * aspect * 2.0);
    col += vec3(0.5, 0.3, 0.1) * timerY * timerX * 0.5;

    // Vignette
    float vig = 1.0 - dot((gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0),
                           (gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0)) * 0.3;
    col *= vig;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
