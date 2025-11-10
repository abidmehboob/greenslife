#!/usr/bin/env node

/**
 * Image Placeholder Generator
 * Creates placeholder images for the flower catalog
 */

const fs = require('fs');
const path = require('path');

// Image directory structure
const imageDirectories = [
  'client/public/images/flowers/carnations',
  'client/public/images/flowers/spray-carnations',
  'client/public/images/categories'
];

// Flower image files needed
const flowerImages = {
  carnations: [
    'red-carnation-1.jpg',
    'red-carnation-2.jpg', 
    'red-carnation-bunch.jpg',
    'pink-carnation-1.jpg',
    'pink-carnation-2.jpg',
    'white-carnation-1.jpg',
    'white-carnation-2.jpg',
    'yellow-carnation-1.jpg',
    'yellow-carnation-2.jpg',
    'purple-carnation-1.jpg',
    'purple-carnation-2.jpg'
  ],
  'spray-carnations': [
    'white-spray-carnation-1.jpg',
    'white-spray-carnation-2.jpg',
    'white-spray-carnation-bunch.jpg',
    'pink-spray-carnation-1.jpg',
    'pink-spray-carnation-2.jpg',
    'red-spray-carnation-1.jpg',
    'red-spray-carnation-2.jpg',
    'yellow-spray-carnation-1.jpg',
    'yellow-spray-carnation-2.jpg',
    'orange-spray-carnation-1.jpg',
    'orange-spray-carnation-2.jpg'
  ],
  categories: [
    'carnations.jpg',
    'spray-carnations.jpg'
  ]
};

// SVG placeholder template
const createPlaceholderSVG = (width, height, text, bgColor = '#f0f0f0', textColor = '#666') => {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="${textColor}">${text}</text>
  </svg>`;
};

// Create directories if they don't exist
function ensureDirectories() {
  imageDirectories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
}

// Create placeholder images
function createPlaceholderImages() {
  let createdCount = 0;

  // Create carnation images
  flowerImages.carnations.forEach(filename => {
    const filePath = path.join(__dirname, '..', 'client/public/images/flowers/carnations', filename);
    if (!fs.existsSync(filePath)) {
      const color = filename.includes('red') ? '#dc3545' : 
                   filename.includes('pink') ? '#e91e63' :
                   filename.includes('white') ? '#f8f9fa' :
                   filename.includes('yellow') ? '#ffc107' :
                   filename.includes('purple') ? '#6f42c1' : '#dee2e6';
      
      const flowerName = filename.split('-').slice(0, 2).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const svg = createPlaceholderSVG(400, 300, flowerName, color, '#fff');
      fs.writeFileSync(filePath.replace('.jpg', '.svg'), svg);
      createdCount++;
    }
  });

  // Create spray carnation images
  flowerImages['spray-carnations'].forEach(filename => {
    const filePath = path.join(__dirname, '..', 'client/public/images/flowers/spray-carnations', filename);
    if (!fs.existsSync(filePath)) {
      const color = filename.includes('white') ? '#f8f9fa' :
                   filename.includes('pink') ? '#e91e63' :
                   filename.includes('red') ? '#dc3545' :
                   filename.includes('yellow') ? '#ffc107' :
                   filename.includes('orange') ? '#fd7e14' : '#dee2e6';
      
      const flowerName = filename.split('-').slice(0, 3).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const svg = createPlaceholderSVG(400, 300, flowerName, color, '#fff');
      fs.writeFileSync(filePath.replace('.jpg', '.svg'), svg);
      createdCount++;
    }
  });

  // Create category images
  flowerImages.categories.forEach(filename => {
    const filePath = path.join(__dirname, '..', 'client/public/images/categories', filename);
    if (!fs.existsSync(filePath)) {
      const categoryName = filename.replace('.jpg', '').replace('-', ' ')
        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      const svg = createPlaceholderSVG(600, 400, categoryName, '#28a745', '#fff');
      fs.writeFileSync(filePath.replace('.jpg', '.svg'), svg);
      createdCount++;
    }
  });

  return createdCount;
}

// Main execution
function main() {
  console.log('🖼️  Creating placeholder images for flower catalog...\n');
  
  try {
    ensureDirectories();
    const created = createPlaceholderImages();
    
    console.log(`\n✅ Placeholder image generation complete!`);
    console.log(`📊 Created ${created} new placeholder images`);
    console.log(`\n📝 Note: These are SVG placeholders. Replace with actual flower images when available.`);
    console.log(`\n🎯 Image directories:`);
    imageDirectories.forEach(dir => console.log(`   - ${dir}`));
    
  } catch (error) {
    console.error('❌ Error creating placeholder images:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };