// Smooth scroll for internal links
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
    }

    // Active link highlight
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
  });
});

// Hero Image Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slider img');
const totalSlides = slides.length;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.display = i === index ? 'block' : 'none';
  });
}

// Start automatic slideshow
function startSlider() {
  showSlide(currentSlide);
  setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
  }, 3000); // Change every 3 seconds
}

if (slides.length > 0) startSlider();

// Smooth scroll for internal anchors
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
    }

    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
  });
});

