
# Plan: Scroll-inspirerat flöde med kurvad skarv och Paus-tillstånd

## Sammanfattning

Byta från diskreta "slide-byten" till ett scroll-liknande flöde inspirerat av Shelly.com, där sektioner glider mjukt in/ut med en visuell "skarv" som böjer sig (konvex → konkav). Dessutom introduceras ett nytt **Paus**-tillstånd för block som möjliggör sekventiella reveals inom ett stopp.

## Koncept: Tre block-lägen

| Läge | Beskrivning | Effekt |
|------|-------------|--------|
| **Stopp** | Huvudnavigationspunkt | Skapar en ny "sektion" med full skärm, bakgrund, kurvad skarv |
| **Paus** | Delvis stopp | Stannar vid detta block inom nuvarande sektion, nästa tryck visar nästa block |
| **Inget** | Standard | Blocket visas direkt tillsammans med föregående |

## Visuell illustration: Kurvad skarv

```text
Nuvarande stopp (scrollar ut uppåt)
┌─────────────────────────────────────────────┐
│                                             │
│          [Innehåll 1]                       │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
      ╲                                    ╱
        ╲      Konvex nederkant          ╱
          ╲                            ╱
           ────────────────────────────
          ╱                            ╲
        ╱      Konkav överkant           ╲
      ╱                                    ╲
┌─────────────────────────────────────────────┐
│                                             │
│          [Innehåll 2]                       │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
Nästa stopp (scrollar in underifrån)
```

Under transition rör sig båda sektioner:
- Utgående sektion: translateY mot negativ (uppåt), med konvex clip-path i nederkant
- Inkommande sektion: translateY från positiv till 0 (uppåt), med konkav clip-path i överkant

## Teknisk lösning

### 1. Databasändring: Nytt fält `navigation_mode`

Lägg till ett fält på `blocks`-tabellen:
```sql
ALTER TABLE public.blocks 
ADD COLUMN navigation_mode TEXT NOT NULL DEFAULT 'none' 
CHECK (navigation_mode IN ('stop', 'pause', 'none'));
```

Migration för befintliga waypoints:
```sql
UPDATE public.blocks 
SET navigation_mode = 'stop' 
WHERE is_waypoint = true;
```

Behåll `is_waypoint` för bakåtkompatibilitet eller migrera helt till `navigation_mode`.

### 2. Uppdatera Block-typer

**src/types/block.ts:**
```typescript
export type NavigationMode = 'stop' | 'pause' | 'none';

export interface Block {
  // ... existing fields
  navigation_mode: NavigationMode;
}
```

### 3. BlockSettings - Nytt UI för navigationsläge

**src/components/editor/BlockSettings.tsx:**

Ersätt binära "Stopp"-switchen med en Select:
```typescript
<Select
  value={block.navigation_mode || 'none'}
  onValueChange={(value) => onUpdate({ 
    navigation_mode: value,
    is_waypoint: value === 'stop' // backwards compat
  })}
>
  <SelectItem value="none">Inget</SelectItem>
  <SelectItem value="pause">Paus (delvis stopp)</SelectItem>
  <SelectItem value="stop">Stopp (full sektion)</SelectItem>
</Select>
```

### 4. Presentation: Scroll-liknande övergång med clip-path

**Ny arkitektur i Present.tsx:**

Istället för att bara byta ut innehåll, rendera **två sektioner** samtidigt under övergång:
- Aktuell sektion (som glider ut)
- Nästa sektion (som glider in)

**Nyckeldelar:**

```typescript
// State för transition
const [isTransitioning, setIsTransitioning] = useState(false);
const [transitionProgress, setTransitionProgress] = useState(0); // 0 to 1
const [previousSlideIndex, setPreviousSlideIndex] = useState<number | null>(null);

// Animation med requestAnimationFrame eller CSS transitions
const startTransition = (newIndex: number) => {
  setPreviousSlideIndex(currentWaypointIndex);
  setIsTransitioning(true);
  setCurrentWaypointIndex(newIndex);
  
  // Animera progress 0 → 1 över ~1s
  // Sedan setIsTransitioning(false)
};
```

