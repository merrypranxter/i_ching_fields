/*
 * _king_wen_landscape.frag
 * King Wen Sequence as Terrain Elevation
 *
 * The 64 hexagrams arranged in their traditional 8×8 matrix.
 * Elevation = popcount(binary) / 6.0 (yang line density).
 * Pairs of reversed hexagrams (e.g., hex 1 ↔ hex 2) form valleys.
 * Adjacency gradients encode relational fields between hexagrams.
 *
 * King Wen sequence binary values (bit0=bottom line):
 *   Row 0: 63  0 17 34 23 58  2 16
 *   Row 1: 55 59  7 56 61 47  4  8
 *   Row 2: 25 38  3 48 41 37 32  1
 *   Row 3: 57 39 33 30 18 45 28 14
 *   Row 4: 60 15 40  5 53 43 20 10
 *   Row 5: 35 49 31 62 24  6 26 22
 *   Row 6: 29 46  9 36 52 11 13 44
 *   Row 7: 54 27 50 19 51 12 21 42
 *
 * Yang line count (popcount) determines height:
 *   6 yang = mountaintop (Hex 1, Qian/Heaven)
 *   0 yang = valley floor (Hex 2, Kun/Earth)
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

// KW sequence binary values, row-major
float kwBinary(int row, int col) {
    int idx = row * 8 + col;
    // Encoded as float array
    float v[64];
    v[0]=63.0; v[1]=0.0;  v[2]=17.0; v[3]=34.0; v[4]=23.0; v[5]=58.0; v[6]=2.0;  v[7]=16.0;
    v[8]=55.0; v[9]=59.0; v[10]=7.0; v[11]=56.0;v[12]=61.0;v[13]=47.0;v[14]=4.0; v[15]=8.0;
    v[16]=25.0;v[17]=38.0;v[18]=3.0; v[19]=48.0;v[20]=41.0;v[21]=37.0;v[22]=32.0;v[23]=1.0;
    v[24]=57.0;v[25]=39.0;v[26]=33.0;v[27]=30.0;v[28]=18.0;v[29]=45.0;v[30]=28.0;v[31]=14.0;
    v[32]=60.0;v[33]=15.0;v[34]=40.0;v[35]=5.0; v[36]=53.0;v[37]=43.0;v[38]=20.0;v[39]=10.0;
    v[40]=35.0;v[41]=49.0;v[42]=31.0;v[43]=62.0;v[44]=24.0;v[45]=6.0; v[46]=26.0;v[47]=22.0;
    v[48]=29.0;v[49]=46.0;v[50]=9.0; v[51]=36.0;v[52]=52.0;v[53]=11.0;v[54]=13.0;v[55]=44.0;
    v[56]=54.0;v[57]=27.0;v[58]=50.0;v[59]=19.0;v[60]=51.0;v[61]=12.0;v[62]=21.0;v[63]=42.0;
    return v[idx];
}

// Count yang lines (popcount) of 6-bit integer
float yangCount(float n) {
    float c = 0.0;
    float v = n;
    for (int i = 0; i < 6; i++) {
        c += mod(v, 2.0);
        v = floor(v / 2.0);
    }
    return c;
}

// Get elevation at continuous grid position
float getElevation(vec2 gridPos) {
    // Clamp to valid range
    gridPos = clamp(gridPos, 0.0, 7.999);
    int gx = int(floor(gridPos.x));
    int gy = int(floor(gridPos.y));
    float fx = fract(gridPos.x);
    float fy = fract(gridPos.y);
    
    // Bilinear interpolation
    float h00 = yangCount(kwBinary(gy,   gx))   / 6.0;
    float h10 = yangCount(kwBinary(gy,   min(gx+1,7))) / 6.0;
    float h01 = yangCount(kwBinary(min(gy+1,7), gx))   / 6.0;
    float h11 = yangCount(kwBinary(min(gy+1,7), min(gx+1,7))) / 6.0;
    
    // Smooth interpolation
    vec2 f = vec2(fx, fy);
    f = f * f * (3.0 - 2.0 * f); // smoothstep
    return mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    
    // Isometric-style view with slow pan
    float camAngle = u_time * 0.05;
    vec2 pan = vec2(cos(camAngle), sin(camAngle)) * 0.5;
    
    // Map UV to 8×8 grid with camera
    vec2 gridUV = uv * 8.0 + pan * 2.0;
    float elev = getElevation(gridUV);
    
    // Normal estimation from elevation gradient
    float eps = 0.05;
    float dX = getElevation(gridUV + vec2(eps, 0.0)) - getElevation(gridUV - vec2(eps, 0.0));
    float dY = getElevation(gridUV + vec2(0.0, eps)) - getElevation(gridUV - vec2(0.0, eps));
    vec3 normal = normalize(vec3(-dX / (2.0 * eps), -dY / (2.0 * eps), 1.0));
    
    // Sun direction (slow orbit)
    vec3 sunDir = normalize(vec3(cos(u_time * 0.3), sin(u_time * 0.3), 1.5));
    float diffuse = max(dot(normal, sunDir), 0.0);
    
    // Height-based coloring
    // Low = dark earth, mid = jade green, high = golden sky
    vec3 lowColor  = vec3(0.15, 0.12, 0.08);
    vec3 midColor  = vec3(0.2, 0.5, 0.25);
    vec3 highColor = vec3(0.9, 0.82, 0.4);
    vec3 terrainColor;
    if (elev < 0.4) {
        terrainColor = mix(lowColor, midColor, elev / 0.4);
    } else {
        terrainColor = mix(midColor, highColor, (elev - 0.4) / 0.6);
    }
    
    // Grid lines to show hexagram boundaries
    vec2 cellFrac = fract(gridUV);
    float gridLine = 1.0 - smoothstep(0.0, 0.04, min(cellFrac.x, min(1.0-cellFrac.x, min(cellFrac.y, 1.0-cellFrac.y))));
    
    vec3 col = terrainColor * (0.2 + 0.8 * diffuse);
    col += vec3(0.3, 0.25, 0.5) * gridLine * 0.3;
    
    // Contour lines
    float contour = sin(elev * 30.0 + u_time * 0.2);
    col += vec3(1.0, 0.9, 0.6) * smoothstep(0.85, 1.0, contour) * 0.15;
    
    // Specular highlight on peaks
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    col += vec3(1.0, 0.95, 0.8) * spec * 0.4;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
