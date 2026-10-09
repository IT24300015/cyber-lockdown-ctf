#!/usr/bin/env python3
"""
Generates a realistic employee ID badge with:
- Visible employee info (name, ID, dept)
- A HIDDEN username in tiny font at the bottom corner
  (only visible when zoomed in 3x or more)
"""

import os
import struct
import zlib

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

OUTPUT = os.path.expanduser('~/ctf-box/web/static/forensics/badge.jpg')

# Hidden username — only visible when zoomed
HIDDEN_USERNAME = "usr: auditr_2026"


def make_chunk(typ, data):
    return (struct.pack('>I', len(data)) + typ + data +
            struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff))


def build_png_from_rgb(width, height, pixels):
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = make_chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    raw = b''
    stride = width * 3
    for y in range(height):
        raw += b'\x00' + pixels[y*stride:(y+1)*stride]
    idat = make_chunk(b'IDAT', zlib.compress(raw, 9))
    iend = make_chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


def build_badge_with_pil():
    W, H = 600, 380
    img = Image.new('RGB', (W, H), (244, 246, 250))
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        font_big   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        font_norm  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
        font_tiny  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 7)
    except Exception:
        font_big = font_norm = font_label = font_tiny = ImageFont.load_default()

    # Header
    draw.rectangle([0, 0, W, 60], fill=(26, 58, 108))
    draw.text((20, 18), "NOVA TECH SOLUTIONS", fill=(255, 255, 255), font=font_big)
    draw.text((W - 140, 22), "EMPLOYEE ID", fill=(140, 180, 230), font=font_label)

    # Photo box
    draw.rectangle([30, 90, 180, 260], fill=(200, 208, 218))
    draw.rectangle([30, 90, 180, 260], outline=(120, 135, 155), width=2)
    draw.ellipse([85, 120, 125, 160], fill=(140, 155, 175))
    draw.polygon([(70, 230), (95, 170), (115, 170), (140, 230)], fill=(140, 155, 175))
    draw.text((65, 265), "[ PHOTO ON FILE ]", fill=(100, 115, 135), font=font_label)

    # Employee details
    y0 = 95
    lines = [
        ("Employee ID",  "NT-2026-0417"),
        ("Name",         "A. Perera"),
        ("Department",   "Engineering"),
        ("Clearance",    "LEVEL-3"),
        ("Issued",       "2026-01-15"),
        ("Expires",      "2026-12-31"),
    ]
    for i, (k, v) in enumerate(lines):
        y = y0 + i * 26
        draw.text((210, y), k, fill=(90, 100, 120), font=font_label)
        draw.text((320, y), v, fill=(30, 40, 60), font=font_norm)

    # QR pattern (visual only)
    qx, qy, qs = 510, 100, 70
    draw.rectangle([qx, qy, qx+qs, qy+qs], outline=(80, 90, 110))
    for i in range(7):
        for j in range(7):
            if (i + j) % 2 == 0:
                draw.rectangle([qx+5+i*9, qy+5+j*9, qx+5+i*9+8, qy+5+j*9+8], fill=(20, 30, 50))

    # Footer
    draw.rectangle([0, H-36, W, H], fill=(26, 58, 108))
    draw.text((20, H-26), "If found, return to Nova Tech Security", fill=(210, 225, 245), font=font_label)

    # ============ HIDDEN TEXT ============
    # Small hidden username — same color as footer background but slightly lighter
    # Only visible when zoomed in 3x+
    draw.text((W - 130, H - 15), HIDDEN_USERNAME, fill=(50, 90, 150), font=font_tiny)

    return img.tobytes(), W, H


def build_badge_simple():
    W, H = 600, 380
    pixels = bytearray()
    for y in range(H):
        for x in range(W):
            r, g, b = 244, 246, 250
            if y < 60 or y > H - 36:
                r, g, b = 26, 58, 108
            elif 30 <= x <= 180 and 90 <= y <= 260:
                r, g, b = 200, 208, 218
            pixels += bytes([r, g, b])
    return bytes(pixels), W, H


def main():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

    if HAS_PIL:
        print('Using PIL to render badge.')
        pixels, W, H = build_badge_with_pil()
    else:
        print('PIL not available — using fallback.')
        pixels, W, H = build_badge_simple()

    png = build_png_from_rgb(W, H, pixels)

    # Insert only BENIGN metadata (no hint here)
    benign = [
        ('Software',    'Nova Tech ID Card Generator v3.2'),
        ('Author',      'Nova Tech Security Team'),
        ('Description', 'Employee access badge - 2026'),
        ('Copyright',   'Nova Tech Solutions Ltd'),
    ]
    for k, v in reversed(benign):
        payload = k.encode() + b'\x00' + v.encode()
        chunk = make_chunk(b'tEXt', payload)
        png = png[:8] + chunk + png[8:]

    with open(OUTPUT, 'wb') as f:
        f.write(png)

    print(f'Written: {OUTPUT}')
    print(f'Size: {len(png)} bytes')
    print(f'Hidden username: {HIDDEN_USERNAME}')


if __name__ == '__main__':
    main()