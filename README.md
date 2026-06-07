# i_ching_fields

A creative coding project exploring **I Ching as a field generator** — using the 64 hexagrams and their binary/yarrow-stem structures as seeds for spatial patterns, treating the ancient Chinese divination system as a combinatorial geometry engine producing emergent landscapes of meaning.

## What Is the I Ching?

The I Ching (Book of Changes) consists of 64 hexagrams, each composed of six stacked lines (yao) that are either broken (yin, 0) or solid (yang, 1). This is a 6-bit binary system yielding 2^6 = 64 states. Each hexagram has associated imagery, judgments, and changing-line mechanics that transform one hexagram into another.

As a field generator:
- Each hexagram is a 2×3 binary matrix (or 6×1 linear array)
- Trigrams (3-line subsets) map to natural elements: Heaven, Earth, Thunder, Water, Mountain, Wind, Fire, Lake
- Line positions correspond to temporal/spatial stages: beginning, development, climax, transition, decline, return
- Changing lines introduce dynamics: solid becomes broken, broken becomes solid

## Project Structure

```
shaders/              # GLSL fragment shaders — hexagram-driven field generation
hexagram_sets/        # All 64 hexagrams as parameter arrays, with King Wen sequence
binary_fields/        # 6-bit space mappings, bitwise operations as spatial transforms
trigram_elements/     # Elemental associations: Water, Fire, Wood, Metal, Earth
line_dynamics/        # Changing lines, temporal evolution, transformation rules
king_wen_sequence/    — Arrangement as 8×8 matrix, spatial adjacency patterns
yarrow_stems/         — Statistical weighting from yarrow stalk method
meaning_maps/         — Judgment text as texture source, character-field rendering
```

## Running

Shaders are written for WebGL/Three.js. Each shader is self-contained — drop it into any fragment shader environment (Shadertoy, The Book of Shaders editor, local Three.js setup). Hexagram data is stored as integer arrays or texture lookups.

## Current Field Types

- [ ] _binary_mandala — 6-bit radial mapping, trigram sectors, yin-yang polarity
- [ ] _changing_lines_flow — lines that flip based on neighbor states, cellular automaton
- [ ] _trigram_elemental — Water flows downward, Fire rises, Mountain blocks, Wind permeates
- [ ] _king_wen_landscape — hexagram sequence as terrain elevation, mutual relationships as valleys
- [ ] _temporal_hexagram — time-based hexagram casting, clock-driven line evolution
- [ ] _nuclear_hexagram — inner trigram extraction, core essence visualization
- [ ] _reverse_hexagram — upside-down inversion, perspective shift
- [ ] _combined_hexagram — primary + transformed, before/after state landscape

## Trigram-to-Element Mapping

| Trigram | Lines | Nature | Direction | Season | Attribute |
|---------|-------|--------|-----------|--------|-----------|
| ☰ Qian | 3 yang | Heaven | South | Summer | Creative |
| ☷ Kun | 3 yin | Earth | North | Winter | Receptive |
| ☳ Zhen | 1 yang base | Thunder | Northeast | Spring | Arousing |
| ☵ Kan | 1 yang middle | Water | West | Autumn | Abysmal |
| ☶ Gen | 1 yang top | Mountain | Northwest | — | Keeping Still |
| ☴ Xun | 1 yin base | Wind | Southwest | — | Gentle |
| ☲ Li | 1 yin middle | Fire | East | — | Radiance |
| ☱ Dui | 1 yin top | Lake | Southeast | — | Joyful |

## Spatial Patterns

- [ ] _bagua_compass — 8 trigrams on 8-point compass, seasonal rotation
- [ ] _lo_shu_square — 3×3 magic square integration, trigram-element alignment
- [ ] _hexagram_weave — 64 hexagrams as 8×8 texture, interlocking patterns
- [ ] _line_resonance — horizontal bands representing yao positions, interference
- [ ] _changing_line_pulse — time-varying flips as wave propagation through field

## References

- Wilhelm, R. & Baynes, C. F. (1967). *The I Ching or Book of Changes*. Princeton.
- Shaughnessy, E. L. (1997). *I Ching: The Classic of Changes*. Ballantine.
- Needham, J. (1956). *Science and Civilisation in China*, Vol. 2. Cambridge.
- Leibniz, G. W. (1703). *Explication de l'Arithmétique Binaire* — connection to hexagrams
- Schöter, J. (2004). *The I Ching and the Binary System*. — computational analysis
- Huang, A. (2001). *The Numerology of the I Ching*. Inner Traditions.

---

*64 states, 6 lines, 2 conditions. The simplest computer ever built — and it was built three thousand years ago.*