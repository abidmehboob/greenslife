/**
 * Legal Image Sourcing System for GreenLife Carnations
 * This script helps you source high-quality carnation images legally
 */

const fs = require('fs');
const path = require('path');

// Carnation varieties inspired by professional catalogs
const carnationVarieties = [
    {
        name: 'Standard Red Carnations',
        searchTerms: ['red carnation flowers', 'red dianthus caryophyllus', 'standard red carnation'],
        description: 'Classic red carnations perfect for romantic occasions',
        color: 'Red',
        variety: 'Standard'
    },
    {
        name: 'Pink Carnations',
        searchTerms: ['pink carnation flowers', 'pink dianthus', 'soft pink carnation'],
        description: 'Soft pink carnations representing gratitude and motherly love',
        color: 'Pink',
        variety: 'Standard'
    },
    {
        name: 'White Carnations',
        searchTerms: ['white carnation flowers', 'pure white carnation', 'wedding carnation'],
        description: 'Pure white carnations perfect for weddings and sympathy arrangements',
        color: 'White',
        variety: 'Standard'
    },
    {
        name: 'Yellow Carnations',
        searchTerms: ['yellow carnation flowers', 'bright yellow carnation', 'sunny carnation'],
        description: 'Bright yellow carnations bringing sunshine to arrangements',
        color: 'Yellow',
        variety: 'Standard'
    },
    {
        name: 'Purple Carnations',
        searchTerms: ['purple carnation flowers', 'lavender carnation', 'violet carnation'],
        description: 'Rich purple carnations for sophisticated arrangements',
        color: 'Purple',
        variety: 'Standard'
    },
    {
        name: 'Orange Carnations',
        searchTerms: ['orange carnation flowers', 'orange dianthus', 'coral carnation'],
        description: 'Vibrant orange carnations for energetic arrangements',
        color: 'Orange',
        variety: 'Standard'
    },
    {
        name: 'Green Carnations',
        searchTerms: ['green carnation flowers', 'green tinted carnation', 'novelty green carnation'],
        description: 'Unique green carnations for contemporary themes',
        color: 'Green',
        variety: 'Standard'
    },
    {
        name: 'Spray Carnations',
        searchTerms: ['spray carnation flowers', 'mini carnation spray', 'small headed carnations'],
        description: 'Multi-headed carnations excellent for texture and filler',
        color: 'Mixed',
        variety: 'Spray'
    },
    {
        name: 'Mini Carnations',
        searchTerms: ['miniature carnation flowers', 'small carnations', 'petite carnations'],
        description: 'Delicate small carnations perfect for corsages',
        color: 'Various',
        variety: 'Mini'
    },
    {
        name: 'Bicolor Carnations',
        searchTerms: ['bicolor carnation flowers', 'two tone carnation', 'striped carnation'],
        description: 'Stunning two-toned carnations with unique patterns',
        color: 'Bicolor',
        variety: 'Standard'
    }
];

// Legal image sources
const legalImageSources = {
    free: [
        {
            name: 'Unsplash',
            url: 'https://unsplash.com',
            api: 'https://api.unsplash.com/search/photos',
            license: 'Free for commercial use',
            attribution: 'Optional but appreciated',
            searchExample: 'https://unsplash.com/s/photos/red-carnation-flowers'
        },
        {
            name: 'Pexels',
            url: 'https://pexels.com',
            api: 'https://api.pexels.com/v1/search',
            license: 'Free for commercial use',
            attribution: 'Optional but appreciated',
            searchExample: 'https://pexels.com/search/carnation%20flowers/'
        },
        {
            name: 'Pixabay',
            url: 'https://pixabay.com',
            api: 'https://pixabay.com/api/',
            license: 'Free for commercial use',
            attribution: 'Not required but appreciated',
            searchExample: 'https://pixabay.com/images/search/carnation%20flower/'
        }
    ],
    paid: [
        {
            name: 'Shutterstock',
            url: 'https://shutterstock.com',
            license: 'Royalty-free with subscription',
            quality: 'Professional high-resolution',
            searchExample: 'Search: "carnation flowers professional"'
        },
        {
            name: 'Getty Images',
            url: 'https://gettyimages.com',
            license: 'Rights-managed or royalty-free',
            quality: 'Premium professional photography',
            searchExample: 'Search: "dianthus caryophyllus fresh cut flowers"'
        },
        {
            name: 'Adobe Stock',
            url: 'https://stock.adobe.com',
            license: 'Standard or extended license',
            quality: 'High-quality stock photography',
            searchExample: 'Search: "carnation flower varieties"'
        }
    ]
};

