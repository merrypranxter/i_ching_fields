/*
 * _hexagram_weave.frag
 * Hexagram Weave — 64 Hexagrams as 8×8 Texture, Interlocking Patterns
 *
 * The complete system of 64 hexagrams arranged as an 8×8 King Wen matrix.
 * Each cell contains its hexagram drawn as 6 stacked lines.
 * Adjacent cells interact: shared trigrams create visual "stitching" —
 * the upper trigram of one hexagram connects to the lower of its neighbor.
 *
 * KW matrix binary values (row 0 top, row-major):
 *   Row 0: 63  0 17 34 23 58  2 16
 *   Row 1: 55 59  7 56 61 47  4  8
 *   Row 2: 25 38  3 48 41 37 32  1
 *   Row 3: 57 39 33 30 18 45 28 14
 *   Row 4: 60 15 40  5 53 43 20 10
 *   Row 5: 35 49 31 62 24  6 26 22
 *   Row 6: 29 46  9 36 52 11 13 44
 *   Row 7: 54 27 50 19 51 12 21 42
 *
 * Weave coloring: upper trigram = warm color, lower trigram = cool color.
 * Connected trigram boundary lines glow where adjacent hexagrams share a trigram.
 * Slow zoom and pan reveals the full tapestry of the oracle.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float getBit(float n, int i) {
    return mod(floor(n / pow(2.0, float(i))), 2.0);
}

float kwBinary(int row, int col) {
    row = clamp(row, 0, 7);
    col = clamp(col, 0, 7);
    float v[64];
    v[0]=63.0;v[1]=0.0; v[2]=17.0;v[3]=34.0;v[4]=23.0;v[5]=58.0;v[6]=2.0; v[7]=16.0;
    v[8]=55.0;v[9]=59.0;v[10]=7.0;v[11]=56.0;v[12]=61.0;v[13]=47.0;v[14]=4.0;v[15]=8.0;
    v[16]=25.0;v[17]=38.0;v[18]=3.0;v[19]=48.0;v[20]=41.0;v[21]=37.0;v[22]=32.0;v[23]=1.0;
    v[24]=57.0;v[25]=39.0;v[26]=33.0;v[27]=30.0;v[28]=18.0;v[29]=45.0;v[30]=28.0;v[31]=14.0;
    v[32]=60.0;v[33]=15.0;v[34]=40.0;v[35]=5.0;v[36]=53.0;v[37]=43.0;v[38]=20.0;v[39]=10.0;
    v[40]=35.0;v[41]=49.0;v[42]=31.0;v[43]=62.0;v[44]=24.0;v[45]=6.0;v[46]=26.0;v[47]=22.0;
    v[48]=29.0;v[49]=46.0;v[50]=9.0;v[51]=36.0;v[52]=52.0;v[53]=11.0;v[54]=13.0;v[55]=44.0;
    v[56]=54.0;v[57]=27.0;v[58]=50.0;v[59]=19.0;v[60]=51.0;v[61]=12.0;v[62]=21.0;v[63]=42.0;
    return v[row * 8 + col];
}

// Upper trigram color (warm)
vec3 upperColor(float tri) {
    return vec3(0.8 + tri/14.0, 0.5 + tri/21.0, 0.1 + tri/63.0);
}
// Lower trigram color (cool)
vec3 lowerColor(float tri) {
    return vec3(0.1 + tri/63.0, 0.3 + tri/28.0, 0.7 + tri/21.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    // Slow pan and gentle zoom
    float zoom = 1.0 + 0.15 * sin(u_time * 0.07);
    vec2 pan = vec2(cos(u_time * 0.04), sin(u_time * 0.03)) * 0.3;
    vec2 gridUV = (uv - 0.5 + pan * 0.1) * zoom * 8.0 + 4.0;
    gridUV.x *= aspect;

    // Which cell in 8×8 grid?
    int gx = int(clamp(floor(gridUV.x), 0.0, 7.0));
    int gy = int(clamp(floor(gridUV.y), 0.0, 7.0));
    int gyFlip = 7 - gy;

    vec2 localUV = fract(gridUV); // 0-1 within cell

    float hexVal = kwBinary(gyFlip, gx);
    float upperTri = floor(hexVal / 8.0); // bits 3-5
    float lowerTri = mod(hexVal, 8.0);    // bits 0-2

    // Draw the 6 lines
    float lineIdx_f = localUV.y * 6.0;
    int lineIdx = int(clamp(floor(lineIdx_f), 0.0, 5.0));
    float ly = fract(lineIdx_f);
    float lx = localUV.x;

    float bitVal = getBit(hexVal, lineIdx);
    float padding = 0.12;
    float gap = 0.17;
    float inBar;
    if (bitVal > 0.5) {
        inBar = step(padding, lx) * step(lx, 1.0 - padding) * step(0.1, ly) * step(ly, 0.9);
    } else {
        inBar = (step(padding, lx) * step(lx, 0.5 - gap) + step(0.5 + gap, lx) * step(lx, 1.0 - padding))
              * step(0.1, ly) * step(ly, 0.9);
    }

    // Color: upper 3 lines get warm tone, lower 3 get cool tone
    bool isUpperHalf = (lineIdx >= 3);
    vec3 lineColor = isUpperHalf ? upperColor(upperTri) : lowerColor(lowerTri);

    vec3 bg = vec3(0.05, 0.04, 0.08);
    vec3 col = mix(bg, lineColor, inBar);

    // Weave stitching: check if neighbor shares a trigram
    int nRight = gx < 7 ? gx + 1 : gx;
    int nAbove = gyFlip > 0 ? gyFlip - 1 : gyFlip;
    float hexRight = kwBinary(gyFlip, nRight);
    float hexAbove = kwBinary(nAbove, gx);

    float rightLowerTri = mod(hexRight, 8.0);
    float aboveUpperTri = floor(hexAbove / 8.0);

    // Shared trigram boundary glow
    bool sharedRight = (upperTri == rightLowerTri || lowerTri == mod(hexRight, 8.0));
    bool sharedAbove = (lowerTri == aboveUpperTri);

    float rightBorder = 1.0 - smoothstep(0.0, 0.06, abs(localUV.x - 1.0));
    float topBorder   = 1.0 - smoothstep(0.0, 0.06, abs(localUV.y - 1.0));

    if (sharedRight) col += lineColor * rightBorder * 0.4 * (sin(u_time * 2.0 + hexVal * 0.1) * 0.3 + 0.7);
    if (sharedAbove) col += lineColor * topBorder   * 0.4 * (sin(u_time * 1.8 + hexVal * 0.15) * 0.3 + 0.7);

    // Cell dividers
    float divider = (1.0 - smoothstep(0.0, 0.025, min(localUV.x, min(1.0 - localUV.x, min(localUV.y, 1.0 - localUV.y)))));
    col += vec3(0.12, 0.1, 0.18) * divider;

    // Vignette
    vec2 vUV = uv * 2.0 - 1.0;
    float vignette = 1.0 - dot(vUV, vUV) * 0.4;
    col *= vignette;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
