export const SYSTEM_PROMPT = `
SYSTEM: ImageMagick-WASM Glitch Alchemist.
OBJECTIVE: Translate user prompts into experimental, high-fidelity CLI flag chains.
STRATEGY: Analyze "Vibe" -> Select Rare Algorithms -> Randomize Values -> Output Flags.
STRICT MODE: No markdown. No explanations. No filenames. Return ONLY the flag string.

/// 1. THE SANDBOX (STRICT CONSTRAINTS) ///
  - MANDATORY START: -channel RGB
  - MANDATORY END: +channel -alpha opaque
  - COLOR SAFETY: Wrap color ops in '-channel RGB ... +channel'.
  - FORBIDDEN: -ordered-dither, -liquid-rescale.
  - MATH: Use '-function', '-evaluate', or '-fx' (for custom math).
    
/// 2. EXPERIMENTAL DIRECTIVES ///
  - VALUE CHAOS: Avoid default numbers (10, 50). Use primes (e.g., "wave 7x33", "roll +13-4").
  - WAVE vs FX: '-wave' is for geometric ripples. '-fx' is for PIXEL MATH.
  - FX RULES: ALWAYS quote -fx arguments (e.g. -fx 'p{i,j-(j%25)*(u>0.5?2:1)}'). Ensure parentheses are balanced.
  - NO QUOTES: Do NOT use quotes or spaces inside arguments. Use commas for lists (e.g., "0,0,0.5,1", not "0 0 0.5 1").
  - MATH MAGIC: Use '-function Sinusoid', '-function Arcsin', and '-evaluate' for non-linear color shifts.
  - ALGO ROTATION:
  * Dither: Switch between [FloydSteinberg, Riemersma].
  * Noise: Switch between [Gaussian, Impulse, Laplacian, Poisson].
  * Morph: Switch between [Octagon, Disk, Diamond, Square] kernels.

/// 3. THE INGREDIENT LIBRARY (SEMANTIC MAPPING) ///

[Structure (Geometry & Shape)]
* Effect "Melt" (Liquid, Dripping, Ooze):
  Code: -morphology Dilate Disk:3 -distort Shepards 0,0,5,5
* Effect "Warp" (Lens Distortion, Bending, Fisheye):
  Code: -distort Barrel 0,0,0.5,1 -wave 3x77 -implode -0.5
* Effect "Rot" (Decay, Erosion, Holes):
  Code: -lat 25x25+10% -spread 4 -morphology Erode Square:1

[Texture (Noise & Grain)]
* Effect "Grit" (Dirty, Sandy, Film Grain):
  Code: +noise Laplacian +noise Poisson -attenuate 0.9
* Effect "Retro" (Low-Res, 8-bit, Console, Pixelated):
  Code: -sample 13% -sample 800% -colors 6 -posterize 5
* Effect "Signal" (Glitch, RGB Split, Chromatic Aberration):
  Code: -channel G -roll +7+0 -channel B -roll -7+0

[Math & Color (Special Functions)]
* Effect "Heatmap" (Thermal, Alien, Psychedelic Rainbow):
  Code: -function Sinusoid 4,-90
* Effect "Deep" (High Contrast, Drama, Shadow):
  Code: -function Arcsin 0.5
* Effect "Crush" (Color Cycling, Weird Inversion):
  Code: -evaluate Sin 2
* Effect "Phase Flux" (Liquid, Chrome, Iridescent):
  Code: -function Sinusoid 2,-120
* Effect "Tint" (Color Overlay, Mood):
  Code: -fill [COLOR] -tint 90%
* Effect "Spectral" (Chromatic Aberration, Color Split):
  Code: -channel R -roll +5+0 -channel G -roll -5+0 +channel
* Effect "Fractal Decay" (Deep Math Glitch):
  Code: -fx '0.5*u+0.5*sin(10*pi*u)'
* Effect "Sanguine Feedback" (Red Analogue, Heat):
  Code: -fill red -tint 90% -roll +10+0 -distort Barrel 0,0,0.1,0.9 -colors 2

/// 4. THE SPELLBOOK (FEW-SHOT TRAINING) ///

// -- CLASS I: UTILITY --
Input: invert the image
Output: -channel RGB -negate +channel -alpha opaque

Input: make it black and white
Output: -channel RGB -colorspace Gray +channel -alpha opaque

// -- CLASS II: TEXTURE --
Input: noisy vhs tape
Output: -channel R -roll +13+0 -channel B -roll -13+0 +channel -channel RGB -attenuate 0.7 +noise Laplacian -colors 16 -dither Riemersma +channel -alpha opaque

Input: 1-bit dithering
Output: -channel RGB -colorspace Gray -contrast-stretch 5% -colors 2 -dither FloydSteinberg +channel -alpha opaque

// -- CLASS III: EXPERIMENTAL RITUALS --

Input: mathematical acid trip
Output: -channel RGB -function Sinusoid 4,-90 -virtual-pixel Tile -distort Barrel 0,0,0.2,1.2 -evaluate Cos 0.5 +channel -alpha opaque

Input: organic mold decay
Output: -channel RGB -morphology Erode Diamond:3 -lat 15x15+5% -spread 3 -fill lime -tint 40% +noise Poisson +channel -alpha opaque

Input: cybernetic glitch structure
Output: -channel RGB -morphology Edge Octagon:1 -negate -morphology Thinning:9 Skeleton -function Arcsin 0.5 -fill '#00ffcc' -tint 90% +channel -alpha opaque

Input: melting radioactive void
Output: -channel RGB -morphology Dilate Disk:7 -wave 7x63 -solarize 47% -distort Polar 0 -virtual-pixel Mirror +channel -alpha opaque

Input: fractal decay
Output: -channel RGB -fx '0.5*u+0.5*sin(10*pi*u)' +channel -alpha opaque
`;

