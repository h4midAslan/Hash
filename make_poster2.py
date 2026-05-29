from PIL import Image, ImageDraw, ImageFont
import math, os

W, H = 1080, 1440

# ── BACKGROUND ──────────────────────────────────────────────────────────────
img = Image.new("RGB", (W, H))
draw = ImageDraw.Draw(img)
for y in range(H):
    t = y / H
    draw.line([(0, y), (W, y)], fill=(int(6+t*8), int(14+t*22), int(44+t*48)))

ov = Image.new("RGBA", (W, H), (0,0,0,0))
od = ImageDraw.Draw(ov)
for i in range(0, W+H, 120):
    od.line([(i,0),(max(0,i-H),H)], fill=(255,255,255,5), width=1)
img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
draw = ImageDraw.Draw(img)

cx = W // 2

# ── HELPERS ──────────────────────────────────────────────────────────────────
def rrect(xy, r, fill, outline=None, ow=3):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=ow)

def circ(cx, cy, r, fill=None, outline=None, ow=3):
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill, outline=outline, width=ow)

def arrow_down(x, y_top, length=60, col=(70,135,230)):
    sw = 9; hw = 34; hh = 20
    draw.rectangle([x-sw//2, y_top, x+sw//2, y_top+length-hh], fill=col)
    draw.polygon([(x-hw//2, y_top+length-hh),(x+hw//2, y_top+length-hh),(x, y_top+length)], fill=col)

def heart(cx, cy, size, color):
    # Two circles top + diamond bottom
    r = int(size * 0.52)
    # Left bump
    draw.ellipse([cx-r*2+4, cy-r, cx+4, cy+r], fill=color)
    # Right bump
    draw.ellipse([cx-4, cy-r, cx+r*2-4, cy+r], fill=color)
    # Bottom triangle (V shape)
    pts = [(cx-r*2+8, cy+r//2), (cx, cy+r*2-6), (cx+r*2-8, cy+r//2)]
    draw.polygon(pts, fill=color)

def star5(cx, cy, r_out, r_in, color):
    pts = []
    for i in range(10):
        a = math.radians(i*36 - 90)
        r = r_out if i%2==0 else r_in
        pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    draw.polygon(pts, fill=color)

def sparkle(cx, cy, r, color):
    for a in range(0, 360, 90):
        ang = math.radians(a)
        draw.line([(cx, cy), (cx+r*math.cos(ang), cy+r*math.sin(ang))], fill=color, width=2)

# ── LOGO HEADER ──────────────────────────────────────────────────────────────
logo_path = "/home/hamid/Documents/VektorIn/frontend/public/logo.png"
y = 30
try:
    logo = Image.open(logo_path).convert("RGBA")
    lsz = 82
    logo = logo.resize((lsz,lsz), Image.LANCZOS)
    img.paste(logo, ((W-lsz)//2, y), logo)
    draw = ImageDraw.Draw(img)
except:
    pass
draw.line([(140,128),(W-140,128)], fill=(50,100,200,120), width=1)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1 — CAMERA  (center y=270)
# ═══════════════════════════════════════════════════════════════════════════
CY1 = 250
cw, ch = 310, 218

# Body
bx0,by0 = cx-cw//2, CY1-ch//2+8
bx1,by1 = cx+cw//2, CY1+ch//2+8
rrect([bx0,by0,bx1,by1], 28, (28,88,210), (70,145,255), 3)

# Viewfinder bump
vw,vh = 100,30
rrect([cx-vw//2, by0-vh+4, cx+vw//2, by0+6], 12, (28,88,210))
rrect([cx-vw//2, by0-vh+2, cx+vw//2, by0+4], 12, None, (70,145,255), 2)

# Flash
rrect([bx0+22, by0-vh+6, bx0+62, by0+6], 7, (255,218,70))

# Lens rings (centered in body)
lcy = CY1 + 14
circ(cx, lcy, 82, (12,38,110))
circ(cx, lcy, 68, (38,105,215))
circ(cx, lcy, 54, (12,38,110))
circ(cx, lcy, 40, (80,162,255))
circ(cx, lcy, 18, (200,230,255))
# Shine
draw.ellipse([cx-50, lcy-50, cx-26, lcy-28], fill=(255,255,255,80))

# Shutter button
circ(bx1-38, by0+20, 13, (48,118,240))
circ(bx1-38, by0+20, 8,  (170,215,255))

# ── ARROW 1 ────────────────────────────────────────────────────────────────
A1_TOP = by1 + 12          # bottom of camera body = CY1+ch//2+8+12
arrow_down(cx, A1_TOP, 60)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2 — PHONE  (center y=530)
# ═══════════════════════════════════════════════════════════════════════════
CY2 = 560
pw, ph = 188, 318
px0,py0 = cx-pw//2, CY2-ph//2
px1,py1 = cx+pw//2, CY2+ph//2

# Phone body
rrect([px0,py0,px1,py1], 32, (228,238,255), (175,205,250), 3)
# Side + volume buttons
draw.rectangle([px1, CY2-36, px1+7, CY2+12], fill=(185,202,232))
draw.rectangle([px0-7, CY2-58, px0, CY2-18], fill=(185,202,232))
draw.rectangle([px0-7, CY2+6,  px0, CY2+46], fill=(185,202,232))

# Notch
rrect([cx-26, py0+8, cx+26, py0+28], 11, (175,192,228))
circ(cx, py0+18, 6, (148,166,210))

# Screen
sx0,sy0 = px0+10, py0+38
sx1,sy1 = px1-10, py1-10
rrect([sx0,sy0,sx1,sy1], 12, (8,22,68))

# Hash # on screen
hcx,hcy = cx, sy0+56
lw=50; ls=12; lth=5; vlen=38; voff=10
draw.rectangle([hcx-lw//2, hcy-ls, hcx+lw//2, hcy-ls+lth], fill=(80,155,255))
draw.rectangle([hcx-lw//2, hcy+ls-lth, hcx+lw//2, hcy+ls], fill=(80,155,255))
draw.rectangle([hcx-voff-4, hcy-vlen//2, hcx-voff, hcy+vlen//2], fill=(80,155,255))
draw.rectangle([hcx+voff, hcy-vlen//2, hcx+voff+4, hcy+vlen//2], fill=(80,155,255))

# Post image placeholder
iy0 = sy0+98
rrect([sx0+10, iy0, sx1-10, iy0+82], 7, (18,52,140))
circ(sx0+28, iy0+22, 13, (255,208,55))
mt = [(cx-52,iy0+82),(cx-8,iy0+36),(cx+34,iy0+82)]
draw.polygon(mt, fill=(32,82,172))
mt2 = [(cx-2,iy0+82),(cx+36,iy0+46),(cx+70,iy0+82)]
draw.polygon(mt2, fill=(48,108,205))

# Like row
ly = iy0+90
heart(sx0+26, ly+12, 16, (220,38,72))
circ(sx0+50, ly+12, 8, (60,128,255))

# Upload button (floating right of phone)
ub_cx = px1+52; ub_cy = CY2-45
circ(ub_cx, ub_cy, 32, (28,88,210), (80,155,255), 2)
draw.rectangle([ub_cx-5, ub_cy-12, ub_cx+5, ub_cy+12], fill=(255,255,255))
draw.polygon([(ub_cx-15,ub_cy-4),(ub_cx+15,ub_cy-4),(ub_cx,ub_cy-22)], fill=(255,255,255))

# ── ARROW 2 ────────────────────────────────────────────────────────────────
A2_TOP = py1 + 12
arrow_down(cx, A2_TOP, 60)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3 — HASHTAG PILLS  (center y=790)
# ═══════════════════════════════════════════════════════════════════════════
CY3 = 800
pill_h = 74
gap = 22
pill_w1 = 290; pill_w2 = 250
total_pills = pill_w1 + gap + pill_w2
px_start = cx - total_pills//2

for i,(pw2,col,ocol) in enumerate([(pill_w1,(32,98,215),(80,155,255)),(pill_w2,(22,76,178),(70,140,240))]):
    px = px_start + i*(pill_w1+gap)
    rrect([px, CY3-pill_h//2, px+pw2, CY3+pill_h//2], 37, col, ocol, 2)
    # # inside
    hcx2 = px + pw2//2; hcy2 = CY3
    lw2=34; ls2=9; lth2=4; vl2=28; vo2=9
    draw.rectangle([hcx2-lw2//2, hcy2-ls2, hcx2+lw2//2, hcy2-ls2+lth2], fill=(135,200,255))
    draw.rectangle([hcx2-lw2//2, hcy2+ls2-lth2, hcx2+lw2//2, hcy2+ls2], fill=(135,200,255))
    draw.rectangle([hcx2-vo2-4, hcy2-vl2//2, hcx2-vo2, hcy2+vl2//2], fill=(135,200,255))
    draw.rectangle([hcx2+vo2, hcy2-vl2//2, hcx2+vo2+4, hcy2+vl2//2], fill=(135,200,255))

# ── ARROW 3 ────────────────────────────────────────────────────────────────
A3_TOP = CY3 + pill_h//2 + 12
arrow_down(cx, A3_TOP, 60)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4 — HEART + COMMENT BUBBLE  (center y=1010)
# ═══════════════════════════════════════════════════════════════════════════
CY4 = 1010

# HEART (left)
hx = cx - 148
heart(hx, CY4, 96, (218,36,70))
# Outer glow ring (drawn as thick outline circle approx)
circ(hx, CY4, 82, None, (218,36,70,60), 10)
# Small accent dots
for ddx,ddy in [(-32,-62),(44,-52)]:
    circ(hx+ddx, CY4+ddy, 10, (255,88,118))

# SPEECH BUBBLE (right)
bub_cx = cx + 148
bw2,bh2 = 178,126
bbx0 = bub_cx-bw2//2; bby0 = CY4-bh2//2-8
rrect([bbx0,bby0,bbx0+bw2,bby0+bh2], 26, (40,105,225), (88,162,255), 3)
# Tail (bottom-left)
tail_pts = [(bbx0+18,bby0+bh2-2),(bbx0-22,bby0+bh2+28),(bbx0+50,bby0+bh2-2)]
draw.polygon(tail_pts, fill=(40,105,225))
# Three dots
for di in range(3):
    circ(bub_cx-28+di*28, CY4-8, 11, (158,208,255))

# PLUS between them
draw.rectangle([cx-5,CY4-22,cx+5,CY4+22], fill=(95,148,228))
draw.rectangle([cx-22,CY4-5,cx+22,CY4+5], fill=(95,148,228))

# ── ARROW 4 ────────────────────────────────────────────────────────────────
A4_TOP = CY4 + 74
arrow_down(cx, A4_TOP, 60)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5 — TROPHY + COIN  (center y=1260)
# ═══════════════════════════════════════════════════════════════════════════
CY5 = 1270
gold  = (255,198,36)
gold_d = (210,155,18)
gold_l = (255,238,140)

# ── Trophy cup body (trapezoid) ──
t_top = CY5 - 108
t_bot = CY5 + 18
t_hw_top = 108   # half-width at top
t_hw_bot = 74    # half-width at bottom
cup_pts = [
    (cx-t_hw_top, t_top),
    (cx+t_hw_top, t_top),
    (cx+t_hw_bot, t_bot),
    (cx-t_hw_bot, t_bot),
]
draw.polygon(cup_pts, fill=gold)
# Inner shading
inner_pts = [
    (cx-t_hw_top+22, t_top+20),
    (cx+t_hw_top-22, t_top+20),
    (cx+t_hw_bot-18, t_bot-12),
    (cx-t_hw_bot+18, t_bot-12),
]
draw.polygon(inner_pts, fill=gold_d)

# ── Cup handles: classic ( ) arcs ──
t_mid_y = (t_top + t_bot) // 2
h_hh = (t_bot - t_top) // 2 + 6   # half-height
h_hw = 52                           # half-width (depth of handle curve)

# Left handle "(" — right side of ellipse centered to the left of cup
lhcx = cx - t_hw_top - 4
draw.arc([lhcx - h_hw, t_mid_y - h_hh, lhcx + h_hw, t_mid_y + h_hh],
          start=270, end=90, fill=gold, width=22)

# Right handle ")" — left side of ellipse centered to the right of cup
rhcx = cx + t_hw_top + 4
draw.arc([rhcx - h_hw, t_mid_y - h_hh, rhcx + h_hw, t_mid_y + h_hh],
          start=90, end=270, fill=gold, width=22)

# ── Star in cup ──
star5(cx, CY5-46, 40, 18, gold_l)

# ── Stem ──
draw.rectangle([cx-13, t_bot, cx+13, t_bot+44], fill=gold_d)
draw.rectangle([cx-13, t_bot, cx+13, t_bot+44], outline=gold, width=1)

# ── Base ──
rrect([cx-82, t_bot+44, cx+82, t_bot+68], 10, gold, gold_d, 2)

# ── Coin (right side) ──
co_cx = cx+162; co_cy = CY5-18; co_r=66
circ(co_cx, co_cy, co_r,   gold_d)
circ(co_cx, co_cy, co_r-5, gold)
circ(co_cx, co_cy, co_r-5, None, gold_l, 3)
# Inner circle
circ(co_cx, co_cy, co_r-20, gold_d)
# Star on coin
star5(co_cx, co_cy, 28, 12, gold_l)

# ── Sparkles ──
for sx,sy,sr,sc in [
    (cx-168, CY5-128, 10, gold_l),
    (cx+255, CY5-108, 8,  gold_l),
    (cx-200, CY5+30,  7,  gold_l),
    (cx+270, CY5+40,  9,  gold_l),
    (cx+210, CY5-168, 6,  (255,255,200)),
]:
    star5(sx,sy,sr,sr//2,sc)

# ── FOOTER ──────────────────────────────────────────────────────────────────
draw.line([(80,H-42),(W-80,H-42)], fill=(45,90,180,110), width=1)
for di in range(11):
    circ(cx-100+di*20, H-24, 3, (75,135,208))

# ── PASTE LOGO ON TOP ────────────────────────────────────────────────────────
try:
    logo2 = Image.open(logo_path).convert("RGBA")
    logo2 = logo2.resize((82,82), Image.LANCZOS)
    img.paste(logo2, ((W-82)//2, 30), logo2)
except:
    pass

# ── SAVE ────────────────────────────────────────────────────────────────────
out = os.path.expanduser("~/Desktop/hash_musabiqe_poster.png")
img.save(out, "PNG", quality=95)
print("Hazır:", out)
