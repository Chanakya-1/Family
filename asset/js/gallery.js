
        document.addEventListener('DOMContentLoaded', function() {
            const galleryContent = document.getElementById('gallery-content');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const searchInput = document.getElementById('search-input');
            const emptyState = document.getElementById('empty-state');
            const lightboxDownload = document.getElementById('lightbox-download');
            const lightboxEdit = document.getElementById('lightbox-edit');
            const lightboxDelete = document.getElementById('lightbox-delete');
            const editModal = document.getElementById('edit-modal');
            const editForm = document.getElementById('edit-form');
            const editCancel = document.getElementById('edit-cancel');
            const deleteModal = document.getElementById('delete-modal');
            const deleteCancel = document.getElementById('delete-cancel');
            const deleteConfirm = document.getElementById('delete-confirm');
            
            let currentImageIndex = 0;
            let allPhotos = [];
            let photoToDelete = null;
            
            // Get uploaded photos from localStorage
            function getUploadedPhotos() {
                try {
                    const photos = localStorage.getItem('familyPortfolioPhotos');
                    const parsedPhotos = photos ? JSON.parse(photos) : [];
                    console.log('Photos retrieved from localStorage:', parsedPhotos.length);
                    return parsedPhotos;
                } catch (e) {
                    console.error('Error reading from localStorage:', e);
                    return [];
                }
            }
            
            // Save uploaded photos to localStorage
            function saveUploadedPhotos(photos) {
                try {
                    localStorage.setItem('familyPortfolioPhotos', JSON.stringify(photos));
                    console.log('Photos saved to localStorage:', photos.length);
                    return true;
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                    return false;
                }
            }
            
            // Group photos by month and year
            function groupPhotosByDate(photos) {
                const grouped = {};
                
                photos.forEach(photo => {
                    const key = photo.monthYear || getMonthYear(photo.date);
                    
                    if (!grouped[key]) {
                        grouped[key] = [];
                    }
                    
                    grouped[key].push(photo);
                });
                
                return grouped;
            }
            
            // Get month year from date string
            function getMonthYear(dateString) {
                const date = new Date(dateString);
                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            }
            
            // Helper function to get month number from month name
            function getMonthNumber(monthName) {
                const months = {
                    'January': 0, 'February': 1, 'March': 2, 'April': 3,
                    'May': 4, 'June': 5, 'July': 6, 'August': 7,
                    'September': 8, 'October': 9, 'November': 10, 'December': 11
                };
                return months[monthName];
            }
            
            // Download image function
            function downloadImage(imageUrl, filename) {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = filename || 'family-photo.jpg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            // Format date for display
            function formatDisplayDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
            
            // Render gallery content
            function renderGallery(photos = null) {
                const photosToRender = photos || getUploadedPhotos();
                allPhotos = photosToRender;
                console.log('Rendering gallery with', photosToRender.length, 'photos');
                
                if (photosToRender.length === 0) {
                    galleryContent.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }
                
                emptyState.style.display = 'none';
                
                const groupedPhotos = groupPhotosByDate(photosToRender);
                galleryContent.innerHTML = '';
                
                // Sort months in descending order (newest first)
                const sortedMonths = Object.keys(groupedPhotos).sort((a, b) => {
                    const [monthA, yearA] = a.split(' ');
                    const [monthB, yearB] = b.split(' ');
                    return new Date(yearB, getMonthNumber(monthB)) - new Date(yearA, getMonthNumber(monthA));
                });
                
                sortedMonths.forEach(monthYear => {
                    const dateSection = document.createElement('div');
                    dateSection.className = 'date-section';
                    dateSection.innerHTML = `<h2 class="date-heading">${monthYear}</h2>`;
                    
                    const galleryGrid = document.createElement('div');
                    galleryGrid.className = 'gallery-grid';
                    
                    // Sort photos within each month (newest first)
                    groupedPhotos[monthYear].sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    groupedPhotos[monthYear].forEach(photo => {
                        const galleryItem = document.createElement('div');
                        galleryItem.className = 'gallery-item';
                        galleryItem.setAttribute('data-category', photo.category);
                        galleryItem.setAttribute('data-id', photo.id);
                        
                        galleryItem.innerHTML = `
                            <img src="${photo.imageData}" alt="${photo.title}" onerror="this.src='https://images.unsplash.com/photo-1541336032412-2048a678540d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                            <div class="gallery-actions">
                                <button class="action-btn download-btn" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="action-btn edit-btn" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="gallery-overlay">
                                <h3 class="gallery-title">${photo.title}</h3>
                                <p class="gallery-date">${photo.displayDate}</p>
                                ${photo.description ? `<p class="gallery-description">${photo.description}</p>` : ''}
                            </div>
                        `;
                        
                        galleryGrid.appendChild(galleryItem);
                    });
                    
                    dateSection.appendChild(galleryGrid);
                    galleryContent.appendChild(dateSection);
                });
                
                // Re-initialize functionality
                initializeGalleryActions();
                initializeLightbox();
            }
            
            // Initialize gallery action buttons
            function initializeGalleryActions() {
                const galleryItems = document.querySelectorAll('.gallery-item');
                
                galleryItems.forEach(item => {
                    const downloadBtn = item.querySelector('.download-btn');
                    const editBtn = item.querySelector('.edit-btn');
                    const deleteBtn = item.querySelector('.delete-btn');
                    const photoId = parseInt(item.getAttribute('data-id'));
                    
                    // Download button
                    downloadBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const photo = allPhotos.find(p => p.id === photoId);
                        if (photo) {
                            const filename = `${photo.title.replace(/\s+/g, '-')}.jpg`;
                            downloadImage(photo.imageData, filename);
                        }
                    });
                    
                    // Edit button
                    editBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        openEditModal(photoId);
                    });
                    
                    // Delete button
                    deleteBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        openDeleteModal(photoId);
                    });
                });
            }
            
            // Open edit modal
            function openEditModal(photoId) {
                const photo = allPhotos.find(p => p.id === photoId);
                if (!photo) return;
                
                document.getElementById('edit-photo-id').value = photo.id;
                document.getElementById('edit-photo-title').value = photo.title;
                document.getElementById('edit-photo-date').value = photo.date;
                document.getElementById('edit-photo-category').value = photo.category;
                document.getElementById('edit-photo-description').value = photo.description || '';
                
                editModal.style.display = 'flex';
            }
            
            // Open delete confirmation modal
            function openDeleteModal(photoId) {
                photoToDelete = photoId;
                deleteModal.style.display = 'flex';
            }
            
            // Close all modals
            function closeAllModals() {
                document.getElementById('lightbox').style.display = 'none';
                editModal.style.display = 'none';
                deleteModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            // Filter gallery by category
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    filterGallery(filter);
                });
            });
            
            // Search functionality
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                filterGallery('all', searchTerm);
            });
            
            function filterGallery(category, searchTerm = '') {
                const allPhotos = getUploadedPhotos();
                let filteredPhotos = allPhotos;
                
                // Filter by category
                if (category !== 'all') {
                    if (category === 'recent') {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        filteredPhotos = allPhotos.filter(photo => 
                            new Date(photo.uploadDate) >= thirtyDaysAgo
                        );
                    } else {
                        filteredPhotos = allPhotos.filter(photo => 
                            photo.category === category
                        );
                    }
                }
                
                // Filter by search term
                if (searchTerm) {
                    filteredPhotos = filteredPhotos.filter(photo =>
                        photo.title.toLowerCase().includes(searchTerm) ||
                        (photo.description && photo.description.toLowerCase().includes(searchTerm)) ||
                        photo.displayDate.toLowerCase().includes(searchTerm)
                    );
                }
                
                renderGallery(filteredPhotos);
            }
            
            // Lightbox functionality
            function initializeLightbox() {
                const lightbox = document.getElementById('lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                const lightboxCaption = document.getElementById('lightbox-caption');
                const lightboxClose = document.getElementById('lightbox-close');
                const lightboxPrev = document.getElementById('lightbox-prev');
                const lightboxNext = document.getElementById('lightbox-next');
                
                const galleryItems = document.querySelectorAll('.gallery-item');
                
                galleryItems.forEach((item, index) => {
                    item.addEventListener('click', function(e) {
                        if (!e.target.closest('.gallery-actions')) {
                            const photoId = parseInt(this.getAttribute('data-id'));
                            const photoIndex = allPhotos.findIndex(photo => photo.id === photoId);
                            if (photoIndex !== -1) {
                                openLightbox(photoIndex);
                            }
                        }
                    });
                });
                
                function openLightbox(index) {
                    currentImageIndex = index;
                    const photo = allPhotos[index];
                    
                    lightboxImg.src = photo.imageData;
                    lightboxCaption.innerHTML = `
                        <strong>${photo.title}</strong><br>
                        ${photo.displayDate}${photo.description ? `<br>${photo.description}` : ''}
                    `;
                    lightbox.style.display = 'flex';
                    
                    // Update action buttons for current image
                    lightboxDownload.onclick = function() {
                        const filename = `${photo.title.replace(/\s+/g, '-')}.jpg`;
                        downloadImage(photo.imageData, filename);
                    };
                    
                    lightboxEdit.onclick = function() {
                        closeAllModals();
                        openEditModal(photo.id);
                    };
                    
                    lightboxDelete.onclick = function() {
                        closeAllModals();
                        openDeleteModal(photo.id);
                    };
                    
                    document.body.style.overflow = 'hidden';
                }
                
                function closeLightbox() {
                    lightbox.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
                
                function navigateLightbox(direction) {
                    currentImageIndex += direction;
                    
                    if (currentImageIndex < 0) {
                        currentImageIndex = allPhotos.length - 1;
                    } else if (currentImageIndex >= allPhotos.length) {
                        currentImageIndex = 0;
                    }
                    
                    openLightbox(currentImageIndex);
                }
                
                lightboxClose.addEventListener('click', closeLightbox);
                lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
                lightboxNext.addEventListener('click', () => navigateLightbox(1));
                
                // Close lightbox when clicking outside the image
                lightbox.addEventListener('click', function(e) {
                    if (e.target === lightbox) {
                        closeLightbox();
                    }
                });
                
                // Keyboard navigation
                document.addEventListener('keydown', function(e) {
                    if (lightbox.style.display === 'flex') {
                        if (e.key === 'Escape') {
                            closeLightbox();
                        } else if (e.key === 'ArrowLeft') {
                            navigateLightbox(-1);
                        } else if (e.key === 'ArrowRight') {
                            navigateLightbox(1);
                        }
                    }
                });
            }
            
            // Edit form submission
            editForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const photoId = parseInt(document.getElementById('edit-photo-id').value);
                const title = document.getElementById('edit-photo-title').value.trim();
                const date = document.getElementById('edit-photo-date').value;
                const category = document.getElementById('edit-photo-category').value;
                const description = document.getElementById('edit-photo-description').value.trim();
                
                if (!title || !date || !category) {
                    alert('Please fill in all required fields');
                    return;
                }
                
                // Update photo in localStorage
                const uploadedPhotos = getUploadedPhotos();
                const photoIndex = uploadedPhotos.findIndex(p => p.id === photoId);
                
                if (photoIndex !== -1) {
                    uploadedPhotos[photoIndex] = {
                        ...uploadedPhotos[photoIndex],
                        title: title,
                        date: date,
                        displayDate: formatDisplayDate(date),
                        monthYear: getMonthYear(date),
                        category: category,
                        description: description
                    };
                    
                    if (saveUploadedPhotos(uploadedPhotos)) {
                        editModal.style.display = 'none';
                        renderGallery();
                        alert('Photo updated successfully!');
                    } else {
                        alert('Error updating photo. Please try again.');
                    }
                }
            });
            
            // Delete confirmation
            deleteConfirm.addEventListener('click', function() {
                if (!photoToDelete) return;
                
                const uploadedPhotos = getUploadedPhotos();
                const updatedPhotos = uploadedPhotos.filter(p => p.id !== photoToDelete);
                
                if (saveUploadedPhotos(updatedPhotos)) {
                    deleteModal.style.display = 'none';
                    photoToDelete = null;
                    renderGallery();
                    alert('Photo deleted successfully!');
                } else {
                    alert('Error deleting photo. Please try again.');
                }
            });
            
            // Cancel buttons
            editCancel.addEventListener('click', function() {
                editModal.style.display = 'none';
            });
            
            deleteCancel.addEventListener('click', function() {
                deleteModal.style.display = 'none';
                photoToDelete = null;
            });
            
            // Close modals when clicking outside
            editModal.addEventListener('click', function(e) {
                if (e.target === editModal) {
                    editModal.style.display = 'none';
                }
            });
            
            deleteModal.addEventListener('click', function(e) {
                if (e.target === deleteModal) {
                    deleteModal.style.display = 'none';
                    photoToDelete = null;
                }
            });
            
            // Initial render
            renderGallery();
        });