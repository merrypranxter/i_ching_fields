// _binary_mandala_base.frag
// I Ching field generator: 6-bit hexagram as radial mandala
// Trigram sectors (8 directions), yin/yang polarity, binary pattern

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Trigram to element mapping
// ☰ Qian (Heaven) = 111, ☷ Kun (Earth) = 000, ☳ Zhen (Thunder) = 100, ☵ Kan (Water) = 010
// ☶ Gen (Mountain) = 001, ☴ Xun (Wind) = 110, ☲ Li (Fire) = 101, ☱ Dui (Lake) = 011

// Trigram color (element association)
vec3 trigramColor(int tri) {
    if (tri == 7) return vec3(1.0, 0.9, 0.5);    // ☰ Heaven - gold/white
    if (tri == 0) return vec3(0.4, 0.3, 0.2);    // ☷ Earth - brown
    if (tri == 4) return vec3(0.9, 0.8, 0.2);    // ☳ Thunder - yellow/bright
    if (tri == 2) return vec3(0.2, 0.3, 0.8);    // ☵ Water - deep blue
    if (tri == 1) return vec3(0.5, 0.5, 0.4);    // ☶ Mountain - gray/stone
    if (tri == 6) return vec3(0.3, 0.7, 0.4);    // ☴ Wind - green
    if (tri == 5) return vec3(0.9, 0.3, 0.1);    // ☲ Fire - red/orange
    if (tri == 3) return vec3(0.6, 0.8, 0.9);    // ☱ Lake - light blue
    return vec3(0.5);
}

// Extract trigram from 6-bit hexagram (0-63)
// Upper trigram: bits 3-5 (lines 4,5,6)
// Lower trigram: bits 0-2 (lines 1,2,3)
int upperTrigram(int hex) {
    return (hex >> 3) & 7;
}

int lowerTrigram(int hex) {
    return hex & 7;
}

// Is a line yang (solid) or yin (broken)?
// Line positions from bottom: 0, 1, 2, 3, 4, 5
bool isYang(int hex, int line) {
    return ((hex >> line) & 1) == 1;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    float r = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Current hexagram based on time
    int hexagram = int(mod(u_time * 2.0, 64.0));
    
    // ---- OUTER RING: Upper trigram (8-fold sectors) ----
    float sectorAngle = atan(uv.y, uv.x) + 3.14159265;
    float sector = floor(sectorAngle / (2.0 * 3.14159265 / 8.0));
    
    vec3 color = vec3(0.05, 0.04, 0.08); // deep indigo background
    
    // Outer ring: upper trigram color
    if (r > 0.5 && r < 0.8) {
        int upper = upperTrigram(hexagram);
        // Map 8 trigram positions to 8 sectors
        float trigramSector = float(upper);
        float sectorMatch = 1.0 - smoothstep(0.0, 0.5, abs(sector - trigramSector));
        color = mix(color, trigramColor(upper), sectorMatch * 0.7);
    }
    
    // ---- INNER RING: Lower trigram (concentric, smaller) ----
    if (r > 0.2 && r < 0.45) {
        int lower = lowerTrigram(hexagram);
        color = mix(color, trigramColor(lower), 0.6);
    }
    
    // ---- HEXAGRAM LINES: 6 radial bands ----
    // Each band shows the line state: yang = solid, yin = broken
    for (int line = 0; line < 6; line++) {
        float lineR = 0.15 + float(line) * 0.05;
        float lineWidth = 0.02;
        
        if (abs(r - lineR) < lineWidth) {
            bool yang = isYang(hexagram, line);
            if (yang) {
                // Solid line: continuous
                color = vec3(0.9, 0.9, 0.8); // white/gold
            } else {
                // Broken line: only show in two segments
                float breakWidth = 0.3;
                float angleNorm = mod(angle + 3.14159265, 2.0 * 3.14159265) / (2.0 * 3.14159265);
                if (abs(angleNorm - 0.25) < breakWidth || abs(angleNorm - 0.75) < breakWidth) {
                    color = vec3(0.9, 0.9, 0.8);
                } else {
                    color = vec3(0.2, 0.2, 0.3); // dark gap
                }
            }
        }
    }
    
    // ---- CENTER: Hexagram number ----
    if (r < 0.1) {
        float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
        color = vec3(0.8, 0.7, 0.5) * pulse;
    }
    
    // ---- CHANGING LINES: time-pulse on mutable lines ----
    // For demo, highlight lines that would change
    float changePhase = sin(u_time * 0.5 + float(hexagram) * 0.1);
    if (changePhase > 0.7) {
        // Highlight outer ring for emphasis
        color += vec3(0.1, 0.05, 0.0) * smoothstep(0.7, 1.0, changePhase);
    }
    
    // Subtle radial grid
    float grid = smoothstep(0.005, 0.0, abs(mod(r * 20.0, 1.0) - 0.5));
    color += vec3(0.05) * grid * (1.0 - r);
    
    gl_FragColor = vec4(color, 1.0);
}
