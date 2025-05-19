const fs = require('fs');
const { createCanvas } = require('canvas');

// Create directories if they don't exist
const dirs = [
  'public/images',
  'public/images/categories',
  'public/images/testimonials'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Function to create a placeholder image
function createPlaceholderImage(width, height, text, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  // Add border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Add text
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  // Save the image
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Generate main placeholders
createPlaceholderImage(800, 600, 'Property Image', 'public/images/placeholder.jpg');
createPlaceholderImage(1200, 800, 'Hero Property', 'public/images/hero-property.jpg');
createPlaceholderImage(400, 600, 'App Mockup', 'public/images/app-mockup.png');

// Generate category placeholders
createPlaceholderImage(600, 400, 'Residential', 'public/images/categories/residential.jpg');
createPlaceholderImage(600, 400, 'Commercial', 'public/images/categories/commercial.jpg');
createPlaceholderImage(600, 400, 'Land', 'public/images/categories/land.jpg');
createPlaceholderImage(600, 400, 'Industrial', 'public/images/categories/industrial.jpg');

// Generate testimonial placeholders
createPlaceholderImage(400, 400, 'Person 1', 'public/images/testimonials/person1.jpg');
createPlaceholderImage(400, 400, 'Person 2', 'public/images/testimonials/person2.jpg');
createPlaceholderImage(400, 400, 'Person 3', 'public/images/testimonials/person3.jpg');

console.log('All placeholder images created successfully!');