/*
 * _trigram_elemental.frag
 * Trigram Elemental Force Fields
 *
 * The 8 trigrams each encode an elemental force as a directional vector field.
 * Trigram binary values (bottom-bit=line1):
 *   Heaven=7(111): Creative, outward radial force, south
 *   Earth=0(000):  Receptive, inward/downward gravity, north
 *   Thunder=1(001):Arousing, radial pulse outward from center
 *   Water=2(010):  Abysmal, downward flow with lateral diffusion
 *   Mountain=4(100):Keeping Still, zero field (blocking)
 *   Wind=6(110):   Gentle, diagonal permeating flow
 *   Fire=5(101):   Clinging, upward radial heat shimmer
 *   Lake=3(011):   Joyous, horizontal mirror reflection
 *
 * The field lines are visualized using flow-line integration (Euler steps),
 * with color mapping by trigram element and field magnitude.
 */

precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

// Trigram index (0-7) to force vector at point p
vec2 trigramForce(int tri, vec2 p, float t) {
    if (tri == 7) { // Heaven: radial outward
        return normalize(p) * 0.8 + vec2(0.0, 0.3);
    } else if (tri == 0) { // Earth: downward gravity
        return vec2(sin(p.x * 2.0) * 0.2, -0.9);
    } else if (tri == 1) { // Thunder: radial pulse
        float r = length(p);
        float pulse = sin(r * 8.0 - t * 4.0);
        return normalize(p + 0.001) * pulse;
    } else if (tri == 2) { // Water: flows down, laterally diffuses
        return vec2(sin(p.y * 3.0 + t) * 0.4, -0.7 - 0.2 * cos(p.x * 2.0));
    } else if (tri == 4) { // Mountain: static blocking
        return vec2(0.0, 0.0);
    } else if (tri == 6) { // Wind: diagonal permeating
        return vec2(0.6 + 0.2 * sin(p.y * 4.0 + t), 0.3 * cos(p.x * 3.0));
    } else if (tri == 5) { // Fire: rises upward with shimmer
        float shimmer = sin(p.x * 6.0 + t * 2.0) * 0.3;
        return vec2(shimmer, 0.9 + shimmer * 0.2);
    } else { // Lake (3): horizontal mirror
        return vec2(0.7, sin(p.x * 4.0 + t) * 0.3);
    }
}

// Trigram colors
vec3 trigramColor(int tri) {
    if (tri == 7) return vec3(1.0, 0.92, 0.4);   // Heaven: gold
    if (tri == 0) return vec3(0.25, 0.55, 0.25);  // Earth: dark green
    if (tri == 1) return vec3(0.9, 0.5, 0.1);     // Thunder: orange
    if (tri == 2) return vec3(0.1, 0.4, 0.9);     // Water: deep blue
    if (tri == 4) return vec3(0.5, 0.45, 0.4);    // Mountain: stone grey
    if (tri == 6) return vec3(0.6, 0.85, 0.6);    // Wind: pale green
    if (tri == 5) return vec3(1.0, 0.3, 0.1);     // Fire: red-orange
    return vec3(0.4, 0.75, 0.95);                  // Lake: pale blue
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Determine trigram sector (8 equal angular wedges)
    float angle = atan(uv.y, uv.x); // -PI to PI
    // Normalize to 0-1 and map to 8 sectors
    float normAngle = (angle / 6.2832 + 1.0);
    normAngle = fract(normAngle);
    int sector = int(floor(normAngle * 8.0));
    
    // King Wen Later Heaven arrangement (clockwise from South):
    // S=Li(5), SW=Kun(0), W=Dui(3), NW=Qian(7), N=Kan(2), NE=Gen(4), E=Zhen(1), SE=Xun(6)
    int trigramOrder[8];
    trigramOrder[0] = 5;  // S: Fire/Li
    trigramOrder[1] = 0;  // SW: Earth/Kun
    trigramOrder[2] = 3;  // W: Lake/Dui
    trigramOrder[3] = 7;  // NW: Heaven/Qian
    trigramOrder[4] = 2;  // N: Water/Kan
    trigramOrder[5] = 4;  // NE: Mountain/Gen
    trigramOrder[6] = 1;  // E: Thunder/Zhen
    trigramOrder[7] = 6;  // SE: Wind/Xun
    
    int tri = trigramOrder[sector];

    // Flow-line tracing: march along field
    vec2 p = uv;
    float accumMag = 0.0;
    vec2 accumDir = vec2(0.0);
    float stepSize = 0.015;
    for (int s = 0; s < 8; s++) {
        vec2 f = trigramForce(tri, p, u_time);
        float mag = length(f);
        accumMag += mag;
        accumDir += normalize(f + 0.0001);
        p += normalize(f + 0.0001) * stepSize;
    }
    accumMag /= 8.0;

    // Field line pattern (dot product of position and flow)
    vec2 meanDir = normalize(accumDir + 0.0001);
    float flowLines = sin(dot(uv, vec2(-meanDir.y, meanDir.x)) * 20.0 + u_time);
    flowLines = smoothstep(0.6, 1.0, abs(flowLines));

    vec3 baseColor = trigramColor(tri);
    vec3 col = baseColor * (0.3 + 0.5 * accumMag);
    col += baseColor * flowLines * 0.5;

    // Sector boundary glow
    float wedgePos = fract(normAngle * 8.0);
    float boundary = 1.0 - smoothstep(0.0, 0.04, min(wedgePos, 1.0 - wedgePos));
    col += vec3(0.8) * boundary * 0.3;

    // Mountain (4) special: dark and still
    if (tri == 4) col *= 0.4 + 0.1 * sin(u_time * 0.1);

    // Center circle: all trigrams converge
    float centerR = length(uv);
    float centerBlend = 1.0 - smoothstep(0.1, 0.15, centerR);
    col = mix(col, vec3(1.0, 1.0, 0.8), centerBlend * 0.7);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