// ─── Preset Categories ──────────────────────────────────────────────────

export const PRIMITIVES: Record<string, string> = {
  'Negate': "-channel RGB -negate +channel -alpha opaque",
  'Grayscale': "-channel RGB -colorspace gray +channel -alpha opaque",
  'Edge': "-channel RGB -edge 3 +channel -alpha opaque",
  'Emboss': "-channel RGB -emboss 2 +channel -alpha opaque",
  'Sharpen': "-channel RGB -adaptive-sharpen 0x3 +channel -alpha opaque",
  'Blur': "-channel RGB -blur 0x5 +channel -alpha opaque",
  'Posterize': "-channel RGB -posterize 4 +channel -alpha opaque",
};

export const READY_EFFECTS: Record<string, string> = {
  'Melt': "-channel RGB -morphology Dilate Octagon:10 -morphology Erode Octagon:2 +channel -alpha opaque",
  'Necrosis': "-channel RGB -colorspace gray -colors 4 -dither FloydSteinberg +channel -alpha opaque",
  'Rot': "-channel RGB -statistic Maximum 20x1 +channel -alpha opaque",
  'Noise': "-channel RGB -fx 'u+(rand()-0.5)' +noise Laplacian -attenuate 0.9 +channel -alpha opaque",
  'Plasma': "-channel RGB -morphology Distance Euclidean:4 -level 0%,90% -auto-level +channel -alpha opaque",
  'Structure': "-channel RGB -morphology Distance Euclidean:4 -auto-level -morphology TopHat Disk:1 -auto-level +channel -alpha opaque",
  'Deepfry': "-chann  el RGB -modulate 150,200,100 -posterize 2 +channel -alpha opaque",
  'Spectral': "-channel RGB -virtual-pixel Mirror -distort Polar 0 +channel -alpha opaque",
  'Azule': "-channel RGB -colorspace Gray -edge 1 -fill '#0033cc' -opaque black +channel -alpha opaque",
  'Flux': "-channel RGB -function Sinusoid 2,-120 +channel -alpha opaque",
};

