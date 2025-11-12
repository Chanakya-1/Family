 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const loginModal = document.getElementById('login-modal');
            const loginForm = document.getElementById('login-form');
            const chatContainer = document.getElementById('chat-container');
            const messagesContainer = document.getElementById('messages-container');
            const messageInput = document.getElementById('message-input');
            const sendBtn = document.getElementById('send-btn');
            const leaveBtn = document.getElementById('leave-btn');
            const onlineCount = document.getElementById('online-count');
            const currentUser = document.getElementById('current-user');
            const typingIndicator = document.getElementById('typing-indicator');
            const typingUser = document.getElementById('typing-user');

            // Chat state
            let currentUserName = '';
            let messages = [];
            let onlineUsers = new Set();
            let typingTimeout = null;
            let isTyping = false;

            // Initialize
            function init() {
                // Check if user was already logged in (in same session)
                const savedUser = sessionStorage.getItem('familyChatUser');
                if (savedUser) {
                    joinChat(savedUser);
                } else {
                    loginModal.style.display = 'flex';
                }

                // Load any existing messages from session storage
                const savedMessages = sessionStorage.getItem('familyChatMessages');
                if (savedMessages) {
                    messages = JSON.parse(savedMessages);
                    renderMessages();
                }

                // Update online users count
                updateOnlineUsers();
            }

            // Login form submission
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const userName = document.getElementById('user-name').value.trim();
                
                if (userName) {
                    joinChat(userName);
                }
            });

            // Join chat function
            function joinChat(userName) {
                currentUserName = userName;
                sessionStorage.setItem('familyChatUser', userName);
                
                // Add user to online users
                onlineUsers.add(userName);
                sessionStorage.setItem('familyChatOnlineUsers', JSON.stringify(Array.from(onlineUsers)));
                
                // Update UI
                loginModal.style.display = 'none';
                chatContainer.style.display = 'flex';
                currentUser.textContent = userName;
                messageInput.disabled = false;
                sendBtn.disabled = false;
                
                // Add join message
                addSystemMessage(`${userName} joined the chat`);
                
                // Update online count
                updateOnlineUsers();
                
                // Focus on message input
                messageInput.focus();
            }

            // Send message
            function sendMessage() {
                const messageText = messageInput.value.trim();
                
                if (messageText && currentUserName) {
                    const message = {
                        id: Date.now(),
                        sender: currentUserName,
                        text: messageText,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    
                    messages.push(message);
                    sessionStorage.setItem('familyChatMessages', JSON.stringify(messages));
                    
                    renderMessages();
                    messageInput.value = '';
                    
                    // Scroll to bottom
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    
                    // Stop typing indicator
                    stopTyping();
                }
            }

            // Message input events
            messageInput.addEventListener('input', function() {
                if (!isTyping) {
                    isTyping = true;
                    // In a real app, you'd send typing start to other users
                }
                
                // Clear existing timeout
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                
                // Set new timeout
                typingTimeout = setTimeout(stopTyping, 1000);
            });

            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });

            sendBtn.addEventListener('click', sendMessage);

            // Stop typing function
            function stopTyping() {
                isTyping = false;
                typingIndicator.style.display = 'none';
            }

            // Leave chat
            leaveBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to leave the chat? All messages will be lost.')) {
                    // Remove user from online users
                    onlineUsers.delete(currentUserName);
                    sessionStorage.setItem('familyChatOnlineUsers', JSON.stringify(Array.from(onlineUsers)));
                    
                    // Add leave message
                    addSystemMessage(`${currentUserName} left the chat`);
                    
                    // Clear session storage
                    sessionStorage.removeItem('familyChatUser');
                    sessionStorage.removeItem('familyChatMessages');
                    sessionStorage.removeItem('familyChatOnlineUsers');
                    
                    // Reset UI
                    loginModal.style.display = 'flex';
                    chatContainer.style.display = 'none';
                    messages = [];
                    currentUserName = '';
                    
                    // Clear messages container
                    messagesContainer.innerHTML = `
                        <div class="empty-chat">
                            <i class="fas fa-comments"></i>
                            <h3>No messages yet</h3>
                            <p>Start the conversation with your family!</p>
                        </div>
                    `;
                }
            });

            // Add system message
            function addSystemMessage(text) {
                const systemMessage = {
                    id: Date.now(),
                    type: 'system',
                    text: text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                
                messages.push(systemMessage);
                sessionStorage.setItem('familyChatMessages', JSON.stringify(messages));
                renderMessages();
            }

            // Render messages
            function renderMessages() {
                if (messages.length === 0) {
                    messagesContainer.innerHTML = `
                        <div class="empty-chat">
                            <i class="fas fa-comments"></i>
                            <h3>No messages yet</h3>
                            <p>Start the conversation with your family!</p>
                        </div>
                    `;
                    return;
                }

                messagesContainer.innerHTML = '';
                
                messages.forEach(message => {
                    const messageDiv = document.createElement('div');
                    
                    if (message.type === 'system') {
                        messageDiv.className = 'message message-system';
                        messageDiv.innerHTML = `
                            <div class="message-text">${message.text}</div>
                            <div class="message-time">${message.timestamp}</div>
                        `;
                    } else {
                        const isOwnMessage = message.sender === currentUserName;
                        messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
                        messageDiv.innerHTML = `
                            <div class="message-header">
                                <span class="message-sender">${message.sender}</span>
                                <span class="message-time">${message.timestamp}</span>
                            </div>
                            <div class="message-text">${message.text}</div>
                        `;
                    }
                    
                    messagesContainer.appendChild(messageDiv);
                });
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Update online users count
            function updateOnlineUsers() {
                const savedUsers = sessionStorage.getItem('familyChatOnlineUsers');
                if (savedUsers) {
                    onlineUsers = new Set(JSON.parse(savedUsers));
                }
                
                const count = onlineUsers.size;
                onlineCount.textContent = `${count} ${count === 1 ? 'person' : 'people'} online`;
            }

            // Simulate other users (for demo purposes)
            function simulateOtherUsers() {
                // In a real application, this would be handled by a server
                // For demo, we'll simulate some activity
                setTimeout(() => {
                    if (messages.length === 0 && currentUserName) {
                        const demoMessages = [
                            "Hey everyone! How's it going?",
                            "Anyone seen the latest family photos?",
                            "Don't forget about the family dinner this weekend!",
                            "I just uploaded some new vacation photos!",
                            "Can't wait to see you all at the reunion!"
                        ];
                        
                        const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
                        const demoUser = ["Mom", "Dad", "Sister", "Brother", "Grandma"][Math.floor(Math.random() * 5)];
                        
                        if (!onlineUsers.has(demoUser)) {
                            onlineUsers.add(demoUser);
                            sessionStorage.setItem('familyChatOnlineUsers', JSON.stringify(Array.from(onlineUsers)));
                            updateOnlineUsers();
                        }
                        
                        const message = {
                            id: Date.now(),
                            sender: demoUser,
                            text: randomMessage,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        
                        messages.push(message);
                        sessionStorage.setItem('familyChatMessages', JSON.stringify(messages));
                        renderMessages();
                    }
                }, 3000);
            }

            // Initialize the chat
            init();
            simulateOtherUsers();

            // Update online users periodically
            setInterval(updateOnlineUsers, 5000);
        });