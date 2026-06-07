# I Ching Binary Mathematics

> "When I examine the figures of Fu Xi more carefully I find that they represent binary arithmetic, which I invented many years ago."  
> — Gottfried Wilhelm Leibniz, letter to Father Joachim Bouvet, 1703

---

## 1. The Hexagram as a 6-Bit Integer

A hexagram (卦, *guà*) is composed of six horizontal lines called *yao* (爻), stacked from bottom to top. Each line is binary:

| Line type | Symbol | Value |
|-----------|--------|-------|
| Yang (solid) | ——— | 1 |
| Yin (broken) | — — | 0 |

Reading from **bottom (bit 0) to top (bit 5)**, a hexagram maps directly to a 6-bit integer:

```
Line 6 (top)   → bit 5 (MSB of 6-bit field)
Line 5         → bit 4
Line 4         → bit 3
Line 3         → bit 2
Line 2         → bit 1
Line 1 (bottom)→ bit 0 (LSB)
```

### Example: Hexagram 1 — Qian (Heaven, 乾)
All six lines are yang:
```
─── ─── ─── ─── ─── ───    bits: 1 1 1 1 1 1  = 63 decimal
```

### Example: Hexagram 63 — Ji Ji (After Completion, 既濟)
Alternating water/fire:
```
─── — — ─── — — ───    bits: 1 0 1 0 1 0  = 21... wait
```
Actually Ji Ji is Water over Fire = Kan (010) upper, Li (101) lower:
```
binary = (010 << 3) | 101 = 010101 = 21
bits: [1,0,1,0,1,0] from LSB = line1=1(yang), line2=0(yin), line3=1, line4=0, line5=1, line6=0
```

This perfect alternation — water and fire in equilibrium — has the binary palindrome-like pattern 010101₂ = 21.

---

## 2. The Eight Trigrams (八卦, *Bāguà*)

Three consecutive lines form a **trigram** (卦, *guà*). There are 2³ = 8 possible trigrams, each associated with a natural element and force:

| Trigram | Binary | Decimal | Name (EN) | Chinese | Element | Direction (Later Heaven) |
|---------|--------|---------|-----------|---------|---------|--------------------------|
| ☰ | 111 | 7 | Heaven | 乾 Qián | Metal/Sky | Northwest |
| ☷ | 000 | 0 | Earth | 坤 Kūn | Soil | Southwest |
| ☳ | 001 | 1 | Thunder | 震 Zhèn | Wood | East |
| ☵ | 010 | 2 | Water | 坎 Kǎn | Water | North |
| ☶ | 100 | 4 | Mountain | 艮 Gèn | Earth | Northeast |
| ☴ | 110 | 6 | Wind | 巽 Xùn | Wood | Southeast |
| ☲ | 101 | 5 | Fire | 離 Lí | Fire | South |
| ☱ | 011 | 3 | Lake | 兌 Duì | Metal | West |

**Encoding convention**: bit 0 = bottom line, bit 2 = top line. Heaven (111₂ = 7) is all yang; Earth (000₂ = 0) is all yin.

### Trigram Extraction from a Hexagram

Given a hexagram binary value `n` (6-bit integer):

```
lower_trigram = n & 0b000111  =  n & 7   (bits 0-2, lines 1-3)
upper_trigram = (n >> 3) & 7             (bits 3-5, lines 4-6)
```

In GLSL:
```glsl
float lowerTri = mod(hexVal, 8.0);
float upperTri = floor(hexVal / 8.0);
```

---

## 3. The Nuclear Hexagram (互卦, *Hù Guà*)

The **nuclear hexagram** is hidden within the primary hexagram, formed by the inner four lines:

- **Lower nuclear trigram**: Lines 2, 3, 4 (bits 1, 2, 3)
- **Upper nuclear trigram**: Lines 3, 4, 5 (bits 2, 3, 4)

Formula:
```
lower_nuclear = (n >> 1) & 7   (bits 1-3)
upper_nuclear = (n >> 2) & 7   (bits 2-4)
nuclear_binary = lower_nuclear | (upper_nuclear << 3)
```

The nuclear hexagram reveals the **seed within the situation** — the hidden dynamic force operating beneath the visible structure.

### Notable Nuclear Pairs

