/**
 * Smart Image Handler for GreenLife
 * Automatically detects and serves the best available image format
 */

const fs = require('fs');
const path = require('path');

class ImageHandler {
    constructor(imagesBasePath = './public/images/flowers/carnations') {
        this.basePath = imagesBasePath;
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
        this.preferredOrder = ['.jpg', '.png', '.webp', '.jpeg', '.svg'];
    }

    /**
     * Find the best available image for a carnation variety
     * @param {string} varietyName - Name like 'red-carnations'
     * @returns {string|null} - Path to best image or null if none found
     */
    findBestImage(varietyName) {
        const cleanName = varietyName.toLowerCase().replace(/\s+/g, '-');
        
        for (const format of this.preferredOrder) {
            const imagePath = path.join(this.basePath, `${cleanName}${format}`);
            if (fs.existsSync(imagePath)) {
                return `/images/flowers/carnations/${cleanName}${format}`;
            }
        }
        return null;
    }

    /**
     * Get all available carnation images with their best format
     * @returns {Object} - Map of variety name to image path
     */
    getAllAvailableImages() {
        const varieties = [
            'red-carnations',
            'pink-carnations', 
            'white-carnations',
            'yellow-carnations',
            'purple-carnations',
            'orange-carnations',
            'green-carnations',
            'spray-carnations',
            'mini-carnations',
            'bicolor-carnations',
            'standard-carnations'
        ];

        const imageMap = {};
        varieties.forEach(variety => {
            const imagePath = this.findBestImage(variety);
            if (imagePath) {
                imageMap[variety] = imagePath;
            }
        });

        return imageMap;
    }

    /**
     * Check if real photos are available (non-SVG)
     * @returns {boolean}
     */
    hasRealPhotos() {
        const realFormats = ['.jpg', '.jpeg', '.png', '.webp'];
        const varieties = ['red-carnations', 'pink-carnations', 'white-carnations'];
        
        return varieties.some(variety => {
            return realFormats.some(format => {
                const imagePath = path.join(this.basePath, `${variety}${format}`);
                return fs.existsSync(imagePath);
            });
        });
    }

    /**
     * Generate image status report
     * @returns {Object}
     */
    getImageStatus() {
        const availableImages = this.getAllAvailableImages();
        const hasReal = this.hasRealPhotos();
        
        return {
            totalImages: Object.keys(availableImages).length,
            availableImages,
            hasRealPhotos: hasReal,
            usingPlaceholders: !hasReal,
            missingVarieties: [
                'red-carnations', 'pink-carnations', 'white-carnations',
                'yellow-carnations', 'purple-carnations', 'orange-carnations',
                'green-carnations', 'spray-carnations', 'mini-carnations',
                'bicolor-carnations', 'standard-carnations'
            ].filter(variety => !availableImages[variety])
        };
    }
}

module.exports = ImageHandler;