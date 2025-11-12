document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const fileInput = document.getElementById('file-input');
            const uploadArea = document.getElementById('upload-area');
            const selectedFiles = document.getElementById('selected-files');
            const fileList = document.getElementById('file-list');
            const fileCount = document.getElementById('file-count');
            const previewImage = document.getElementById('preview-image');
            const previewPlaceholder = document.getElementById('preview-placeholder');
            const fileName = document.getElementById('file-name');
            const fileSize = document.getElementById('file-size');
            const fileRemove = document.getElementById('file-remove');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const previewCounter = document.getElementById('preview-counter');
            const submitBtn = document.getElementById('submit-btn');
            const uploadForm = document.getElementById('upload-form');
            const successMessage = document.getElementById('success-message');
            const successText = document.getElementById('success-text');
            const errorMessage = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            const progressContainer = document.getElementById('progress-container');
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            const batchProgress = document.getElementById('batch-progress');
            const batchProgressFill = document.getElementById('batch-progress-fill');
            const batchProgressText = document.getElementById('batch-progress-text');
            const recentUploadsGrid = document.getElementById('recent-uploads-grid');
            
            let selectedFilesArray = [];
            let currentPreviewIndex = 0;
            let compressedImages = [];
            
            // Initialize or get uploaded photos from localStorage
            function getUploadedPhotos() {
                try {
                    const photos = localStorage.getItem('familyPortfolioPhotos');
                    return photos ? JSON.parse(photos) : [];
                } catch (e) {
                    console.error('Error reading from localStorage:', e);
                    return [];
                }
            }
            
            // Save uploaded photos to localStorage
            function saveUploadedPhotos(photos) {
                try {
                    // Check if we're approaching localStorage limit
                    const dataString = JSON.stringify(photos);
                    if (dataString.length > 4000000) {
                        // Remove oldest photos if we're approaching the limit
                        while (dataString.length > 3500000 && photos.length > 1) {
                            photos.shift();
                        }
                    }
                    
                    localStorage.setItem('familyPortfolioPhotos', JSON.stringify(photos));
                    console.log('Photos saved to localStorage:', photos.length);
                    return true;
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                    if (e.name === 'QuotaExceededError') {
                        const photos = getUploadedPhotos();
                        if (photos.length > 1) {
                            photos.shift();
                            return saveUploadedPhotos(photos);
                        }
                    }
                    return false;
                }
            }
            
            // Compress image to reduce size
            function compressImage(imageData, maxWidth = 800, maxHeight = 800, quality = 0.7) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > maxWidth) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = Math.round((width * maxHeight) / height);
                                height = maxHeight;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const compressedData = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressedData);
                    };
                    img.src = imageData;
                });
            }
            
            // Populate recent uploads
            function populateRecentUploads() {
                const uploadedPhotos = getUploadedPhotos();
                recentUploadsGrid.innerHTML = '';
                
                if (uploadedPhotos.length === 0) {
                    recentUploadsGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #ccc;">No photos uploaded yet. Upload your first photo!</p>';
                    return;
                }
                
                const recentPhotos = uploadedPhotos.slice(-4).reverse();
                
                recentPhotos.forEach(upload => {
                    const uploadItem = document.createElement('div');
                    uploadItem.className = 'upload-item';
                    
                    uploadItem.innerHTML = `
                        <img src="${upload.imageData}" alt="${upload.title}" onerror="this.src='https://images.unsplash.com/photo-1541336032412-2048a678540d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                        <div class="upload-overlay">
                            <div class="upload-title">${upload.title}</div>
                            <div class="upload-date">${upload.displayDate}</div>
                        </div>
                    `;
                    
                    recentUploadsGrid.appendChild(uploadItem);
                });
            }
            
            // Initialize recent uploads
            populateRecentUploads();
            
            // File input click event
            uploadArea.addEventListener('click', function() {
                fileInput.click();
            });
            
            // Drag and drop events
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', function() {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length) {
                    handleFileSelect(Array.from(e.dataTransfer.files));
                }
            });
            
            // File input change event
            fileInput.addEventListener('change', function() {
                if (this.files.length) {
                    handleFileSelect(Array.from(this.files));
                }
            });
            
            // Handle file selection
            function handleFileSelect(files) {
                // Filter out non-image files
                const imageFiles = files.filter(file => file.type.match('image.*'));
                
                if (imageFiles.length === 0) {
                    showError('Please select image files (JPEG, PNG, or GIF)');
                    return;
                }
                
                // Check if adding these files would exceed the limit
                const totalFiles = selectedFilesArray.length + imageFiles.length;
                if (totalFiles > 30) {
                    showError(`You can only select up to 30 files. You already have ${selectedFilesArray.length} files selected.`);
                    return;
                }
                
                // Check file sizes
                const oversizedFiles = imageFiles.filter(file => file.size > 2 * 1024 * 1024);
                if (oversizedFiles.length > 0) {
                    showError(`${oversizedFiles.length} file(s) exceed 2MB limit. Please choose smaller images.`);
                    return;
                }
                
                // Add files to selection
                imageFiles.forEach(file => {
                    if (selectedFilesArray.length < 30) {
                        selectedFilesArray.push(file);
                    }
                });
                
                updateFileList();
                processSelectedFiles();
            }
            
            // Update file list display
            function updateFileList() {
                fileList.innerHTML = '';
                fileCount.textContent = selectedFilesArray.length;
                
                if (selectedFilesArray.length > 0) {
                    selectedFiles.style.display = 'block';
                    
                    selectedFilesArray.forEach((file, index) => {
                        const fileItem = document.createElement('li');
                        fileItem.className = 'file-item';
                        fileItem.innerHTML = `
                            <span class="file-item-name">${file.name}</span>
                            <span class="file-item-size">${formatFileSize(file.size)}</span>
                            <button class="file-item-remove" data-index="${index}">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        fileList.appendChild(fileItem);
                    });
                    
                    // Add event listeners to remove buttons
                    document.querySelectorAll('.file-item-remove').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const index = parseInt(this.getAttribute('data-index'));
                            removeFile(index);
                        });
                    });
                } else {
                    selectedFiles.style.display = 'none';
                }
                
                // Enable/disable submit button
                submitBtn.disabled = selectedFilesArray.length === 0;
            }
            
            // Remove file from selection
            function removeFile(index) {
                selectedFilesArray.splice(index, 1);
                compressedImages.splice(index, 1);
                updateFileList();
                
                if (selectedFilesArray.length === 0) {
                    resetPreview();
                } else {
                    // Adjust current preview index if needed
                    if (currentPreviewIndex >= selectedFilesArray.length) {
                        currentPreviewIndex = Math.max(0, selectedFilesArray.length - 1);
                    }
                    showPreview(currentPreviewIndex);
                }
            }
            
            // Process selected files for preview
            async function processSelectedFiles() {
                if (selectedFilesArray.length === 0) return;
                
                showProgress();
                progressText.textContent = 'Processing files...';
                
                // Process each file
                for (let i = 0; i < selectedFilesArray.length; i++) {
                    if (i >= compressedImages.length) {
                        updateProgress((i / selectedFilesArray.length) * 100);
                        
                        try {
                            const compressedData = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onload = async function(e) {
                                    const compressed = await compressImage(e.target.result);
                                    resolve(compressed);
                                };
                                reader.readAsDataURL(selectedFilesArray[i]);
                            });
                            
                            compressedImages[i] = compressedData;
                        } catch (error) {
                            console.error('Error processing file:', error);
                            compressedImages[i] = null;
                        }
                    }
                }
                
                updateProgress(100);
                setTimeout(() => {
                    hideProgress();
                    showPreview(0);
                }, 500);
            }
            
            // Show preview for specific file
            function showPreview(index) {
                if (selectedFilesArray.length === 0 || !compressedImages[index]) {
                    resetPreview();
                    return;
                }
                
                const file = selectedFilesArray[index];
                previewImage.src = compressedImages[index];
                previewImage.style.display = 'block';
                previewPlaceholder.style.display = 'none';
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                
                // Update navigation
                currentPreviewIndex = index;
                previewCounter.textContent = `${index + 1}/${selectedFilesArray.length}`;
                prevBtn.disabled = index === 0;
                nextBtn.disabled = index === selectedFilesArray.length - 1;
                
                // Show remove button for current file
                fileRemove.style.display = 'block';
            }
            
            // Reset preview
            function resetPreview() {
                previewImage.style.display = 'none';
                previewImage.src = '';
                previewPlaceholder.style.display = 'block';
                fileName.textContent = 'No file selected';
                fileSize.textContent = '-';
                previewCounter.textContent = '0/0';
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                fileRemove.style.display = 'none';
            }
            
            // Navigation buttons
            prevBtn.addEventListener('click', function() {
                if (currentPreviewIndex > 0) {
                    showPreview(currentPreviewIndex - 1);
                }
            });
            
            nextBtn.addEventListener('click', function() {
                if (currentPreviewIndex < selectedFilesArray.length - 1) {
                    showPreview(currentPreviewIndex + 1);
                }
            });
            
            // Remove current file button
            fileRemove.addEventListener('click', function() {
                removeFile(currentPreviewIndex);
            });
            
            // Format file size
            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' bytes';
                else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                else return (bytes / 1048576).toFixed(1) + ' MB';
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
            
            // Get month name for grouping
            function getMonthYear(dateString) {
                const date = new Date(dateString);
                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            }
            
            // Show error message
            function showError(message) {
                errorText.textContent = message;
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
            
            // Hide error message
            function hideError() {
                errorMessage.style.display = 'none';
            }
            
            // Show success message
            function showSuccess(message) {
                successText.textContent = message;
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
            }
            
            // Hide success message
            function hideSuccess() {
                successMessage.style.display = 'none';
            }
            
            // Update progress bar
            function updateProgress(percent) {
                progressBar.style.width = percent + '%';
                progressText.textContent = `Processing: ${Math.round(percent)}%`;
            }
            
            // Show progress bar
            function showProgress() {
                progressContainer.style.display = 'block';
            }
            
            // Hide progress bar
            function hideProgress() {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
                progressText.textContent = 'Processing: 0%';
            }
            
            // Update batch progress
            function updateBatchProgress(current, total) {
                const percent = (current / total) * 100;
                batchProgressFill.style.width = percent + '%';
                batchProgressText.textContent = `${current}/${total} photos uploaded`;
            }
            
            // Form submission
            uploadForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (selectedFilesArray.length === 0) {
                    showError('Please select at least one image to upload');
                    return;
                }
                
                const category = document.getElementById('photo-category').value;
                
                if (!category) {
                    showError('Please select a category');
                    return;
                }
                
                // Show progress
                submitBtn.disabled = true;
                batchProgress.style.display = 'block';
                hideError();
                
                const uploadedPhotos = getUploadedPhotos();
                let successfulUploads = 0;
                const totalFiles = selectedFilesArray.length;
                
                // Process each file
                for (let i = 0; i < selectedFilesArray.length; i++) {
                    const file = selectedFilesArray[i];
                    const compressedData = compressedImages[i];
                    
                    if (!compressedData) continue;
                    
                    try {
                        // Create photo object
                        const photoDate = new Date().toISOString().split('T')[0];
                        const newPhoto = {
                            id: Date.now() + i, // Unique ID
                            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                            date: photoDate,
                            displayDate: formatDisplayDate(photoDate),
                            monthYear: getMonthYear(photoDate),
                            category: category,
                            description: '',
                            imageData: compressedData,
                            uploadDate: new Date().toISOString()
                        };
                        
                        uploadedPhotos.push(newPhoto);
                        successfulUploads++;
                        
                        // Update progress
                        updateBatchProgress(successfulUploads, totalFiles);
                        
                        // Small delay to show progress
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        console.error('Error uploading file:', file.name, error);
                    }
                }
                
                // Save all photos
                if (saveUploadedPhotos(uploadedPhotos)) {
                    showSuccess(`Successfully uploaded ${successfulUploads} out of ${totalFiles} photos!`);
                    
                    // Reset form after 3 seconds
                    setTimeout(function() {
                        uploadForm.reset();
                        selectedFilesArray = [];
                        compressedImages = [];
                        updateFileList();
                        resetPreview();
                        submitBtn.disabled = false;
                        batchProgress.style.display = 'none';
                        
                        // Update recent uploads display
                        populateRecentUploads();
                    }, 3000);
                } else {
                    showError('Error saving photos. Storage might be full.');
                    submitBtn.disabled = false;
                    batchProgress.style.display = 'none';
                }
            });
            
            // Hide messages initially
            hideError();
            hideSuccess();
            hideProgress();
            batchProgress.style.display = 'none';
        });