| Hexagram | Binary | Nuclear | Name |
|----------|--------|---------|------|
| Hex 1 (Qian, 63) | 111111 | 63 | Heaven contains Heaven as nuclear |
| Hex 29 (Kan, 18) | 010010 | 33 | Water's nuclear is Mountain-Thunder (27, Yi) |
| Hex 30 (Li, 45) | 101101 | 30 | Fire's nuclear is Lake-Wind (28, Da Guo) |
| Hex 27 (Yi, 33) | 100001 | 0 | Nourishment's nuclear is Earth (Kun) |
| Hex 28 (Da Guo, 30) | 011110 | 63 | Great Excess nuclear is Heaven (Qian) |

### Why Lines 1 and 6 Are Excluded

The outermost lines (1 and 6) represent the outermost limits of a situation — entry and exit. The nuclear draws from the **active middle**, where the situation is most dynamic. This is a profound structural insight about where meaning concentrates.

---

## 4. The Reverse Hexagram (覆卦, *Fù Guà*)

Rotating a hexagram 180° (reading it upside down) produces its **reverse**. In binary terms, this is a 6-bit reversal:

```
reverse(b₅b₄b₃b₂b₁b₀) = b₀b₁b₂b₃b₄b₅
```

In GLSL:
```glsl
float reverse6bit(float n) {
    float r = 0.0;
    for (int i = 0; i < 6; i++) {
        float b = mod(floor(n / pow(2.0, float(i))), 2.0);
        r += b * pow(2.0, float(5 - i));
    }
    return r;
}
```

The King Wen sequence is structured so that **most consecutive pairs** are reverses of each other. Of the 64 hexagrams, 56 are arranged as 28 reverse pairs. The remaining 8 are **self-reversing** (palindromic in binary): hexagrams 1, 2, 27, 28, 29, 30, 61, 62.

| Self-reversing hexagram | Binary | Palindrome check |
|------------------------|--------|-----------------|
| Hex 1 (Qian) | 111111 | ✓ All ones |
| Hex 2 (Kun) | 000000 | ✓ All zeros |
| Hex 29 (Kan) | 010010 | ✓ Same reversed |
| Hex 30 (Li) | 101101 | ✓ Same reversed |
| Hex 27 (Yi) | 100001 | ✓ Same reversed |
| Hex 28 (Da Guo) | 011110 | ✓ Same reversed |
| Hex 61 (Zhong Fu) | 110011 | ✓ Same reversed |
| Hex 62 (Xiao Guo) | 001100 | ✓ Same reversed |

For these 8, the King Wen sequence pairs them with their **complement** (all bits flipped) instead.

---

## 5. The Complement Hexagram

The **complement** flips every line (all yang becomes yin, all yin becomes yang):

```
complement(n) = n XOR 63  =  n XOR 0b111111  =  63 - n
```

This is equivalent to the bitwise NOT for a 6-bit field. Every hexagram has a unique complement. The complement represents the **polar opposite** — if the primary is summer, the complement is winter; if the primary is Heaven, the complement is Earth.

---

## 6. The King Wen Sequence

The **King Wen sequence** (文王序, *Wén Wáng Xù*) is the traditional ordering of the 64 hexagrams used in the received text of the *I Ching* (*Yì Jīng*), attributed to King Wen of Zhou (~1100 BCE). It differs from the **Fu Xi sequence** (伏羲序), which is a straightforward binary count (0 to 63 in the binary gray code).

### King Wen Matrix (8×8, binary values)

```
Row  0: 63  0  17  34  23  58   2  16
Row  1: 55 59   7  56  61  47   4   8
Row  2: 25 38   3  48  41  37  32   1
Row  3: 57 39  33  30  18  45  28  14
Row  4: 60 15  40   5  53  43  20  10
Row  5: 35 49  31  62  24   6  26  22
Row  6: 29 46   9  36  52  11  13  44
Row  7: 54 27  50  19  51  12  21  42
```

Each adjacent pair (columns 0-1, 2-3, 4-5, 6-7) is a reverse pair or complement pair.

### Yang Count (Elevation) Distribution

A hexagram's **yang count** (popcount of its 6-bit value) maps to its symbolic strength:
- Yang count 6: Maximum yang (Hex 1, Qian/Heaven)
- Yang count 0: Maximum yin (Hex 2, Kun/Earth)
- Yang count 3: Balanced (maximum entropy, e.g., Hex 63 Ji Ji, Hex 64 Wei Ji)

This is used in `_king_wen_landscape.frag` to map hexagrams to terrain elevation.

---

## 7. Yarrow Stem Probability Mathematics

The traditional **yarrow stem method** (*shīcǎo shì*, 蓍草式) uses 49 stalks, divided three times per line. The resulting remainders determine the line value:

