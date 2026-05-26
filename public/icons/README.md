# PWA Icons

You need 3 PNG files here:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512, with safe-zone padding for Android adaptive icons)

## Easiest way to generate them

1. Go to https://realfavicongenerator.net/
2. Upload a 512×512 PNG of your logo
3. Configure → Download the package
4. Copy `android-chrome-192x192.png` → rename to `icon-192.png`
5. Copy `android-chrome-512x512.png` → rename to `icon-512.png`
6. For maskable: same 512×512 image but with ~15% padding on all sides (use https://maskable.app/editor to preview)

## Quick placeholder (Linux/macOS with ImageMagick)

```bash
convert -size 512x512 xc:'#00D09C' -gravity center \
  -pointsize 200 -fill white -annotate +0+0 'G' \
  public/icons/icon-512.png
convert public/icons/icon-512.png -resize 192x192 public/icons/icon-192.png
cp public/icons/icon-512.png public/icons/icon-512-maskable.png
```
