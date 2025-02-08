const room = new WebsimSocket();

// Handle form submission
const userInput = document.getElementById('userInput');
const submitBtn = document.getElementById('submitBtn');
const gallery = document.getElementById('gallery');

let imageCounter = 0;

async function handleImageSubmission(e) {
  e?.preventDefault();
  
  const imageUrl = userInput.value.trim();
  if (!imageUrl) return;

  // Disable input while processing
  submitBtn.disabled = true;
  userInput.disabled = true;
  submitBtn.classList.add('loading');

  try {
    // Create a temporary image to load the URL
    const tempImg = document.createElement('img');
    tempImg.id = `temp-img-${imageCounter++}`;
    tempImg.style.display = 'none';
    document.body.appendChild(tempImg);

    // Wait for image to load or fail
    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
      tempImg.src = imageUrl;
      tempImg.alt = imageUrl;
    });

    // Convert image to blob for upload
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Upload to websim storage
    const uploadedUrl = await window.websim.upload(blob);

    // Store in database
    await room.collection('gallery_images').create({
      originalUrl: imageUrl,
      uploadedUrl: uploadedUrl
    });

    // Clean up
    userInput.value = '';
    tempImg.remove();

  } catch (error) {
    console.error('Error processing image:', error);
    alert('Error processing image. Please check the URL and try again.');
  } finally {
    // Re-enable input
    submitBtn.disabled = false;
    userInput.disabled = false;
    submitBtn.classList.remove('loading');
  }
}

// Setup event listeners
submitBtn.addEventListener('click', handleImageSubmission);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleImageSubmission(e);
});

// Subscribe to gallery updates
room.collection('gallery_images').subscribe(images => {
  gallery.innerHTML = ''; // Clear gallery
  
  images.forEach(image => {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'gallery-image';
    imageDiv.style.backgroundImage = `url(${image.uploadedUrl})`;
    gallery.appendChild(imageDiv);
  });
});