
    document.addEventListener('DOMContentLoaded', () => {
        const chatWindow = document.getElementById('chat-window');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const newChatButton = document.getElementById('new-chat-button-sidebar');
        const welcomeScreen = document.getElementById('welcome-screen');
        const chatWindowContainer = document.getElementById('chat-window-container');

        const appContainer = document.getElementById('app-container');
        const sidebar = document.getElementById('sidebar');
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

        const attachFileButton = document.getElementById('attach-file-button');
        const fileInput = document.getElementById('file-input');
        const filePreviewArea = document.getElementById('file-preview-area');
        let attachedFile = null;

        // --- GANTI DENGAN API KEY ANDA ---
        const GEMINI_API_KEYS = [
            'AIzaSyAGTJ--r0XhqEln8O89HblRkNnyLxwYnsk', // Ganti dengan API Key Anda
            'AIzaSyBYhjv1GNQ_3FUcxuUNlo3CooST0omKT2w', // Ganti dengan API Key Anda
            'AIzaSyAeV4ZL9VA8QzqRTfmpmOPyEu5f_2BXjcY'  // Ganti dengan API Key Anda
        ];
        
        function getRandomApiKey() {
            if (GEMINI_API_KEYS.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * GEMINI_API_KEYS.length);
            return GEMINI_API_KEYS[randomIndex];
        }
        
        const GEMINI_MODEL_NAME = 'gemini-1.5-flash-latest';
        const BMKG_API_URL = 'https://api.siputzx.my.id/api/info/bmkg';
        const ANTARA_NEWS_API_URL = 'https://api.siputzx.my.id/api/berita/antara';
        const TIKTOK_DOWNLOAD_API_BASE_URL = 'https://api.siputzx.my.id/api/tiktok/v2?url=';
        const INITIAL_BOT_GREETING = "Halo! Saya JOJO. Ada yang bisa saya bantu hari ini?";

        function openSidebar() {
            if (appContainer && sidebar) appContainer.classList.add('sidebar-open');
        }
        function closeSidebar() {
            if (appContainer && sidebar) appContainer.classList.remove('sidebar-open');
        }

        if (hamburgerMenu) hamburgerMenu.addEventListener('click', openSidebar);
        if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
        if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);

        function getSystemInstructionText() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const dateString = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return `Kamu adalah JOJO, seorang asisten AI multimodal yang ramah, sopan, dan sangat membantu. Saat ini adalah ${dateString}, pukul ${timeString} WIB. Kamu bertugas untuk menjawab pertanyaan pengguna dengan jelas, memberikan informasi yang akurat, dan dapat menganalisis gambar serta dokumen (seperti PDF, TXT, DOC/DOCX) yang dikirimkan pengguna. Selalu gunakan bahasa Indonesia yang baik dan benar. Jika kamu tidak tahu jawabannya, katakan terus terang. Kamu juga bisa memberikan informasi gempa terkini dari BMKG, berita terbaru dari Antara, dan jika pengguna mengirimkan tautan TikTok (video atau slideshow foto), kamu dapat membantu mencarikan tautan unduhannya. Jika responsmu mengandung URL gambar, formatlah sebagai Markdown: ![deskripsi singkat](URL_gambar). Jika kamu diminta untuk memberikan kode, format kode tersebut menggunakan triple backticks, contoh: \`\`\`python\nprint("Hello, World!")\n\`\`\`. Jangan lupa untuk menyertakan penentu bahasa jika memungkinkan.`;
        }

        let conversationHistory = [];

        function showChatView() {
            if (welcomeScreen) welcomeScreen.classList.add('hidden');
            if (chatWindowContainer) {
                 chatWindowContainer.classList.add('active');
                 chatWindowContainer.style.display = 'flex';
            }
        }

        function showWelcomeView() {
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');
            if (chatWindowContainer) {
                chatWindowContainer.classList.remove('active');
                chatWindowContainer.style.display = 'none';
            }
            clearFilePreview();
        }
        
        function addMessage(content, sender, type = 'chat', isMarkdown = false) {
            showChatView();
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', `${sender}-message`);
            if (sender === 'bot' && (type === 'data' || type === 'error')) {
                messageElement.classList.add('data-message');
                 if (type === 'error') messageElement.classList.add('error');
            }


            const messageContentContainer = document.createElement('div');
            messageContentContainer.className = 'message-content-container';

            let textToCopy = '';

            if (typeof content === 'object' && content.imageUrl) {
                if (content.text) {
                    const textParagraph = document.createElement('p');
                    textParagraph.textContent = content.text;
                    messageContentContainer.appendChild(textParagraph);
                    textToCopy = content.text;
                }
                const imgElement = document.createElement('img');
                imgElement.src = content.imageUrl;
                imgElement.alt = content.text || "Gambar dari pengguna";
                messageContentContainer.appendChild(imgElement);
                if (!textToCopy && content.text) textToCopy = content.text; 
                else if (!textToCopy) textToCopy = "Gambar";
            } else { 
                const paragraph = document.createElement('p');
                textToCopy = content; 
                
                if (isMarkdown && sender === 'bot') {
                    let htmlContent = content;

                    htmlContent = htmlContent.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
                        const codeId = `code-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
                        const languageClass = lang ? `language-${lang.toLowerCase()}` : '';
                        const sanitizedCode = code; 
                        return `
                            <div class="code-block-wrapper">
                                <button class="copy-code-btn" data-clipboard-target="#${codeId}" title="Salin kode">
                                    <i class="fas fa-copy"></i> Salin
                                </button>
                                <pre><code id="${codeId}" class="${languageClass}">${sanitizedCode.replace(/</g, "<").replace(/>/g, ">")}</code></pre>
                            </div>
                        `;
                    });
                    
                    htmlContent = htmlContent.replace(/\n/g, '<br>'); 
                    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
                    htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
                    htmlContent = htmlContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
                        if (match.includes('class="code-block-wrapper"')) return match; 
                        return `<img src="${url}" alt="${alt || 'Gambar dari JOJO'}" style="max-width:100%; border-radius:8px; margin-top:5px;">`;
                    });
                    htmlContent = htmlContent.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                         if (match.includes('class="code-block-wrapper"')) return match; 
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                    });

                    paragraph.innerHTML = htmlContent;
                } else {
                    paragraph.textContent = content;
                }
                messageContentContainer.appendChild(paragraph);
            }
            
            messageElement.appendChild(messageContentContainer);

            if (textToCopy && typeof textToCopy === 'string' && textToCopy.trim() !== '') {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-message-btn';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.title = 'Salin pesan';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(textToCopy.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')) 
                        .then(() => {
                            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                            setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 1500);
                        })
                        .catch(err => console.error('Gagal menyalin pesan:', err));
                });
                messageElement.appendChild(copyBtn);
            }
            
            chatWindow.appendChild(messageElement);

            messageElement.querySelectorAll('.copy-code-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const codeElementId = button.getAttribute('data-clipboard-target');
                    const codeElement = document.querySelector(codeElementId);
                    if (codeElement) {
                        navigator.clipboard.writeText(codeElement.textContent)
                            .then(() => {
                                button.innerHTML = '<i class="fas fa-check"></i> Disalin!';
                                setTimeout(() => { button.innerHTML = '<i class="fas fa-copy"></i> Salin'; }, 2000);
                            })
                            .catch(err => {
                                console.error('Gagal menyalin kode:', err);
                                button.textContent = 'Gagal!';
                                setTimeout(() => { button.innerHTML = '<i class="fas fa-copy"></i> Salin'; }, 2000);
                            });
                    }
                });
            });

            chatWindow.scrollTop = chatWindow.scrollHeight;
            return messageElement;
        }

        function startNewChat() {
            chatWindow.innerHTML = '';
            conversationHistory = [];
            messageInput.value = '';
            messageInput.focus();
            closeSidebar();
            console.log("New chat started.");
            getGeminiResponse(true); 
        }

        attachFileButton.addEventListener('click', () => {
            fileInput.click(); 
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                attachedFile = file;
                displayFilePreview(file);
            }
            fileInput.value = null; 
        });

        function displayFilePreview(file) {
            const mainChatInputArea = document.querySelector('.main-chat-input-area');
            filePreviewArea.innerHTML = ''; 
            filePreviewArea.style.display = 'block'; 
            
            if (!mainChatInputArea.contains(filePreviewArea)) {
                 mainChatInputArea.insertBefore(filePreviewArea, mainChatInputArea.firstChild);
            }
            
            const previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview-container';

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    previewContainer.appendChild(img);
                }
                reader.readAsDataURL(file);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-file-alt'; 
                icon.style.marginRight = '8px';
                previewContainer.appendChild(icon);
            }

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = file.name;
            previewContainer.appendChild(fileNameSpan);

            const removeButton = document.createElement('button');
            removeButton.innerHTML = '×';
            removeButton.title = 'Hapus file';
            removeButton.onclick = clearFilePreview;
            previewContainer.appendChild(removeButton);
            
            filePreviewArea.appendChild(previewContainer);
        }

        function clearFilePreview() {
            attachedFile = null;
            filePreviewArea.innerHTML = '';
            filePreviewArea.style.display = 'none';
        }

        async function readFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        }

        async function fetchExternalAPI(url, serviceName) {
            const typingIndicator = addMessage(`JOJO sedang mengambil data ${serviceName}...`, "bot", "data");
            typingIndicator.classList.add("typing");
            try {
                const response = await fetch(url);
                if (typingIndicator.parentNode) chatWindow.removeChild(typingIndicator);

                if (!response.ok) {
                    let errorDetail = `Status: ${response.status}`;
                    try {
                        const errorJson = await response.json();
                        if (errorJson.message) errorDetail += ` - Pesan: ${errorJson.message}`;
                    } catch (e) { /* ignore if error response is not json */ }
                    addMessage(`Maaf, gagal mengambil data dari ${serviceName}. ${errorDetail}`, "bot", "error");
                    return null;
                }

                const apiResponse = await response.json();

                if (apiResponse.success === true && apiResponse.data) { // siputzx typical success
                    return apiResponse.data;
                } else if (apiResponse.status === true && apiResponse.data) { // other siputzx success
                    if (serviceName === "Berita Antara" && Array.isArray(apiResponse.data)) return apiResponse.data;
                    if (serviceName === "BMKG" && typeof apiResponse.data === 'object' && apiResponse.data.auto) return apiResponse.data;
                    return apiResponse.data;
                } else if (apiResponse.success === true || apiResponse.status === true) {
                     return apiResponse; // Return whole object if success is true but no 'data' field
                }

                addMessage(`Format respons dari ${serviceName} tidak dikenali atau tidak berhasil.`, "bot", "error");
                console.warn(`Unknown or unsuccessful response structure from ${serviceName}:`, apiResponse);
                return null;

            } catch (error) {
                 if (typingIndicator.parentNode && typingIndicator.parentNode === chatWindow) {
                     chatWindow.removeChild(typingIndicator);
                 }
                addMessage(`Terjadi kesalahan saat menghubungi ${serviceName}: ${error.message}`, "bot", "error");
                console.error(`Error fetching ${serviceName}:`, error);
                return null;
            }
        }

        async function handleBMKGRequest() { 
            const bmkgData = await fetchExternalAPI(BMKG_API_URL, "BMKG");
            if (bmkgData && bmkgData.auto?.Infogempa?.gempa) {
                const gempaInfo = bmkgData.auto.Infogempa.gempa;
                let bmkgMessage = `**Informasi Gempa Otomatis Terkini dari BMKG:**\n`;
                bmkgMessage += `Tanggal: ${gempaInfo.Tanggal || 'N/A'}\nJam: ${gempaInfo.Jam || 'N/A'}\nMagnitude: ${gempaInfo.Magnitude || 'N/A'}\nKedalaman: ${gempaInfo.Kedalaman || 'N/A'}\nWilayah: ${gempaInfo.Wilayah || 'N/A'}\n`;
                if (gempaInfo.Potensi) bmkgMessage += `Potensi: ${gempaInfo.Potensi}\n`;
                if (gempaInfo.Dirasakan) bmkgMessage += `Dirasakan: ${gempaInfo.Dirasakan}\n`;
                if (gempaInfo.Shakemap) {
                    const shakemapBaseUrl = "https://data.bmkg.go.id/DataMKG/TEWS/";
                    bmkgMessage += `[Peta Guncangan](${shakemapBaseUrl}${gempaInfo.Shakemap})\n`;
                }
                addMessage(bmkgMessage, 'bot', 'data', true);
                conversationHistory.push({ role: 'model', parts: [{ text: `Saya telah memberikan informasi gempa otomatis terkini.` }] });
                if (bmkgData.terkini?.Infogempa?.gempa && Array.isArray(bmkgData.terkini.Infogempa.gempa)) {
                    let terkiniMessage = "\n**Daftar Gempa Terkini (M >= 5.0) Lainnya:**\n";
                    bmkgData.terkini.Infogempa.gempa.slice(0, 3).forEach((g, index) => {
                        terkiniMessage += `${index + 1}. ${g.Tanggal}, ${g.Jam} - Mag: ${g.Magnitude} - ${g.Wilayah}\n`;
                    });
                    addMessage(terkiniMessage, 'bot', 'data', true);
                }
            } else {
                addMessage("Tidak ditemukan data gempa dari BMKG saat ini atau formatnya tidak sesuai.", "bot", "error");
                if (bmkgData) console.log("Struktur data BMKG yang diterima (setelah parsing):", bmkgData);
            }
        }
        async function handleAntaraNewsRequest() {
            const newsArray = await fetchExternalAPI(ANTARA_NEWS_API_URL, "Berita Antara");
            if (newsArray?.length > 0) {
                let newsMessage = "**Berita Terbaru dari Antara News:**\n\n";
                newsArray.slice(0, 5).forEach((item, index) => {
                    newsMessage += `${index + 1}. **${item.title}**\n`;
                    if (item.category) newsMessage += `   *Kategori: ${item.category}*\n`;
                    if (item.link) newsMessage += `   [Baca selengkapnya](${item.link})\n`;
                    newsMessage += "\n";
                });
                addMessage(newsMessage, 'bot', 'data', true);
                conversationHistory.push({ role: 'model', parts: [{ text: `Saya telah memberikan beberapa berita terbaru dari Antara.` }] });
            } else {
                addMessage("Tidak ditemukan berita dari Antara News saat ini atau formatnya tidak sesuai.", "bot", "error");
                if (newsArray) console.log("Respons Antara News (setelah parsing):", newsArray);
            }
        }

        async function handleTikTokDownloadRequest(tiktokUrl) {
            const fullApiUrl = `${TIKTOK_DOWNLOAD_API_BASE_URL}${encodeURIComponent(tiktokUrl)}`;
            const tiktokData = await fetchExternalAPI(fullApiUrl, "TikTok Content Downloader");

            if (tiktokData && tiktokData.download) {
                let contentMessage = "";
                let foundMedia = false;

                if (tiktokData.metadata) {
                    if (tiktokData.metadata.title && tiktokData.metadata.title.trim() !== "") {
                        contentMessage += `Judul: ${tiktokData.metadata.title}\n`;
                    }
                    if (tiktokData.metadata.description && tiktokData.metadata.description.trim() !== "") {
                        contentMessage += `Deskripsi: ${tiktokData.metadata.description}\n`;
                    }
                    if (tiktokData.metadata.stats) {
                        contentMessage += `Suka: ${tiktokData.metadata.stats.likeCount || 0}, Putar/Lihat: ${tiktokData.metadata.stats.playCount || 0}, Komentar: ${tiktokData.metadata.stats.commentCount || 0}, Bagikan: ${tiktokData.metadata.stats.shareCount || 0}\n`;
                    }
                    if (tiktokData.metadata.hashtags && tiktokData.metadata.hashtags.length > 0) {
                        contentMessage += `Hashtags: ${tiktokData.metadata.hashtags.join(', ')}\n`;
                    }
                    contentMessage += "\n"; 
                }


                if (tiktokData.download.video && Array.isArray(tiktokData.download.video) && tiktokData.download.video.length > 0) {
                    contentMessage = `**Video TikTok Ditemukan!**\n\n` + contentMessage; 
                    contentMessage += `**Tautan Unduhan Video:**\n`;
                    tiktokData.download.video.forEach((videoLink, index) => {
                        contentMessage += `${index + 1}. [Unduh Video (Opsi ${index + 1})](${videoLink})\n`;
                    });
                    foundMedia = true;
                }
                else if (tiktokData.download.photo && Array.isArray(tiktokData.download.photo) && tiktokData.download.photo.length > 0) {
                    contentMessage = `**Slideshow Foto TikTok Ditemukan!**\n\n` + contentMessage; 
                    contentMessage += `**Tautan Unduhan Foto:**\n`;
                    tiktokData.download.photo.forEach((photoLink, index) => {
                        contentMessage += `${index + 1}. [Unduh Foto ${index + 1}](${photoLink})\n`;
                    });
                    foundMedia = true;
                }

                if (tiktokData.download.audio && foundMedia) { 
                    contentMessage += `\n**Tautan Unduhan Audio (MP3):**\n`;
                    contentMessage += `[Unduh Audio](${tiktokData.download.audio})\n`;
                }

                if (foundMedia) {
                    addMessage(contentMessage, 'bot', 'data', true);
                    conversationHistory.push({ role: 'model', parts: [{ text: `Saya telah memberikan tautan unduhan untuk konten TikTok.` }] });
                } else {
                    let errorMessage = "Maaf, tidak ada video atau foto yang ditemukan untuk tautan TikTok ini.";
                    if (tiktokData && typeof tiktokData === 'object' && tiktokData.message) {
                        errorMessage += ` Pesan dari API: ${tiktokData.message}`;
                    }
                    addMessage(errorMessage, "bot", "error");
                    console.warn("Struktur data TikTok yang diterima tidak mengandung video atau foto yang valid:", tiktokData);
                }

            } else { 
                let errorMessage = "Maaf, gagal mendapatkan tautan unduhan konten TikTok.";
                if (tiktokData && typeof tiktokData === 'object' && tiktokData.message) {
                    errorMessage += ` Pesan dari API: ${tiktokData.message}`;
                } else if (tiktokData === null) {
                    errorMessage = "Tidak dapat menghubungi layanan unduh TikTok saat ini.";
                } else {
                    errorMessage += " Format respons tidak sesuai.";
                    console.warn("Struktur data TikTok yang diterima (setelah parsing):", tiktokData);
                }
                addMessage(errorMessage, "bot", "error");
            }
        }


        async function getGeminiResponse(isInitialGreeting = false) {
            if (conversationHistory.length === 0 && !isInitialGreeting) {
                showWelcomeView();
                return;
            }

            const currentApiKey = getRandomApiKey();
            if (!currentApiKey) {
                console.error("Tidak ada API Key Gemini yang valid tersedia.");
                addMessage("Maaf, JOJO tidak dapat dihubungi saat ini karena masalah konfigurasi API Key.", 'bot', 'error');
                return;
            }
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${currentApiKey}`;

            const typingIndicator = addMessage("JOJO sedang berpikir...", "bot");
            typingIndicator.classList.add("typing");
            const currentSystemInstruction = getSystemInstructionText();
            
            let currentConversationPayload = [...conversationHistory];
            
            if (isInitialGreeting) { 
                if (typingIndicator.parentNode) chatWindow.removeChild(typingIndicator); 
                addMessage(INITIAL_BOT_GREETING, 'bot', 'chat', true);
                conversationHistory.push({ role: 'model', parts: [{ text: INITIAL_BOT_GREETING }] });
                return;
            }
            
            const payload = {
                contents: currentConversationPayload,
                systemInstruction: { parts: [{ text: currentSystemInstruction }] },
                generationConfig: { "temperature": 0.7, "maxOutputTokens": 2048 } 
            };

            try {
                const response = await fetch(GEMINI_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (typingIndicator.parentNode) chatWindow.removeChild(typingIndicator);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    let errorMessageText = `Error: ${response.status} ${response.statusText}`;
                    if (errorData?.error?.message) errorMessageText += ` - ${errorData.error.message}`;
                    console.error('Gemini API Error:', errorData || errorMessageText);
                    addMessage(`Maaf, JOJO sedang mengalami kendala: ${errorMessageText}`, 'bot', 'error');
                    return;
                }

                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const botText = data.candidates[0].content.parts[0].text;
                    addMessage(botText, 'bot', 'chat', true); 
                    conversationHistory.push({ role: 'model', parts: [{ text: botText }] });
                } else if (data.promptFeedback?.blockReason) {
                    addMessage(`Permintaan Anda tidak dapat diproses oleh JOJO karena: ${data.promptFeedback.blockReason}.`, 'bot', 'error');
                } else {
                    console.error('Unexpected Gemini API response:', data);
                    addMessage('Maaf, JOJO tidak memberikan respons yang valid.', 'bot', 'error');
                }
            } catch (error) {
                if (typingIndicator.parentNode) chatWindow.removeChild(typingIndicator);
                console.error('Fetch Gemini Error:', error);
                addMessage(`Masalah koneksi dengan JOJO: ${error.message}`, 'bot', 'error');
            }
        }

        async function handleSendMessage() {
            const messageText = messageInput.value.trim();
            
            if (!messageText && !attachedFile) return;

            showChatView(); 
            let userMessageParts = [];
            let displayContent = messageText; 

            let wasFileAttachedBeforeProcessing = !!attachedFile; 

            if (attachedFile) {
                try {
                    const base64Data = await readFileAsBase64(attachedFile);
                    userMessageParts.push({
                        inlineData: {
                            mimeType: attachedFile.type,
                            data: base64Data
                        }
                    });
                    if (attachedFile.type.startsWith('image/')) {
                        displayContent = { 
                            text: messageText,
                            imageUrl: URL.createObjectURL(attachedFile)
                        };
                    } else { 
                        displayContent = messageText ? `${messageText} (File: ${attachedFile.name})` : `(File: ${attachedFile.name})`;
                    }
                } catch (error) {
                    console.error("Error reading file:", error);
                    addMessage("Gagal memproses file. Silakan coba lagi.", 'bot', 'error');
                    clearFilePreview();
                    return;
                }
            }

            if (messageText) {
                userMessageParts.push({ text: messageText });
            }

            if (userMessageParts.length > 0) {
                 addMessage(displayContent, 'user');
                 conversationHistory.push({ role: 'user', parts: userMessageParts });
            }
            
            messageInput.value = '';
            clearFilePreview(); 

            const lowerCaseMessage = messageText.toLowerCase();
            const tiktokUrlMatch = messageText.match(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[\w\/@\-\?\=\&\%\;\.]+/i);

            let commandHandled = false;
            if (!wasFileAttachedBeforeProcessing) {
                if (tiktokUrlMatch) {
                    const tiktokUrl = tiktokUrlMatch[0];
                    await handleTikTokDownloadRequest(tiktokUrl);
                    commandHandled = true;
                } else if (lowerCaseMessage.includes("gempa") || lowerCaseMessage.includes("bmkg")) {
                    await handleBMKGRequest();
                    commandHandled = true;
                } else if (lowerCaseMessage.includes("berita") || lowerCaseMessage.includes("antara")) {
                    await handleAntaraNewsRequest();
                    commandHandled = true;
                }
            }

            if (!commandHandled && userMessageParts.length > 0) { 
                await getGeminiResponse();
            }
            closeSidebar();
        }


        newChatButton.addEventListener('click', () => {
            startNewChat(); 
        });
        sendButton.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); 
                handleSendMessage();
            }
        });
        
        const hasValidKeys = GEMINI_API_KEYS && GEMINI_API_KEYS.length > 0 && 
                             GEMINI_API_KEYS.every(key => key && !key.includes('Ganti dengan API Key Anda') && key.length > 20);

        if (!hasValidKeys) {
            console.warn("Satu atau lebih API Key belum diatur dengan benar atau array API Key kosong!");
            const warningDiv = document.createElement('div');
            warningDiv.textContent = "PERHATIAN: API Key untuk Gemini belum diatur dengan benar. Fitur AI mungkin tidak berfungsi.";
            warningDiv.style.backgroundColor = "red";
            warningDiv.style.color = "white";
            warningDiv.style.textAlign = "center";
            warningDiv.style.padding = "10px";
            warningDiv.style.position = "fixed";
            warningDiv.style.bottom = "0";
            warningDiv.style.left = "0";
            warningDiv.style.width = "100%";
            warningDiv.style.zIndex = "2000";
            document.body.appendChild(warningDiv);
            sendButton.disabled = true;
            messageInput.placeholder = "Fitur AI tidak aktif karena API Key bermasalah.";
            messageInput.disabled = true;
        }

        if (conversationHistory.length === 0) {
             showWelcomeView(); 
        }
        startNewChat(); 
    });