#!/bin/bash

# Create placeholder icons using ImageMagick or as SVG

# Create 16x16 icon
convert -size 16x16 xc:"#0f0f0f" \
  -fill "#00d4ff" -draw "circle 8,8 2,2" \
  -fill "#ffffff" -pointsize 8 -draw "text 4,12 'P'" \
  /Users/mike/Developer/poly-on-tv/icons/icon16.png 2>/dev/null || \
  echo "ImageMagick not available, creating simple PNG with ffmpeg"

# Create 48x48 icon
convert -size 48x48 xc:"#0f0f0f" \
  -fill "#00d4ff" -draw "circle 24,24 6,6" \
  -fill "#ffffff" -pointsize 24 -draw "text 14,32 'P'" \
  /Users/mike/Developer/poly-on-tv/icons/icon48.png 2>/dev/null || \
  echo "ImageMagick not available"

# Create 128x128 icon
convert -size 128x128 xc:"#0f0f0f" \
  -fill "#00d4ff" -draw "circle 64,64 16,16" \
  -fill "#ffffff" -pointsize 64 -draw "text 36,84 'P'" \
  /Users/mike/Developer/poly-on-tv/icons/icon128.png 2>/dev/null || \
  echo "ImageMagick not available"

echo "Icons created"
