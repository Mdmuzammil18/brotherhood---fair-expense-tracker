#!/bin/bash

# Script to generate PWA icons in all required sizes using ImageMagick (sips on macOS)
# Source image should be 512x512

SOURCE_ICON="public/icons/icon-512x512.png"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Array of icon sizes
sizes=(16 32 72 96 120 128 144 152 180 192 384 512)

echo "Generating PWA icons from $SOURCE_ICON..."

for size in "${sizes[@]}"; do
    output="public/icons/icon-${size}x${size}.png"
    echo "Creating ${size}x${size} icon..."
    
    # Use sips (macOS built-in tool) to resize
    sips -z $size $size "$SOURCE_ICON" --out "$output" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ Created $output"
    else
        echo "✗ Failed to create $output"
    fi
done

echo "Done! Generated ${#sizes[@]} icon sizes."