**CSS för kurvad skarv (clip-path):**

```css
/* Utgående sektion - konvex nederkant */
.section-exit {
  clip-path: ellipse(150% 100% at 50% 0%);
  /* Animeras till: ellipse(150% 50% at 50% 0%) */
}

/* Inkommande sektion - konkav överkant */  
.section-enter {
  clip-path: ellipse(150% 100% at 50% 100%);
  /* Startar med: ellipse(150% 50% at 50% 100%) */
}
```

### 5. CSS-animationer för skarven

**src/index.css:**

```css
/* Wave reveal - utgående (uppåt med konvex nederkant) */
@keyframes wave-exit-up {
  0% {
    transform: translateY(0);
    clip-path: ellipse(150% 100% at 50% 0%);
  }
  100% {
    transform: translateY(-100%);
    clip-path: ellipse(150% 60% at 50% -20%);
  }
}

/* Wave reveal - inkommande (från neder med konkav överkant) */
@keyframes wave-enter-up {
  0% {
    transform: translateY(100%);
    clip-path: ellipse(150% 60% at 50% 120%);
  }
  100% {
    transform: translateY(0);
    clip-path: ellipse(150% 100% at 50% 100%);
  }
}

.animate-wave-exit {
  animation: wave-exit-up 1.2s cubic-bezier(0.76, 0, 0.24, 1) forwards;
}

.animate-wave-enter {
  animation: wave-enter-up 1.2s cubic-bezier(0.76, 0, 0.24, 1) forwards;
}
```

### 6. Paus-logik i presentationen

Paus-block ger ett "steg inom steg":

```typescript
// Gruppera blocks inom varje slide baserat på pauser
type SlideStep = {
  blocks: Block[];
  pauseIndex: number;
};

// Varje Slide har flera steps
type Slide = {
  waypoint: Waypoint;
  steps: SlideStep[];
  background: BackgroundContent;
};

// Navigation hanterar både slides OCH steps
const [currentStep, setCurrentStep] = useState(0);

const goNext = () => {
  if (currentStep < currentSlide.steps.length - 1) {
    // Nästa steg inom samma slide (mjuk block-reveal)
    setCurrentStep(s => s + 1);
  } else {
    // Nästa slide (wave transition)
    setCurrentStep(0);
    setCurrentWaypointIndex(i => i + 1);
  }
};
```

### 7. Standard animation: Glid upp

Säkerställ att alla block utan explicit animation får `slide-up` som standard:

**src/types/block.ts (redan korrekt):**
```typescript
export function getAnimationSettings(block: Block): AnimationSettings {
  return {
    type: 'slide-up', // ← Standard
    delay: 0,
    duration: 500,
    ...settings,
  };
}
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| **Migration (ny)** | Lägg till `navigation_mode` kolumn |
| `src/types/block.ts` | Lägg till `NavigationMode` typ |
| `src/components/editor/BlockSettings.tsx` | Ersätt Stopp-switch med Select (Inget/Paus/Stopp) |
| `src/pages/Present.tsx` | Implementera dual-section rendering, wave clip-path, paus-logik |
| `src/index.css` | Lägg till wave-enter/wave-exit animationer med clip-path |

## Visuellt resultat

1. **Vid navigation mellan Stopp:** Mjuk wave-transition där nuvarande sektion glider upp med konvex kurva i nederkant, medan nästa sektion glider in underifrån med konkav kurva i överkant
2. **Vid navigation till Paus:** Inga slide-byten, bara nästa block(en) animeras in (slide-up)
3. **Block utan navigation_mode:** Visas direkt med sitt föregående stopp/paus

## Progression

```text
Tryck 1: Stopp 1 visas (alla block till första Paus eller nästa Stopp)
Tryck 2: Paus-blocket animeras in
Tryck 3: Wave-transition till Stopp 2
...
```

---

Detta ger en organisk, scroll-liknande upplevelse istället för diskreta slide-byten, med den kurvade skarven som du beskrev från Shelly.com.
