# Draws the Recommendr fan mark on a 32-unit grid: four ink blades and one lime blade
# radiating from a notched pivot at the bottom left. Prints the path data used by the SVGs and
# the Logo component. Angles are degrees counter-clockwise from +x.
import math
PX, PY = 5.0, 27.0            # pivot
INK_BLADES = [(95, 77), (72, 55), (50, 33), (28, 13)]   # (start, end) degrees, 5 deg gaps
LIME_BLADE = (9, -4)
R_INK, R_LIME = 23.0, 24.0
NOTCH_R = 2.6                 # concave notch at the pivot (a real mask cut)

def pt(r, a):
    t = math.radians(a)
    return PX + r * math.cos(t), PY - r * math.sin(t)

def wedge(a1, a2, r):
    # start a little away from the pivot so blades separate cleanly there
    x0, y0 = pt(1.2, (a1 + a2) / 2)
    x1, y1 = pt(r, a1)
    x2, y2 = pt(r, a2)
    f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")
    return f"M{f(x0)} {f(y0)}L{f(x1)} {f(y1)}A{f(r)} {f(r)} 0 0 1 {f(x2)} {f(y2)}Z"

ink = "".join(wedge(a, b, R_INK) for a, b in INK_BLADES)
lime = wedge(*LIME_BLADE, R_LIME)
print("INK", ink)
print("LIME", lime)
print("NOTCH", f"{PX} {PY} {NOTCH_R}")
