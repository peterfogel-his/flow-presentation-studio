
# Plan: Fixa presentation - Ken Burns, bakgrunder, bildlayouter och övergångar

## Sammanfattning av problemen

Efter analys av koden och databasen har jag identifierat följande brister:

1. **Ken Burns fungerar inte** - Koden faller tillbaka på `animate-fade-scale-in` istället för den faktiska Ken Burns-animationen
2. **Bakgrundsbilder och gradients visas inte** - Logiken finns men kan ha renderingsproblem
3. **Bildlayouter (kant-till-kant) implementeras inte** - `edge-left` och `edge-right` hanteras inte i renderingskoden
4. **Ingen rörelse mellan stopp** - Slides byter innehåll utan visuell övergång

---

## Lösningar

### 1. Ken Burns-effekt för bilder

**Problem**: `getAnimationClass()` returnerar `animate-fade-scale-in` för Ken Burns istället för den korrekta klassen.

**Lösning**:
- Ändra så att Ken Burns returnerar `animate-ken-burns` för bildblock
- Ken Burns ska endast appliceras på bilder (inte text/rubriker)
- Justera CSS så att Ken Burns har längre duration (20s redan i CSS)

```text
Ken Burns-flöde:
┌─────────────────┐
│  Bild laddas    │
├─────────────────┤
│  Scale 1.0      │ ← Start
│       ↓         │
│  Scale 1.1      │ ← Långsam zoom
│  + translate    │
└─────────────────┘
```

### 2. Bakgrunder (gradient och bild)

**Problem**: Bakgrundsblock med `type: 'gradient'` eller `type: 'image'` renderas inte korrekt.

**Nuvarande data i databasen**: Alla bakgrundsblock har `type: 'color'`. Men editorn tillåter gradient/bild-val.

**Lösning i SlideBackground**:
- Säkerställ att `background.type === 'gradient'` applicerar CSS korrekt
- För bilder, använd `<img>` eller `background-image` med cover
- Lägg till fallback för tom value

### 3. Bildlayouter (kant-till-kant)

**Problem**: `layout.layout` med värden `edge-left`/`edge-right` hanteras inte i renderingen.

**Lösning**:
- Bilder med `edge-left` ska sträcka sig från vänster kant till mitten (50% bredd, absolut positionerad)
- Bilder med `edge-right` ska sträcka sig från höger kant till mitten
- `full-width` ska täcka hela bredden utan marginaler
- Dessa bilder ska renderas separat från det centrerade innehållet

```text
┌─────────────────────────────────────────────┐
│  edge-left     │       Innehåll       │     │
│  ████████████  │  (centrerat text)    │     │
│  ████████████  │                      │     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│     │       Innehåll       │   edge-right   │
│     │  (centrerat text)    │  ████████████  │
│     │                      │  ████████████  │
└─────────────────────────────────────────────┘
```

### 4. Övergångar mellan stopp (slides)

**Problem**: Inget visuellt förlopp när man navigerar. Innehållet poppar bara in.

**Lösning - Slide Transition**:
- Lägg till en wrapper-komponent som animerar hela slide-innehållet
- Använd CSS transitions eller framer-motion-liknande logik
- Alternativ för övergångstyp: fade, slide horisontellt, slide vertikalt

**Föreslagen implementation**:
- Använd `key={currentWaypointIndex}` för att trigga re-mount och animation
- Varje ny slide animeras in med slide-up + fade
- Bakgrunden crossfadar mjukt (already has `transition-colors duration-500`)

```text
Navigationsflöde:
┌──────────────────┐    Klick/Pil    ┌──────────────────┐
│   Slide 1        │ ───────────────▶│   Slide 2        │
│   opacity: 1     │                 │   opacity: 0→1   │
│   translateY: 0  │  Fade + Slide   │   translateY:    │
│                  │                 │   30px → 0       │
└──────────────────┘                 └──────────────────┘
```

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/pages/Present.tsx` | Fixa Ken Burns, bildlayouter, slide-övergångar |
| `src/index.css` | Eventuella nya animations-keyframes för slide transitions |

---

## Tekniska detaljer

### Present.tsx - Huvudändringar

**1. PresentBlock - Ken Burns**
```typescript
case 'ken-burns':
  // Endast för bilder, annars fallback
  return block.type === 'image' ? 'animate-ken-burns' : 'animate-fade-scale-in';
```

**2. BlockContent - Bildlayouter**
Flytta bilder med `edge-left`/`edge-right`/`full-width` utanför den centrerade containern och rendera dem som absolut positionerade element.

**3. Slide-övergång**
Wrappa slide-innehållet i en div med animation som triggas vid key-change:
```typescript
<div 
  key={currentSlide.waypoint.blockId} 
  className="animate-slide-in-up"
>
  {/* slide content */}
</div>
```

**4. SlideBackground - Säkerställ rendering**
- Gradient: `style={{ background: value }}`
- Bild: `style={{ backgroundImage: url(...), backgroundSize: 'cover' }}`
- Lägg till Ken Burns på bakgrundsbilder om önskat

### CSS - Nya/justerade animationer

Längre duration för slide-övergångar (elegant känsla enligt design-specs):
```css
@keyframes slide-in-up-slow {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-up-slow {
  animation: slide-in-up-slow 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

---

## Diskussionspunkt: Förlopp och rörelser

Du nämnde "förlopp apple" - vill du ha en specifik typ av övergång?

**Alternativ:**
1. **Fade + Slide upp** (nuvarande plan) - Nytt innehåll glider upp och tonar in
2. **Horisontell slide** - Som ett traditionellt slidedeck (vänster/höger)
3. **Crossfade** - Rent tona mellan slides
4. **Parallax/Depth** - Olika lager rör sig olika snabbt (kopplat till z-index)

Jag rekommenderar att börja med **Fade + Slide upp** med 1.2s duration som standard, sedan kan vi finjustera eller lägga till parallax-effekter.
