#!/usr/bin/env python3
"""Capturas de Google Play (1080x1920) y gráfico destacado (1024x500) con la paleta del icono: azul marino y oro."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random
R = "store/raw/"; O = "store/"
NAVY1, NAVY2, GOLD, GOLD2, CREAM = (8, 28, 92), (3, 11, 42), (242, 193, 78), (201, 151, 28), (255, 244, 214)
f = lambda n, s: ImageFont.truetype("store/fonts/" + n, s)

def background(w, h, seed):
    im = Image.new("RGB", (w, h))
    px = im.load()
    for y in range(h):
        for x in range(0, w):
            t = min(1, math.hypot(x - w * 0.5, y - h * 0.18) / (h * 0.95))
            px[x, y] = tuple(int(NAVY1[i] * (1 - t) + NAVY2[i] * t) for i in range(3))
    d = ImageDraw.Draw(im, "RGBA")
    # arco dorado como el del icono
    d.ellipse((-w * 0.35, h * 0.08, w * 1.35, h * 1.25), outline=GOLD + (70,), width=6)
    d.ellipse((-w * 0.30, h * 0.12, w * 1.30, h * 1.21), outline=GOLD + (28,), width=2)
    random.seed(seed)
    for _ in range(70):
        x, y, r = random.randint(0, w), random.randint(0, h), random.choice([2, 2, 3, 4])
        d.ellipse((x - r, y - r, x + r, y + r), fill=(CREAM if random.random() < .6 else (120, 190, 255)) + (random.randint(70, 190),))
    for _ in range(6):
        x, y, s = random.randint(40, w - 40), random.randint(40, h - 40), random.randint(8, 16)
        d.polygon([(x, y - s), (x + s * .25, y - s * .25), (x + s, y), (x + s * .25, y + s * .25), (x, y + s), (x - s * .25, y + s * .25), (x - s, y), (x - s * .25, y - s * .25)], fill=GOLD + (200,))
    return im

def rounded(im, r):
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), r, fill=255)
    out = Image.new("RGBA", im.size); out.paste(im, (0, 0), m); return out

def phone(shot, width):
    s = Image.open(shot).convert("RGB")
    h = int(s.size[1] * width / s.size[0]); s = s.resize((width, h), Image.LANCZOS)
    b = 16; fr = Image.new("RGBA", (width + 2 * b, h + 2 * b), (0, 0, 0, 0))
    ImageDraw.Draw(fr).rounded_rectangle((0, 0, fr.size[0] - 1, fr.size[1] - 1), 62, fill=(10, 14, 22, 255), outline=GOLD + (255,), width=4)
    fr.alpha_composite(rounded(s, 46), (b, b))
    return fr

def text_center(d, cx, y, txt, font, fill, maxw):
    words, lines, cur = txt.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if d.textlength(t, font=font) > maxw and cur: lines.append(cur); cur = w_
        else: cur = t
    lines.append(cur)
    for ln in lines:
        d.text((cx - d.textlength(ln, font=font) / 2, y), ln, font=font, fill=fill); y += font.size * 1.02
    return y

SHOTS = [("1-home", "WRITE YOUR FOOTBALL LEGEND", "Player, manager or your own club"),
         ("2-decision", "EVERY DECISION COUNTS", "See your odds before you choose"),
         ("3-squad", "DRAG & DROP YOUR LINE-UP", "Starting XI, bench and squad"),
         ("4-market", "SIGN THE STARS", "Scout, negotiate and build your team"),
         ("5-club", "CREATE YOUR OWN CLUB", "Choose its name, colours and league"),
         ("6-trophies", "LIFT EVERY TROPHY", "Leagues, cups and the Ballon d'Or"),
         ("8-competition", "87 LEAGUES, 211 NATIONS", "From local leagues to the Champions League"),
         ("7-modes", "THREE WAYS TO PLAY", "In English, Spanish, German, Italian and French")]
W, H = 1080, 1920
for i, (n, t1, t2) in enumerate(SHOTS):
    im = background(W, H, i).convert("RGBA"); d = ImageDraw.Draw(im)
    y = text_center(d, W / 2, 64, t1, f("bsd900.ttf", 100), GOLD, W - 110)
    y = text_center(d, W / 2, y + 12, t2, f("arc600.ttf", 38), CREAM, W - 130)
    top = int(y + 40); avail = H - top - 50
    pw = min(720, int((avail - 32) * 1170 / 2532))
    ph = phone(R + n + ".png", pw)
    sh = Image.new("RGBA", ph.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((0, 0, ph.size[0] - 1, ph.size[1] - 1), 62, fill=(0, 0, 0, 150))
    x, yy = (W - ph.size[0]) // 2, top
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)), (x + 8, yy + 22))
    im.alpha_composite(ph, (x, yy))
    im.convert("RGB").save(O + f"screenshot-{i + 1}.png", optimize=True)
# gráfico destacado
FW, FH = 1024, 500
im = background(FW, FH, 99).convert("RGBA"); d = ImageDraw.Draw(im)
ic = Image.open("/tmp/claude-0/-home-claude/a574266b-abfc-5d03-8229-da61267629e1/scratchpad/icon_full.png").convert("RGBA").resize((300, 300), Image.LANCZOS)
im.alpha_composite(ic, (70, 100))
d.text((410, 120), "ROAD", font=f("bsd900.ttf", 120), fill=CREAM)
d.text((410, 228), "TO LEGEND", font=f("bsd900.ttf", 120), fill=GOLD)
d.text((414, 362), "Player · Manager · Your own club", font=f("arc600.ttf", 32), fill=CREAM)
im.convert("RGB").save(O + "feature-graphic.png", optimize=True)
print("ok")
