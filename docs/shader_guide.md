# Shader Guide — I Ching Fields

A practical guide to using the GLSL shaders in this repository. All shaders target **WebGL 1.0 / GLSL ES 2.0**, making them compatible with Shadertoy, Three.js, Book of Shaders, and standard canvas-based rendering.

---

## Quick Start

### Shadertoy

1. Go to [shadertoy.com](https://www.shadertoy.com) and create a new shader.
2. Copy any `.frag` file from `shaders/`.
3. **Rename uniforms** (Shadertoy uses `iTime` and `iResolution`):

```glsl
// Change this in the shader header:
uniform float u_time;       → iTime
uniform vec2 u_resolution;  → iResolution.xy

// Or add these two lines at the top of main():
float u_time = iTime;
vec2 u_resolution = iResolution.xy;
```

4. Shadertoy uses `mainImage(out vec4 fragColor, in vec2 fragCoord)` — replace `main()` and `gl_FragColor` accordingly.

### Three.js

```javascript
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load shader source
const fragSource = await fetch('shaders/_bagua_compass.frag').then(r => r.text());

const material = new THREE.ShaderMaterial({
    fragmentShader: fragSource,
    uniforms: {
        u_time:       { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }
});

const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    material
);
const scene = new THREE.Scene();
scene.add(mesh);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function animate(t) {
    requestAnimationFrame(animate);
    material.uniforms.u_time.value = t / 1000;
    renderer.render(scene, camera);
}
animate(0);
```

### Plain WebGL (Minimal Setup)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; background: #000; }
        canvas { display: block; }
    </style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

const vertSrc = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Load your shader source here
const fragSrc = /* paste shader content or fetch it */;

function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
    return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vertSrc));
gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fragSrc));
gl.linkProgram(prog);
gl.useProgram(prog);

// Full-screen quad
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
const pos = gl.getAttribLocation(prog, 'a_pos');
gl.enableVertexAttribArray(pos);
gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

const uTime = gl.getUniformLocation(prog, 'u_time');
const uRes  = gl.getUniformLocation(prog, 'u_resolution');
gl.uniform2f(uRes, canvas.width, canvas.height);

