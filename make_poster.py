from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1350
out = Image.new("RGBA", (W, H), (0, 0, 0, 255))
draw = ImageDraw.Draw(out)

# --- Background gradient (dark navy → deep blue) ---
for y in range(H):
    t = y / H
    r = int(8 + t * 10)
    g = int(18 + t * 28)
    b = int(48 + t * 55)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# --- Decorative circles ---
circle_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(circle_layer)
cd.ellipse([-120, -220, 680, 580], fill=(30, 80, 180, 28))
cd.ellipse([-200, 820, 480, 1520], fill=(20, 60, 150, 22))
cd.ellipse([780, 80, 1220, 520], fill=(50, 110, 210, 18))
out = Image.alpha_composite(out.convert("RGBA"), circle_layer)
draw = ImageDraw.Draw(out)

# --- Fonts ---
DJ  = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
DJR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FR  = "/usr/share/fonts/opentype/freefont/FreeSansBold.otf"

def fnt(path, size):
    try: return ImageFont.truetype(path, size)
    except: return ImageFont.load_default()

f_logo   = fnt(FR,  96)
f_brand  = fnt(FR,  56)
f_title1 = fnt(FR,  88)
f_title2 = fnt(FR,  82)
f_badge  = fnt(DJ,  30)
f_prize  = fnt(FR,  48)
f_med    = fnt(DJ,  34)
f_small  = fnt(DJR, 28)
f_tag    = fnt(DJ,  30)
f_tiny   = fnt(DJR, 23)
f_step   = fnt(DJR, 29)

def ctext(y, text, font, color):
    bb = draw.textbbox((0, 0), text, font=font)
    x = (W - (bb[2]-bb[0])) // 2
    draw.text((x, y), text, font=font, fill=color)
    return bb[3] - bb[1]

def rrect(xy, r, fill, outline=None, ow=2):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=ow)

# ── LOGO ────────────────────────────────────────────────
logo_path = "/home/hamid/Documents/VektorIn/frontend/public/logo.png"
y = 55
try:
    logo = Image.open(logo_path).convert("RGBA")
    lsz = 108
    logo = logo.resize((lsz, lsz), Image.LANCZOS)
    out.paste(logo, ((W-lsz)//2, y), logo)
    y += lsz + 14
    draw = ImageDraw.Draw(out)
except:
    pass

# ── BRAND NAME ──────────────────────────────────────────
h = ctext(y, "HASH", f_brand, (255, 255, 255))
y += h + 10
draw.line([(W//2-100, y), (W//2+100, y)], fill=(70, 130, 220, 180), width=2)
y += 18

# ── BADGE ───────────────────────────────────────────────
badge = "ILK FOTO MUSABIQESI"
bb = draw.textbbox((0,0), badge, font=f_badge)
bw = bb[2]-bb[0]+52; bh = bb[3]-bb[1]+22
bx = (W-bw)//2
rrect((bx, y, bx+bw, y+bh), 28, (28, 95, 210, 210), (90, 155, 255), 2)
draw.text((bx+26, y+11), badge, font=f_badge, fill=(255,255,255))
y += bh + 48

# ── MAIN TITLE ──────────────────────────────────────────
h = ctext(y, "Aviasiya Akademiyasi", f_title1, (255, 255, 255))
y += h + 6
h = ctext(y, "Foto Musabiqesi", f_title2, (100, 185, 255))
y += h + 44

# ── PRIZE BAR ───────────────────────────────────────────
pb_h = 120
rrect((70, y, W-70, y+pb_h), 20, (18, 65, 155, 185), (70, 150, 255), 2)

# Prize (left)
draw.text((110, y+18), "50 AZN", font=f_prize, fill=(255, 210, 0))
draw.text((110, y+72), "Qalib Mukafati", font=f_small, fill=(175, 210, 255))

# Divider
draw.line([(W//2, y+20), (W//2, y+pb_h-20)], fill=(60, 110, 200, 150), width=1)

# Duration (right)
rtext = "7 gun"
bb = draw.textbbox((0,0), rtext, font=f_prize)
rx = W//2 + (W//2 - 70 - (bb[2]-bb[0]))//2 + 20
draw.text((rx, y+18), rtext, font=f_prize, fill=(255, 255, 255))
draw.text((rx+6, y+72), "muddət", font=f_small, fill=(175, 210, 255))

y += pb_h + 46

# ── HOW TO PARTICIPATE ──────────────────────────────────
ctext(y, "Necə iştirak etmək olar?", f_med, (160, 205, 255))
y += 52

steps = [
    ("1.", "Aviasiya Akademiyasindan sekil cek"),
    ("2.", "Hash-da paylas"),
    ("3.", "Etiketleri elave et"),
]
for num, text in steps:
    nx = 130
    draw.text((nx, y), num, font=f_badge, fill=(90, 160, 255))
    draw.text((nx+42, y+1), text, font=f_step, fill=(225, 238, 255))
    y += 44
y += 18

# ── HASHTAG PILLS ───────────────────────────────────────
for tag in ["#AviasiyaAkademiyasi", "#HashCampus"]:
    bb = draw.textbbox((0,0), tag, font=f_tag)
    tw = bb[2]-bb[0]+48; th = bb[3]-bb[1]+20
    tx = (W-tw)//2
    rrect((tx, y, tx+tw, y+th), 18, (35, 95, 195, 155), (95, 165, 255), 1)
    draw.text((tx+24, y+10), tag, font=f_tag, fill=(130, 205, 255))
    y += th + 14
y += 18

# ── SCORING RULE ────────────────────────────────────────
sr_h = 88
rrect((70, y, W-70, y+sr_h), 16, (14, 48, 118, 165), (55, 115, 215), 1)
ctext(y+14, "Beyenme  +  Unikal Serh  =  Bal", f_badge, (255, 255, 255))
ctext(y+54, "En cox bal toplayan qalib olur", f_tiny, (155, 200, 255))
y += sr_h + 42

# ── FOOTER ──────────────────────────────────────────────
draw.line([(60, H-85), (W-60, H-85)], fill=(50, 95, 195, 110), width=1)
ctext(H-65, "hashcampus.site", f_tiny, (95, 155, 225))

# ── SAVE ────────────────────────────────────────────────
out_path = os.path.expanduser("~/Desktop/hash_musabiqe_poster.png")
out.convert("RGB").save(out_path, "PNG", quality=95)
print(f"Poster: {out_path}")
