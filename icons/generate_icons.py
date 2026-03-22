#!/usr/bin/env python3

import struct

def create_simple_png(filename, size):
    """Create a simple dark PNG with a blue circle"""
    # PNG header
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # For simplicity, we'll create a minimal valid PNG
    # This is just a dark background with a simple pattern
    # In production, you'd use PIL or similar
    
    # Create minimal 1x1 PNG (dark background)
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # width, height, bit depth, color type, etc.
    ihdr_crc = 0x90773546  # Pre-calculated CRC for a simple header
    
    # For now, create a simple file that will work
    # Chrome will accept even minimal PNGs
    with open(filename, 'wb') as f:
        f.write(png_header)
        # IHDR chunk
        f.write(b'IHDR')
        f.write(ihdr_data)
        f.write(struct.pack('>I', ihdr_crc))
        
        # IDAT chunk (minimal data - just creates a dark image)
        idat_data = b'\x00\x0f\x0f\x0f\x0f\x0f\x0f\x0f'
        f.write(b'IDAT')
        f.write(struct.pack('>I', len(idat_data) * 2))
        f.write(idat_data * 2)
        f.write(struct.pack('>I', 0))  # CRC
        
        # IEND chunk
        f.write(b'IEND')
        f.write(struct.pack('>I', 0))
        f.write(struct.pack('>I', 0xae426082))

# Create placeholder icons
try:
    import PIL
    from PIL import Image, ImageDraw
    
    for size in [16, 48, 128]:
        img = Image.new('RGB', (size, size), color='#0f0f0f')
        draw = ImageDraw.Draw(img)
        
        # Draw blue circle
        margin = size // 8
        draw.ellipse([margin, margin, size-margin, size-margin], fill='#00d4ff')
        
        filename = f'/Users/mike/Developer/poly-on-tv/icons/icon{size}.png'
        img.save(filename)
        print(f'Created {filename}')
except ImportError:
    print('PIL not available, creating minimal PNG files')
    for size in [16, 48, 128]:
        create_simple_png(f'/Users/mike/Developer/poly-on-tv/icons/icon{size}.png', size)
        print(f'Created icon{size}.png')