function render(t) {
    gl.uniform1f(uTime, t / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
</script>
</body>
</html>
```

### Book of Shaders (GLSL Canvas)

If using [The Book of Shaders editor](https://editor.thebookofshaders.com/) or the `glslCanvas` library:

```html
<canvas class="glslCanvas" data-fragment-url="shaders/_changing_lines_flow.frag"
        width="500" height="500"></canvas>
<script src="GlslCanvas.js"></script>
```

The `glslCanvas` library automatically provides `u_time` and `u_resolution`.

---

## Shader Catalogue

### `_binary_mandala_base.frag`
**Entry point.** A 6-bit radial mandala. Hexagram bits arranged in concentric rings, rotating with time. Good starting point before exploring the others.

**Key parameter**: Change the `HEXAGRAM_VALUE` constant near the top to render any of the 64 hexagrams.

---

### `_changing_lines_flow.frag`
**Cellular automaton.** A grid of hexagram cells where lines flip based on neighbor XOR pressure. Each cell evolves over time.

**What to watch for**: Clusters of changing lines (crimson/cyan) propagating through the grid. Clusters correspond to regions of high "tension" in the 64-state space.

**Mathematical core**: Cell state = `hash(cell_pos + floor(phase)) mod 64`. Neighbor XOR drives evolution.

---

### `_trigram_elemental.frag`
**Directional force fields.** The 8 trigrams arranged as sectors of a circle (Later Heaven / King Wen compass), each generating its elemental force field:
- Water (北/North): flows downward
- Fire (南/South): rises
- Mountain (東北/NE): zero field — static
- Wind (東南/SE): diagonal permeation
- Heaven (西北/NW): radial outward
- Earth (西南/SW): gravitational downward

**Tip**: Watch the center point where all forces converge.

---

### `_king_wen_landscape.frag`
**Terrain elevation.** The 8×8 King Wen matrix where elevation = yang line count / 6. Hexagram 1 (Qian, 6 yang) is the highest peak; Hexagram 2 (Kun, 0 yang) is the lowest valley.

**Mathematical note**: The King Wen sequence is NOT monotonic in yang count — the elevation is textured and irregular, reflecting the non-binary nature of the traditional ordering.

---

### `_temporal_hexagram.frag`
**Yarrow stem casting.** Every 8 seconds, a new hexagram is "cast" using real yarrow stem probabilities (1/16, 5/16, 7/16, 3/16). The left hexagram is the primary; the right is the resultant after changing lines flip.

**Changing line colors**:
- Crimson pulse = Old yang (9, moving) → will become yin
- Cyan pulse = Old yin (6, moving) → will become yang

---

### `_nuclear_hexagram.frag`
**Inner extraction.** Cycles through all 64 hexagrams. The main hexagram shows the outer structure; nuclear lines (2-4) are highlighted in green-gold. The small right panel shows the extracted nuclear hexagram.

**Key observation**: Some hexagrams are self-nuclear (Qian → Qian). The nuclear hexagram always comes from a smaller "inner window" of the bits.

---

### `_reverse_hexagram.frag`
**Bit reversal and splitting.** A vertical split-line travels left to right. Left of the split shows the primary hexagram; right shows the reversed hexagram. The complement (all bits flipped) appears as a small icon.

**Mathematical connection**: The split line represents the moment of inversion — the 180° rotation that reveals the "shadow" hexagram embedded in the original.

---

### `_combined_hexagram.frag`
**Three-state landscape.** Left panel = nuclear (green), center = primary (gold, larger), right = reverse (blue). Dot indicators above each show the 6-bit binary pattern. The XOR difference field pulses in the background.

**Symbolic reading**: Nuclear is past/seed, primary is present/situation, reverse is future/perspective-shift.

---

### `_bagua_compass.frag`
**Rotating compass.** Slowly spinning Later Heaven bagua with trigram glyphs. Inner ring = Earlier Heaven (Fu Xi) arrangement, static for comparison. Center = yin-yang taiji symbol.

**Rotation speed**: One full revolution every ~125 seconds (adjustable by changing `0.05` in `rotation = u_time * 0.05`).

---

### `_lo_shu_square.frag`
**Magic square resonance.** The 3×3 Lo Shu grid with each cell showing its trigram force field. Magic sum-15 diagonal trails pulse. Mountain (center-left, value 8) has a zero-force field; Fire (top-center, value 9) rises.

**Lo Shu magic property**: Every row, column, diagonal sums to 15. This number (3×5) connects to the center value (5), linking the magic square to the bagua through cardinal arithmetic.

---

### `_hexagram_weave.frag`
**Full tapestry.** All 64 hexagrams tiled as an 8×8 texture with slow pan and zoom. Shared trigrams between adjacent cells create glowing "stitching" lines. Upper half of each cell is warm-toned (upper trigram), lower half is cool-toned (lower trigram).

**Tip**: Watch the boundary glow between cells that share a trigram — these are the "bridges" of the King Wen landscape.

---

### `_changing_line_pulse.frag`
**Wave propagation.** A single hexagram (recast every 6 seconds) emits waves from its moving lines. Old yang (9) → crimson waves; old yin (6) → cyan waves. Wave interference creates moiré patterns — a visualization of the I Ching field.

**Wave physics**: Each moving line emits a damped circular wave: `sin(r * freq - time * speed) * exp(-r * 2.5)`.

---

## Uniform Reference

All shaders accept exactly these two uniforms (no more required):

| Uniform | Type | Description |
|---------|------|-------------|
| `u_time` | `float` | Time in seconds since start |
| `u_resolution` | `vec2` | Canvas size in pixels (width, height) |

**Note**: Some shaders contain hardcoded hexagram data arrays. These are self-contained and require no texture inputs.

---

## Passing Hexagram Data as Uniforms

For interactive applications where you want to control which hexagram is displayed:

```glsl
// Add to shader:
uniform float u_hexagram; // 0.0 to 63.0 (KW sequence index - 1)

// Example usage in shader:
float hexVal = floor(u_hexagram); // ensure integer
float upperTri = floor(hexVal / 8.0);
float lowerTri = mod(hexVal, 8.0);
```

Then in JavaScript:
```javascript
material.uniforms.u_hexagram = { value: 0.0 }; // Hexagram 1 (Qian)
// Change to hexagram 63 (Ji Ji):
material.uniforms.u_hexagram.value = 62.0; // 0-indexed
```

---

## Passing Hexagram Data as a Texture

For the full 64-hexagram dataset, pack binary values into a texture:

```javascript
// Create 8×8 texture of hexagram binary values
const KW_BINARY = [63, 0, 17, 34, 23, 58, 2, 16,
                   55, 59, 7, 56, 61, 47, 4, 8,
                   // ... all 64 values
                  ];

const texData = new Float32Array(64);
KW_BINARY.forEach((v, i) => { texData[i] = v / 63.0; }); // normalize

const texture = new THREE.DataTexture(texData, 8, 8, THREE.LuminanceFormat, THREE.FloatType);
texture.needsUpdate = true;
material.uniforms.u_hex_texture = { value: texture };
```

Then in GLSL:
```glsl
uniform sampler2D u_hex_texture;

float lookupHex(int row, int col) {
    vec2 uv = (vec2(float(col), float(row)) + 0.5) / 8.0;
    return texture2D(u_hex_texture, uv).r * 63.0;
}
```

---

## Performance Notes

- All shaders use **O(1)** per-fragment computation (no texture sampling by default)
- The internal `float v[64]` arrays are stored in GPU registers — fast but use shader registers
- For mobile, consider reducing the `for` loop iteration counts in wave shaders
- `_hexagram_weave.frag` samples from a 64-element array per fragment — most expensive shader in the set

---

## Common Modifications

### Change animation speed
Find `u_time * X` multiplier and adjust X. Typical values:
- `* 0.05` = very slow (meditative)
- `* 0.3` = natural (default most shaders)
- `* 2.0` = fast (energetic)

### Lock to a specific hexagram
Replace time-driven `hexIdx = mod(floor(u_time / N), 64.0)` with a constant:
```glsl
float hexIdx = 0.0; // Qian (Hex 1)
float hexIdx = 62.0; // Ji Ji (Hex 63)
```

### Adjust color palette
Each shader has named color constants near the top of `main()`. The standard palette:
- Yang: `vec3(1.0, 0.82, 0.25)` (amber)
- Yin: `vec3(0.22, 0.38, 0.78)` (indigo)
- Old yang: `vec3(0.9, 0.1, 0.05)` (crimson)
- Old yin: `vec3(0.0, 0.75, 0.9)` (cyan)
- Background: `vec3(0.03, 0.025, 0.06)` (near-black purple)

### Combine two shaders
To blend two shaders (e.g., `_trigram_elemental` + `_changing_lines_flow`):

```glsl
// At the end of main(), instead of gl_FragColor:
vec3 colA = /* trigram elemental computation */;
vec3 colB = /* changing lines computation */;
vec3 blend = mix(colA, colB, 0.5); // equal blend
// Or: screen blend:
vec3 screen = 1.0 - (1.0 - colA) * (1.0 - colB);
gl_FragColor = vec4(screen, 1.0);
```

---

## Hexagram Number Reference (Quick)

The most visually interesting hexagrams to explore with these shaders:

| KW# | Binary | Name | Visual character |
|-----|--------|------|-----------------|
| 1 | 63 (111111) | Qian/Heaven | Maximum yang — all lines bright, full energy |
| 2 | 0 (000000) | Kun/Earth | Maximum yin — all lines dark, receptive |
| 11 | 7 (000111) | Tai/Peace | Lower half yang, upper half yin — balanced |
| 29 | 18 (010010) | Kan/Water | Self-nuclear: water contains itself |
| 30 | 45 (101101) | Li/Fire | Self-nuclear: fire contains itself |
| 63 | 21 (010101) | Ji Ji/After Completion | Perfect alternation — most ordered |
| 64 | 42 (101010) | Wei Ji/Before Completion | Mirror of Ji Ji — most dynamic |