// Create image download instructions
function generateImageSourcingInstructions() {
    let instructions = `
# 🌸 GreenLife Carnation Image Sourcing Guide

## Legal Image Sources for Your Carnation Catalog

### FREE OPTIONS (Commercial Use Allowed):

1. **Unsplash.com** - Premium free photography
   - Search for each carnation variety using our search terms
   - Download high-resolution images (1920x1080 or higher recommended)
   - Optional attribution (photographer credit)

2. **Pexels.com** - Quality free stock photos
   - Great selection of flower photography
   - All images free for commercial use
   - No attribution required

3. **Pixabay.com** - Large free image database
   - Many carnation and flower options
   - Commercial use allowed
   - No attribution required

### PREMIUM OPTIONS (Best Quality):

1. **Shutterstock** - Professional stock photography
   - Highest quality carnation images
   - Consistent lighting and style
   - Monthly subscription model

2. **Getty Images** - Premium professional photography
   - Exclusive high-end flower photography
   - Perfect for professional catalogs
   - Per-image or subscription licensing

## Recommended Image Specifications:

- **Format:** JPG or PNG
- **Resolution:** Minimum 800x800px (square format recommended)
- **Quality:** High resolution for crisp display
- **Style:** Professional product photography with clean backgrounds
- **Consistency:** Similar lighting and composition for catalog uniformity

## Search Terms for Each Variety:
`;

    carnationVarieties.forEach(variety => {
        instructions += `
### ${variety.name}
- Color: ${variety.color}
- Search Terms: ${variety.searchTerms.join(', ')}
- Description: ${variety.description}
`;
    });

    instructions += `

## Implementation Steps:

1. **Download Images:** Use the search terms above to find suitable images
2. **Rename Files:** Save as variety name (e.g., 'red-carnations.jpg')
3. **Place in Folder:** Copy to '/public/images/flowers/carnations/'
4. **Update Code:** The application will automatically use .jpg/.png files if available
5. **Test Display:** Verify images load correctly in the browser

## File Naming Convention:
- red-carnations.jpg
- pink-carnations.jpg
- white-carnations.jpg
- yellow-carnations.jpg
- purple-carnations.jpg
- orange-carnations.jpg
- green-carnations.jpg
- spray-carnations.jpg
- mini-carnations.jpg
- bicolor-carnations.jpg

## Legal Compliance:
✅ All suggested sources provide commercial use rights
✅ No copyrighted material reproduction
✅ Proper licensing for business use
✅ Attribution provided where required

## Professional Tips:
- Choose images with similar lighting for consistency
- Prefer clean backgrounds or transparent PNGs
- Ensure high resolution for crisp display on all devices
- Consider seasonal availability when selecting varieties
`;

    return instructions;
}

// Save the instructions
const instructionsPath = path.join(__dirname, '..', 'IMAGE_SOURCING_GUIDE.md');
fs.writeFileSync(instructionsPath, generateImageSourcingInstructions());

console.log('📋 Image Sourcing Guide Created!');
console.log('📍 Location:', instructionsPath);
console.log('\n🌸 Carnation Varieties to Source:');
carnationVarieties.forEach((variety, index) => {
    console.log(`${index + 1}. ${variety.name} (${variety.color})`);
});

console.log('\n💡 Recommended Approach:');
console.log('1. Start with Unsplash.com for free high-quality images');
console.log('2. Use the provided search terms for each variety');
console.log('3. Download images as JPG format (800x800px minimum)');
console.log('4. Save with our naming convention in /public/images/flowers/carnations/');
console.log('5. The application will automatically detect and use the real images');

console.log('\n🎯 Next Steps:');
console.log('- Review the IMAGE_SOURCING_GUIDE.md file');
console.log('- Choose your preferred image source (free or paid)');
console.log('- Download images for each carnation variety');
console.log('- Replace the SVG placeholders with real photos');

module.exports = {
    carnationVarieties,
    legalImageSources,
    generateImageSourcingInstructions
};