| Line value | Name | Probability | Notes |
|------------|------|-------------|-------|
| 6 | Old Yin (太陰) | 1/16 = 6.25% | Moving, changes to yang |
| 7 | Young Yang (少陽) | 5/16 = 31.25% | Stable yang |
| 8 | Young Yin (少陰) | 7/16 = 43.75% | Stable yin (most common) |
| 9 | Old Yang (太陽) | 3/16 = 18.75% | Moving, changes to yin |

Total = 16/16 = 1.0 ✓

The derivation: in each of 3 divisions, the counter puts stalks in groups of 4, with remainders of 1, 2, 3, or 4 (where 4 ≡ 0). The three remainder values sum to either 4, 8, or 12, mapping to stalks of 44, 40, or 36, which corresponds to coins of value 3+3+3=9 (old yang), 2+2+2=6 (old yin), or mixed.

### Cumulative Distribution for GLSL

```glsl
float castLine(float seed) {
    float r = hash(seed); // uniform [0, 1)
    if (r < 1.0/16.0)  return 6.0;  // old yin   (rarest, 6.25%)
    if (r < 6.0/16.0)  return 7.0;  // young yang (31.25%)
    if (r < 13.0/16.0) return 8.0;  // young yin  (43.75%, most common)
    return 9.0;                       // old yang   (18.75%)
}
```

The **three-coin method** gives different probabilities: p(9)=1/8, p(6)=1/8, p(7)=p(8)=3/8. The coin method overweights moving lines and underweights stable yin, producing a more volatile oracle. The yarrow method's asymmetry (more stable yin than stable yang) encodes the receptive bias of existence.

---

## 8. Leibniz, Binary, and the I Ching

In 1701, the Jesuit missionary Father Joachim Bouvet sent Leibniz a chart of the Fu Xi arrangement of the 64 hexagrams. Leibniz, who had independently invented binary arithmetic in 1679, immediately recognized the correspondence. He wrote:

> "The figures of the Chinese sage [Fu Xi] are perhaps the most ancient monument of science in the world. They represent binary arithmetic."

Leibniz saw in the hexagrams a philosophical proof that all things could be derived from 0 and 1 — the void (Earth, 000000) and the full (Heaven, 111111) — from which all 64 states of being emerge.

### Structural Correspondences

| I Ching concept | Binary mathematics |
|----------------|-------------------|
| 2 line types (yin/yang) | 2 digits (0/1) |
| 3-line trigram | 3-bit integer, 8 values |
| 6-line hexagram | 6-bit integer, 64 values |
| Nuclear hexagram | Bit shift and masking |
| Reverse hexagram | 6-bit reversal |
| Complement | Bitwise NOT (XOR 63) |
| Changing lines | XOR with change mask |
| 64 hexagrams | 2⁶ = 64 states |

The I Ching is, in modern terms, a **64-state finite state machine** whose transition function is determined by the oracle (yarrow stalks or coins), and whose semantics are encoded in three thousand years of commentary.

---

## 9. The 64×64 Transformation Matrix

Every hexagram can transition to every other hexagram by flipping some subset of its 6 bits. The full transformation space is a 6-dimensional hypercube (the **Boolean lattice** B₆). 

Key facts:
- Each hexagram has exactly 6 **single-line neighbors** (Hamming distance 1)
- Each hexagram has C(6,2)=15 two-line neighbors (distance 2)
- The maximum Hamming distance between two hexagrams is 6 (complement)
- The average distance between two random hexagrams is 3.0

In GLSL, the full change from hexagram A to hexagram B:
```glsl
float changeMask = mod(hexA + hexB, 64.0); // approximate XOR
// True XOR is not directly available but can be computed bit by bit
```

The **nuclear hexagram** always occupies a specific region of this space: for any hexagram `n`, its nuclear `nuc(n)` is always at Hamming distance ≤ 4 from `n` (since lines 1 and 6 are replaced by lines 2 and 5 respectively).

---

## References

- Wilhelm, Richard & Baynes, Cary F. (1950). *The I Ching or Book of Changes*. Princeton University Press.
- Needham, Joseph (1956). *Science and Civilisation in China*, Vol. 2. Cambridge University Press.
- Leibniz, G.W. (1703). *Explication de l'Arithmétique Binaire*. Histoire de l'Académie Royale des Sciences.
- Shaughnessy, Edward (1993). *I Ching: The Classic of Changes*. Ballantine Books.
- Smith, Richard J. (2012). *The I Ching: A Biography*. Princeton University Press.
- Ryan, James A. (1996). "Leibniz' Binary System and Shao Yong's 'Yijing.'" *Philosophy East and West* 46(1).