export const SPELLBOOK: Record<string, string> = {
  'Detriment': "-channel RGB -sample 10% -sample 800% -colors 6 -posterize 5 +noise Laplacian -attenuate 0.8 +channel -alpha opaque",
  'Tear': "-channel RGB -fx 'p{i,j-(j%25)*(u>0.5?2:1)}' +channel -alpha opaque",
  'Shift': "-channel RGB -fx 'j%2==0?u:p{i+10,j}*1.5' +channel -alpha opaque",
  'Grit': "-channel RGB -spread 3 +noise Impulse -morphology Dilate Square:1 -colors 8 -dither FloydSteinberg +channel -sample 25% -sample 400% -alpha opaque -contrast-stretch 1%",
  'Drift': "-channel R -roll +10+0 -channel B -roll -10+0 +channel -channel RGB -lat 20x20+10% -morphology Erode Square:1 -sample 50% -sample 200% +channel -alpha opaque",
  'Interference': "-channel RGB -wave 5x50 -spread 2 -colors 4 -dither Riemersma -contrast-stretch 5% -fill red -tint 40% +channel -sample 200% -sample 50% -alpha opaque",
  'Burn': "-channel RGB -sigmoidal-contrast 10,50% -modulate 150,150 -solarize 60% -colors 16 -dither Riemersma +channel -sample 25% -sample 400% -alpha opaque",
  'Flare': "-channel RGB -sigmoidal-contrast 10,50% -modulate 150,150 -solarize 70% -colors 16 -dither Riemersma +channel -alpha opaque",
  'Smear': "-channel RGB -morphology Dilate Rectangle:20x1 +noise Gaussian -colorspace Gray -sigmoidal-contrast 10,50% -colors 3 -dither Riemersma +channel -sample 1000% -alpha opaque",
  'Mold': "-channel RGB -morphology Edge Octagon:1 -negate -morphology Erode Euclidean:10 -auto-level -threshold 50% -spread 3 +channel -monochrome -alpha opaque",
  'Skeleton': "-channel RGB -morphology Thinning:20 Skeleton -auto-level +channel -alpha opaque",
  'Decay': "-channel RGB -fx '0.5*u+0.5*sin(10*pi*u)' +channel -alpha opaque",
  'Analogue': "-sample 10% -sample 1000% -colors 8 -alpha opaque",
  'Blood': "-channel RGB -fill red -tint 90% -roll +10+0 -distort Barrel 0,0,0.1,0.9 -colors 2 +channel -alpha opaque",
};


// Merged for backward compatibility and validation
export const PRESET_COMMANDS: Record<string, string> = {
  ...PRIMITIVES,
  ...READY_EFFECTS,
  ...SPELLBOOK,
  // Keep lowercased keys for terminal matching
  ...Object.fromEntries(Object.entries(PRIMITIVES).map(([k, v]) => [k.toLowerCase(), v])),
  ...Object.fromEntries(Object.entries(READY_EFFECTS).map(([k, v]) => [k.toLowerCase(), v])),
  ...Object.fromEntries(Object.entries(SPELLBOOK).map(([k, v]) => [k.toLowerCase(), v])),
};

// ─── Allowed Flags ──────────────────────────────────────────────────────
// Every flag here is confirmed to work in IM6 WASM (magica).
// The validator strips anything NOT on this list.
export const ALLOWED_FLAGS = [
  // Randomization & Geometry
  '-seed', '-spread', '-implode', '-swirl',
  '-resize', '-crop', '-trim',
  '+repage', '-rotate', '-flip', '-flop',
  '-filter',

  // Color & Tone
  '-colorspace', '-channel', '+channel',
  '-negate', '-auto-level', '-auto-gamma',
  '-normalize', '-contrast-stretch',
  '-brightness-contrast', '-gamma', '-level',
  '-threshold', '-black-threshold', '-white-threshold',
  '-modulate', '-fill', '-tint', '-sigmoidal-contrast',
  '-monochrome', '-colors', '-dither', '-opaque',

  // Evaluate & Function
  '-evaluate', '-function',

  // Effects & Filters
  '-charcoal', '-solarize', '-blue-shift',
  '-sepia-tone', '-posterize', '-edge', '-emboss',
  '-blur', '-gaussian-blur', '-motion-blur',
  '-adaptive-blur', '-adaptive-sharpen', '-sharpen',
  '-despeckle', '-median', '-paint', '-sketch', '-vignette',
  '-wave', '-lat', '-statistic', '-fx',

  // Noise
  '+noise',

  // Morphology & Canny
  '-morphology', '-canny',

  // Layer operations
  '-clone', '+clone', '-delete', '-layers',
  '-compose', '-composite',
  '-roll',

  // Distortion
  '-virtual-pixel', '-distort',

  // Misc
  '-define', '-strip', '-sample', '-attenuate', '-alpha',
] as const;

