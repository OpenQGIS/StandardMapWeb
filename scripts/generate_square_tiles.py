import os
import shutil
from PIL import Image

# Ensure PIL handles very large images
Image.MAX_IMAGE_PIXELS = None

SOURCE_MAPS = [
    {
        'id': 'h-china-base',
        'orientation': 'horizontal',
        'path': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\中国标准地图_横版\中国地图 1∶740万 (界线版 有邻国 无河流 线划(二).webp',
        'out_dir': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\tiles\h-china-base',
        'l1_grid': (3, 2),  # (cols, rows) -> near 1:1 square (0.94:1)
        'l2_grid': (6, 4),  # (cols, rows) -> near 1:1 square (0.94:1)
    },
    {
        'id': 'h-china-repro',
        'orientation': 'horizontal',
        'path': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\中国标准地图_横版\横版+小地球.webp',
        'out_dir': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\tiles\h-china-repro',
        'l1_grid': (3, 2),
        'l2_grid': (6, 4),
    },
    {
        'id': 'v-china-base',
        'orientation': 'vertical',
        'path': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\中国标准地图_竖版\中国地图 1∶1000万 (界线版 有邻国 无河流 线划(二).webp',
        'out_dir': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\tiles\v-china-base',
        'l1_grid': (2, 2),  # (cols, rows)
        'l2_grid': (4, 5),  # (cols, rows) -> near 1:1 square (1.06:1)
    },
    {
        'id': 'v-china-repro',
        'orientation': 'vertical',
        'path': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\中国标准地图_竖版\竖版+小地球.webp',
        'out_dir': r'E:\QGIS文章\QGIS文章\260710_标准地图工程\StandardMapWeb\public\maps\tiles\v-china-repro',
        'l1_grid': (2, 2),
        'l2_grid': (4, 5),
    }
]

def slice_grid(img, cols, rows, out_level_dir, quality=82):
    os.makedirs(out_level_dir, exist_ok=True)
    W, H = img.size
    col_w = W / cols
    row_h = H / rows

    for r in range(rows):
        y0 = int(round(r * row_h))
        y1 = int(round((r + 1) * row_h)) if r < rows - 1 else H
        for c in range(cols):
            x0 = int(round(c * col_w))
            x1 = int(round((c + 1) * col_w)) if c < cols - 1 else W
            
            box = (x0, y0, x1, y1)
            tile = img.crop(box)
            out_file = os.path.join(out_level_dir, f'{r}_{c}.webp')
            tile.save(out_file, 'WEBP', quality=quality, method=4)

def process_map(item):
    print(f"\nProcessing {item['id']} ({item['orientation']})...")
    out_dir = item['out_dir']
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    img = Image.open(item['path'])
    W, H = img.size
    print(f"  Original size: {W} x {H} (aspect ratio: {W/H:.4f})")

    # Level 0: 1 tile overview (max dimension 1600)
    l0_dir = os.path.join(out_dir, '0')
    os.makedirs(l0_dir, exist_ok=True)
    scale0 = 1600 / max(W, H)
    w0, h0 = int(round(W * scale0)), int(round(H * scale0))
    img_l0 = img.resize((w0, h0), Image.Resampling.LANCZOS)
    img_l0.save(os.path.join(l0_dir, '0_0.webp'), 'WEBP', quality=80, method=4)
    l0_size_kb = os.path.getsize(os.path.join(l0_dir, '0_0.webp')) / 1024
    print(f"  Level 0 (1 tile): {w0}x{h0} -> {l0_size_kb:.1f} KB")

    # Level 1:
    cols1, rows1 = item['l1_grid']
    l1_dir = os.path.join(out_dir, '1')
    slice_grid(img, cols1, rows1, l1_dir, quality=82)
    tile_w1 = W / cols1
    tile_h1 = H / rows1
    print(f"  Level 1 ({cols1}x{rows1} = {cols1*rows1} tiles): tile size ~{int(tile_w1)}x{int(tile_h1)} (aspect {tile_w1/tile_h1:.3f})")

    # Level 2:
    cols2, rows2 = item['l2_grid']
    l2_dir = os.path.join(out_dir, '2')
    slice_grid(img, cols2, rows2, l2_dir, quality=84)
    tile_w2 = W / cols2
    tile_h2 = H / rows2
    print(f"  Level 2 ({cols2}x{rows2} = {cols2*rows2} tiles): tile size ~{int(tile_w2)}x{int(tile_h2)} (aspect {tile_w2/tile_h2:.3f})")

    total_files = 1 + cols1 * rows1 + cols2 * rows2
    total_size_kb = sum(
        os.path.getsize(os.path.join(root, f))
        for root, _, files in os.walk(out_dir)
        for f in files if f.endswith('.webp')
    ) / 1024
    print(f"  Total: {total_files} tiles, {total_size_kb/1024:.2f} MB")

if __name__ == '__main__':
    for item in SOURCE_MAPS:
        process_map(item)
    print("\nAll near-square tiles generated successfully!")
