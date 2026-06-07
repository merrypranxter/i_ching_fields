/*
 * _bagua_compass.frag
 * Bagua Compass — 8 Trigrams on 8-Point Compass
 *
 * The Later Heaven (King Wen) arrangement of the 8 trigrams on a compass:
 *   S  = Li    (Fire,    5=101) — summer, south, noon
 *   SW = Kun   (Earth,   0=000) — late summer, southwest
 *   W  = Dui   (Lake,    3=011) — autumn, west, dusk
 *   NW = Qian  (Heaven,  7=111) — late autumn, northwest
 *   N  = Kan   (Water,   2=010) — winter, north, midnight
 *   NE = Gen   (Mountain,4=100) — late winter, northeast
 *   E  = Zhen  (Thunder, 1=001) — spring, east, dawn
 *   SE = Xun   (Wind,    6=110) — late spring, southeast
 *
 * The compass slowly rotates, driven by u_time, simulating seasonal
 * and diurnal cycles. Each sector shows its trigram lines and elemental
 * force field. The center shows the yin-yang taiji symbol.
 *
 * Earlier Heaven (Fu Xi) arrangement shown in the inner ring for contrast.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358979

float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

// Trigram colors (Later Heaven element associations)
vec3 trigramColor(int tri) {
    if (tri == 5) return vec3(1.0, 0.25, 0.05);  // Li/Fire: red
    if (tri == 0) return vec3(0.35, 0.55, 0.2);  // Kun/Earth: dark yellow-green
    if (tri == 3) return vec3(0.3, 0.75, 0.95);  // Dui/Lake: sky blue
    if (tri == 7) return vec3(1.0, 0.92, 0.45);  // Qian/Heaven: gold
    if (tri == 2) return vec3(0.1, 0.35, 0.85);  // Kan/Water: deep blue
    if (tri == 4) return vec3(0.55, 0.5, 0.42);  // Gen/Mountain: stone
    if (tri == 1) return vec3(0.9, 0.55, 0.1);   // Zhen/Thunder: orange
    return vec3(0.5, 0.85, 0.5);                  // Xun/Wind: green
}

// Draw a small trigram glyph at position p, with cell size s
float trigramGlyph(vec2 p, float triVal, float s) {
    float result = 0.0;
    float lineH = s * 0.12;
    float lineW = s * 0.4;
    float gap   = s * 0.08;
    for (int li = 0; li < 3; li++) {
        float bit = getBit(triVal, li);
        float centY = (float(li) - 1.0) * (lineH + gap);
        vec2 lp = p - vec2(0.0, centY);
        if (bit > 0.5) {
            // Yang: solid
            if (abs(lp.x) < lineW && abs(lp.y) < lineH * 0.5) result = 1.0;
        } else {
            // Yin: two halves
            if ((abs(lp.x + lineW * 0.35) < lineW * 0.45 || abs(lp.x - lineW * 0.35) < lineW * 0.45)
                && abs(lp.y) < lineH * 0.5) result = 1.0;
        }
    }
    return result;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    float r = length(uv);
    float angle = atan(uv.y, uv.x); // -PI to PI

    // Slow rotation driven by time
    float rotation = u_time * 0.05; // one full rotation per 125.7 seconds (~2 min)
    float rotAngle = angle - rotation;
    // Normalize to 0..2PI
    rotAngle = mod(rotAngle + 2.0 * PI, 2.0 * PI);

    // Later Heaven trigram order (clockwise from South/top=PI/2):
    // Starting from S(PI/2) going clockwise: Li, Kun, Dui, Qian, Kan, Gen, Zhen, Xun
    // In angle terms: sector i covers [i*PI/4 - PI/8 ... i*PI/4 + PI/8] from top
    // Map angle from [0..2PI] where 0=East, PI/2=North in standard math coords
    // South = PI/2 in math coords. We want S at top.
    // Remap: sectorAngle = (PI/2 - rotAngle) mod 2PI  => 0=S, PI/4=SW, etc.
    float sectorAngle = mod(PI / 2.0 - (angle - rotation) + 2.0 * PI, 2.0 * PI);
    int sector = int(floor(sectorAngle / (PI / 4.0)));
    sector = clamp(sector, 0, 7);

    int lhOrder[8]; // Later Heaven
    lhOrder[0] = 5; lhOrder[1] = 0; lhOrder[2] = 3; lhOrder[3] = 7;
    lhOrder[4] = 2; lhOrder[5] = 4; lhOrder[6] = 1; lhOrder[7] = 6;
    int fxOrder[8]; // Earlier Heaven (Fu Xi)
    fxOrder[0] = 7; fxOrder[1] = 4; fxOrder[2] = 1; fxOrder[3] = 2;
    fxOrder[4] = 0; fxOrder[5] = 3; fxOrder[6] = 6; fxOrder[7] = 5;

    int tri = lhOrder[sector];

    vec3 bg = vec3(0.03, 0.025, 0.06);
    vec3 col = bg;

    // Outer ring: Later Heaven sectors (r: 0.4 to 0.9)
    if (r > 0.4 && r < 0.9) {
        // Sector fill with trigram color
        vec3 secColor = trigramColor(tri);
        float sectorFade = sin(sectorAngle / (PI / 4.0) * PI) * 0.5 + 0.5; // smooth sector edges
        col = secColor * (0.15 + 0.25 * sectorFade);

        // Elemental force field lines within sector
        float fieldLine = sin(r * 20.0 + float(tri) * 0.8 - u_time * float(tri + 1) * 0.3);
        col += secColor * 0.15 * smoothstep(0.7, 1.0, fieldLine);

        // Trigram glyph in sector
        float sectorMidAngle = (float(sector) + 0.5) * PI / 4.0;
        float glyphR = 0.65;
        // Position of glyph center in original coords
        float glyphAngle = mod(PI / 2.0 - sectorMidAngle + rotation, 2.0 * PI);
        vec2 glyphCenter = vec2(cos(glyphAngle), sin(glyphAngle)) * glyphR;
        glyphCenter.x *= 1.0; // aspect already applied to uv
        
        float glyph = trigramGlyph(uv - glyphCenter, float(tri), 0.12);
        col = mix(col, trigramColor(tri) * 1.5, glyph * 0.9);
    }

    // Inner ring: Earlier Heaven reference (r: 0.2 to 0.38)
    if (r > 0.2 && r < 0.38) {
        // Use fixed (non-rotating) arrangement for comparison
        float staticAngle = mod(PI / 2.0 - (angle) + 2.0 * PI, 2.0 * PI);
        int staticSector = int(floor(staticAngle / (PI / 4.0)));
        staticSector = clamp(staticSector, 0, 7);
        int fxTri = fxOrder[staticSector];
        vec3 fxColor = trigramColor(fxTri);
        col = fxColor * 0.12 + vec3(0.02, 0.02, 0.04);
        float innerGlyph = trigramGlyph(uv * 3.0 - normalize(uv) * 0.85, float(fxTri), 0.08);
        col = mix(col, fxColor, innerGlyph * 0.7);
    }

    // Yin-Yang taiji at center (r < 0.18)
    if (r < 0.18) {
        // Classic taiji: yin-yang split by S-curve
        float yy = uv.y / max(r, 0.001);
        // Upper = yang (white/gold), lower = yin (black/dark)
        // S-curve using small circles
        float yangSide = uv.y + 0.09 * sin(uv.x / 0.09 * PI);
        float isYang = yangSide > 0.0 ? 1.0 : 0.0;
        // Small yin circle in yang field
        float yinDotR = length(uv - vec2(0.0, 0.07));
        float yangDotR = length(uv - vec2(0.0, -0.07));
        if (yinDotR < 0.035) isYang = 0.0;
        if (yangDotR < 0.035) isYang = 1.0;
        col = mix(vec3(0.04, 0.04, 0.09), vec3(1.0, 0.95, 0.75), isYang);
    }

    // Ring borders
    float outerBorder = 1.0 - smoothstep(0.0, 0.012, abs(r - 0.9));
    float midBorder   = 1.0 - smoothstep(0.0, 0.008, abs(r - 0.4));
    float innerBorder = 1.0 - smoothstep(0.0, 0.006, abs(r - 0.2));
    col += vec3(0.5, 0.45, 0.3) * (outerBorder + midBorder + innerBorder) * 0.5;

    // Sector dividing lines (8 spokes)
    float spokeAngle = mod(sectorAngle, PI / 4.0);
    float spoke = 1.0 - smoothstep(0.0, 0.015, min(spokeAngle, PI / 4.0 - spokeAngle));
    col += vec3(0.3, 0.25, 0.2) * spoke * (r > 0.2 && r < 0.9 ? 0.4 : 0.0);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