// ─── Argument Validation Maps ───────────────────────────────────────────
// Used by the validator to check arguments for specific flags.
export const VALID_MORPHOLOGY_METHODS = new Set([
  'Erode', 'Dilate', 'Open', 'Close', 'Smooth',
  'EdgeIn', 'EdgeOut', 'TopHat', 'BottomHat',
  'HitAndMiss', 'Thinning', 'Thicken',
  'Convolve', 'Correlate', 'Distance',
]);

export const VALID_MORPHOLOGY_KERNELS = new Set([
  // Shaped kernels (use with :size, e.g. Diamond:3)
  'Diamond', 'Square', 'Octagon', 'Disk', 'Plus', 'Cross', 'Ring', 'Rectangle',
  // Built-in hit-and-miss / special kernels
  'ConvexHull', 'Skeleton', 'Edges', 'Corners',
  'Diagonals', 'LineEnds', 'LineJunctions', 'Ridges',
  'ThinSE', 'Peaks',
  // Convolution kernels
  'Unity', 'Gaussian', 'DoG', 'LoG', 'Blur', 'Comet', 'Binomial',
  // Distance kernels
  'Chebyshev', 'Manhattan', 'Euclidean',
]);

export const VALID_EVALUATE_FUNCTIONS = new Set([
  'Add', 'Subtract', 'Multiply', 'Divide',
  'Sin', 'Cos', 'Pow', 'Log', 'Exp',
  'And', 'Or', 'Xor', 'Min', 'Max',
  'Set', 'Abs', 'Mean', 'Median',
  'GaussianNoise', 'InverseLog',
  'Arcsin', 'Arccos', 'Arctan',
]);

export const VALID_COLORSPACES = new Set([
  'Gray', 'sRGB', 'RGB', 'LAB', 'HSL', 'HSB',
  'CMYK', 'CMYKA', 'XYZ', 'YCbCr', 'YIQ', 'YUV',
  'Transparent', 'OHTA', 'Rec601Luma', 'Rec709Luma',
]);

export const VALID_COMPOSE_METHODS = new Set([
  'Screen', 'Multiply', 'Overlay',
  'Darken', 'Lighten', 'Difference', 'Exclusion',
  'Add', 'Subtract', 'HardLight', 'SoftLight',
  'ColorDodge', 'ColorBurn', 'LinearDodge', 'LinearBurn',
  'Over', 'In', 'Out', 'Atop', 'Xor',
  'Plus', 'Minus', 'Bumpmap', 'Dissolve',
]);

export const VALID_VIRTUAL_PIXEL = new Set([
  'Tile', 'Edge', 'Mirror', 'Black', 'White',
  'Background', 'Transparent', 'Dither',
  'Random', 'CheckerTile', 'HorizontalTile', 'VerticalTile',
]);

export const VALID_DISTORT_METHODS = new Set([
  'ARC', 'SRT', 'Barrel', 'BarrelInverse',
  'Perspective', 'BilinearForward', 'BilinearReverse',
  'Polar', 'DePolar', 'Shepards', 'Affine',
  'AffineProjection', 'ScaleRotateTranslate',
]);

export const VALID_NOISE_TYPES = new Set([
  'Gaussian', 'Impulse', 'Laplacian',
  'Multiplicative', 'Poisson', 'Random', 'Uniform',
]);

export const VALID_CHANNELS = new Set([
  'Red', 'Green', 'Blue', 'Alpha',
  'Cyan', 'Magenta', 'Yellow', 'Black',
  'Opacity', 'Index', 'RGB', 'RGBA',
  'CMYK', 'CMYKA', 'All',
  // Short codes
  'R', 'G', 'B', 'A',
  'C', 'M', 'Y', 'K',
]);

export const VALID_FUNCTION_METHODS = new Set([
  'Sinusoid', 'Arcsin', 'Arctan', 'Polynomial',
]);

export const SAFETY_SETTINGS = {
  maxTokens: 30, // Keep responses extremely short for speed
  temperature: 0.9, // High creativity for variety
  maxOperations: 3 // Strict limit preventing slow renders
};
