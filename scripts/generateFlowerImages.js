/**
 * Generate placeholder images for carnation flowers
 * This creates SVG placeholder images for each carnation variety
 */

const fs = require('fs');
const path = require('path');

const carnationTypes = [
    { name: 'standard-carnations', color: '#FF69B4', displayName: 'Standard Carnations' },
    { name: 'spray-carnations', color: '#FFB6C1', displayName: 'Spray Carnations' },
    { name: 'mini-carnations', color: '#FF1493', displayName: 'Mini Carnations' },
    { name: 'green-carnations', color: '#90EE90', displayName: 'Green Carnations' },
    { name: 'purple-carnations', color: '#9370DB', displayName: 'Purple Carnations' },
    { name: 'yellow-carnations', color: '#FFD700', displayName: 'Yellow Carnations' },
    { name: 'white-carnations', color: '#FFFFFF', displayName: 'White Carnations' },
    { name: 'red-carnations', color: '#DC143C', displayName: 'Red Carnations' },
    { name: 'pink-carnations', color: '#FFC0CB', displayName: 'Pink Carnations' },
    { name: 'orange-carnations', color: '#FFA500', displayName: 'Orange Carnations' },
    { name: 'bicolor-carnations', color: '#FF69B4', displayName: 'Bicolor Carnations' }
];

const imagesDir = path.join(__dirname, '..', 'public', 'images', 'flowers', 'carnations');

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

carnationTypes.forEach(carnation => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <radialGradient id="flowerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:${carnation.color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${carnation.color}88;stop-opacity:1" />
        </radialGradient>
        <linearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#228B22;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#006400;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="300" height="300" fill="#f8f9fa"/>
    
    <!-- Stem -->
    <rect x="145" y="180" width="10" height="100" fill="url(#stemGradient)" rx="5"/>
    
    <!-- Leaves -->
    <ellipse cx="135" cy="200" rx="15" ry="8" fill="#228B22" transform="rotate(-30 135 200)"/>
    <ellipse cx="165" cy="210" rx="15" ry="8" fill="#228B22" transform="rotate(30 165 210)"/>
    
    <!-- Flower petals (carnation style) -->
    <g transform="translate(150,120)">
        <!-- Outer petals -->
        <circle cx="0" cy="0" r="45" fill="url(#flowerGradient)" opacity="0.8"/>
        <circle cx="0" cy="0" r="35" fill="url(#flowerGradient)" opacity="0.9"/>
        
        <!-- Inner ruffled effect -->
        <path d="M-25,0 Q-15,-10 0,0 Q15,-10 25,0 Q15,10 0,0 Q-15,10 -25,0" fill="${carnation.color}" opacity="0.7"/>
        <path d="M0,-25 Q10,-15 0,0 Q10,15 0,25 Q-10,15 0,0 Q-10,-15 0,-25" fill="${carnation.color}" opacity="0.7"/>
        
        <!-- Center -->
        <circle cx="0" cy="0" r="8" fill="#4A5D23"/>
    </g>
    
    <!-- Text label -->
    <rect x="0" y="270" width="300" height="30" fill="rgba(255,255,255,0.9)"/>
    <text x="150" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">
        ${carnation.displayName}
    </text>
</svg>`;

    const fileName = `${carnation.name}.svg`;
    const filePath = path.join(imagesDir, fileName);
    
    fs.writeFileSync(filePath, svgContent);
    console.log(`✓ Generated ${fileName}`);
});

console.log(`\n✅ Generated ${carnationTypes.length} carnation placeholder images`);
console.log(`📁 Images saved to: ${imagesDir}`);
console.log('\n💡 You can now replace these SVG placeholders with actual flower photos');
console.log('   - Use royalty-free images from Unsplash, Pexels, or Pixabay');
console.log('   - Take your own photos');
console.log('   - Purchase stock photos from Shutterstock or Getty Images');