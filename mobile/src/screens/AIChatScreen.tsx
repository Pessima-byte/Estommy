import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Keyboard, useWindowDimensions } from 'react-native';
import { Send, Bot, User, Trash2, ArrowLeft, MoreVertical, Sparkles, Camera, Image as ImageIcon, X, Zap, Mic, MicOff, Volume2, UserCheck, Briefcase } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Theme';
import { geminiAPI, ChatMessage } from '../api/gemini';
import { useToast } from '../hooks/useToast';
import { statsAPI, productsAPI, customersAPI, salesAPI, profileAPI, getImageUrl } from '../api/client';
import { elevenLabsAPI } from '../api/elevenlabs';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    image?: string;
    metadata?: {
        customer?: any;
        product?: any;
    };
}

const AICustomerCard = ({ customer, onNavigate }: { customer: any, onNavigate?: (tab: string, params?: any) => void }) => {
    const avatar = (customer.avatar ? getImageUrl(customer.avatar) : null) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=c5a059&color=fff`;

    return (
        <View style={styles.aiCustomerCard}>
            <Image source={{ uri: avatar }} style={styles.aiCustomerAvatar} />
            <View style={styles.aiCustomerInfo}>
                <Text style={styles.aiCustomerName}>{customer.name}</Text>
                <Text style={styles.aiCustomerDebt}>Debt: {Number(customer.liability || customer.totalDebt || 0).toLocaleString()} Le</Text>
                <TouchableOpacity
                    style={styles.aiCustomerBtn}
                    onPress={() => onNavigate?.('customers', { customerId: customer.id })}
                >
                    <Text style={styles.aiCustomerBtnText}>PROCEED TO PROFILE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const markdownStyles = {
    body: {
        color: '#E2E8F0',
        fontSize: 15,
        lineHeight: 22,
    },
    strong: {
        color: Colors.primary,
        fontWeight: 'bold' as const,
    },
    table: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        marginVertical: 10,
    },
    tr: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row' as const,
    },
    th: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 8,
        fontWeight: 'bold' as const,
    },
    td: {
        padding: 8,
    },
};

const QUICK_PROMPTS = [
    "Who are my top customers?",
    "Show me low stock items",
    "Create a new customer (📷)",
    "Check business revenue",
    "How do I record a sale?",
    "Analyze this receipt (📷)"
];
export default function AIChatScreen({ onNavigate, chatHistory, setChatHistory }: {
    onNavigate?: (tab: string, params?: any) => void;
    chatHistory?: Message[];
    setChatHistory?: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const { showToast } = useToast();

    // Use props if provided, otherwise fallback to local for safety (though Navigation should provide them)
    const [localMessages, setLocalMessages] = useState<Message[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);

    const messages = chatHistory || localMessages;
    const setMessages = setChatHistory || setLocalMessages;

    const getGreeting = (name?: string) => {
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        const displayName = name ? name.split(' ')[0] : "Manager";
        return `${timeGreeting}, ${displayName}. I've prepared your business briefing. How can I assist with Estommy operations right now?`;
    };

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: '1',
                text: getGreeting(userProfile?.name),
                sender: 'bot',
                timestamp: new Date(),
            }]);
        }
    }, [userProfile]);

    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [businessContext, setBusinessContext] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    // Voice Chat State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<Speech.Voice | null>(null);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        fetchBusinessContext();
        loadVoices();
    }, []);

    const loadVoices = async () => {
        try {
            // Newer Expo SDKs use getAvailableVoicesAsync
            const getVoices = Speech.getAvailableVoicesAsync || (Speech as any).getVoicesAsync;
            if (!getVoices) {
                console.warn('Speech: No voice retrieval function found on this SDK version');
                return;
            }

            const voices = await getVoices();
            setAvailableVoices(voices);
            
            // Priority selection for African Accents or high-quality human voices
            const preferred = voices.find(v => v.name.toLowerCase().includes('nigeria') || v.language.includes('en-NG')) ||
                              voices.find(v => v.name.toLowerCase().includes('south africa') || v.language.includes('en-ZA')) ||
                              voices.find(v => v.name.toLowerCase().includes('samantha') && v.quality === 'Enhanced') ||
                              voices.find(v => v.quality === 'Enhanced');

            if (preferred) {
                console.log('[Voice] Activating humanized profile:', preferred.name, `(${preferred.language})`);
                setSelectedVoice(preferred);
            }
        } catch (e) {
            console.error('Failed to load voices:', e);
        }
    };

    const fetchBusinessContext = async () => {
        setIsSyncing(true);
        try {
            // Fetch Profile for personalization
            const profile = await profileAPI.get().catch(() => null);
            if (profile) setUserProfile(profile);

            console.log('AI Sync: Fetching products...');
            const products = await productsAPI.getAll({ limit: 50 }).catch(e => { console.error('Products 404:', e.message); return []; });

            console.log('AI Sync: Fetching customers...');
            const customers = await customersAPI.getAll({ limit: 500 }).catch(e => { console.error('Customers 404:', e.message); return []; });

            console.log('AI Sync: Fetching sales...');
            const sales = await salesAPI.getAll({ limit: 50 }).catch(e => { console.error('Sales 404:', e.message); return []; });

            console.log(`AI Sync: Fetched ${products.length} products, ${customers.length} customers, ${sales.length} sales.`);

            // Calculate comprehensive stats without arbitrary thresholds
            const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
            const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
            const totalInventoryValue = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);

            // Sorted lists for specific insights
            const topDebtors = [...customers]
                .sort((a, b) => {
                    const debtA = Number(a.liability) || Number(a.totalDebt) || 0;
                    const debtB = Number(b.liability) || Number(b.totalDebt) || 0;
                    return debtB - debtA;
                })
                .filter(c => (Number(c.liability) || Number(c.totalDebt) || 0) > 0)
                .slice(0, 15);

            const topSpenders = [...customers]
                .sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0))
                .slice(0, 10);

            const criticalStock = [...products]
                .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
                .slice(0, 10);

            const contextString = `
ESTOMMY BUSINESS DATA SNAPSHOT:
- Inventory: ${products.length} types, ${totalStock} units. Market Value: ${totalInventoryValue.toLocaleString()} Le.
- Low Stock (Sorted): ${criticalStock.map(p => `${p.name} (${p.stock})`).join(', ')}
- Top Debtors (ID: Name | Debt | Avatar): ${topDebtors.length > 0 ? topDebtors.map(c => `[ID:${c.id}]: ${c.name} | ${Number(c.liability) || Number(c.totalDebt) || 0} Le | Avatar: ${c.avatar || 'none'}`).join(', ') : 'No outstanding debts found.'}
- Top Customers (ID: Name | Spend | Avatar): ${topSpenders.map(c => `[ID:${c.id}]: ${c.name} | ${c.totalSpent} Le | Avatar: ${c.avatar || 'none'}`).join(', ')}
- Master Client Registry (ID: Name | Debt): ${customers.slice(0, 150).map(c => `[${c.id}]: ${c.name} | ${Number(c.liability || c.totalDebt || 0)} Le`).join(', ')}
- Financials: Total Revenue (Last 50 sales): ${totalRevenue.toLocaleString()} Le.
- Recent Activity: Last sale was ${sales[0] ? `${sales[0].amount} Le for ${sales[0].customer?.name || 'Walk-in'}` : 'No recent sales'}.
- Top Products Catalog: ${products.slice(0, 15).map(p => `${p.name} (Price: ${p.price} Le, Cost: ${p.costPrice} Le, Stock: ${p.stock})`).join(', ')}
            `.trim();

            console.log('--- AI BUSINESS CONTEXT ---');
            console.log(contextString);
            console.log('---------------------------');

            setBusinessContext(contextString);
            console.log('AI Sync: Success');
        } catch (error: any) {
            console.error('AI Sync ERROR:', error?.response?.status, error?.config?.url);
            showToast("AI data sync partially failed. Some context may be missing.", 'info');
        } finally {
            setIsSyncing(false);
        }
    };

    const pickImage = async (useCamera: boolean = false) => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        };

        const result = useCamera
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                showToast('Microphone permission required', 'error');
                return;
            }

            // Cleanup previous recording if it exists
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (e) {
                    console.warn('Cleanup error:', e);
                }
                setRecording(null);
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(newRecording);
            setIsRecording(true);
            showToast("Recording...", "info");
        } catch (err) {
            console.error('Failed to start recording', err);
            showToast("Microphone error", "error");
        }
    };

    const stopRecording = async () => {
        if (!recording || !isRecording) return;

        const r = recording;
        setRecording(null);
        setIsRecording(false);

        try {
            await r.stopAndUnloadAsync();
            const uri = r.getURI();

            if (uri) {
                const base64Audio = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
                });

                const extension = uri.split('.').pop() || 'm4a';
                const mimeType = `audio/${extension === 'm4a' ? 'mp4' : extension}`;

                const voicePrompt = inputText.trim() || "Please transcribe and respond to this voice message regarding the Estommy business.";
                handleSend(voicePrompt, { base64: base64Audio, mimeType });
            }
        } catch (err: any) {
            // Silently handle "already unloaded" or just log
            console.log('[Voice] Cleanup/Stop ignored (likely already handled)', err.message);
        }
    };


    const speak = async (text: string) => {
        if (!text) return;
        setIsSpeaking(true);

        // 1. Phonetic & Linguistic Cleanup
        let cleanSpeech = text
            .replace(/\[ACTION:.*?\]/g, '') // Remove action tags
            .replace(/[\*\_]/g, '')        // Remove markdown
            .replace(/\bLe\b/g, 'Leones')  // Say "Leones" instead of "L-E"
            .trim();

        // 2. Rhythmic Segmentation (The "Human Breath" Logic)
        // Divide text by punctuation to create natural pauses
        const phrases = cleanSpeech.split(/[,.;:!?\n]/).filter(p => p.trim().length > 0);
        
        try {
            Speech.stop();
            
            for (let i = 0; i < phrases.length; i++) {
                const phrase = phrases[i].trim();
                if (!phrase) continue;

                await new Promise<void>((resolve) => {
                    Speech.speak(phrase, {
                        voice: selectedVoice?.identifier,
                        // Using default rate and pitch for natural voice profile
                        onDone: () => resolve(),
                        onError: () => resolve(),
                    });
                });

                // Add a "breathing" pause between phrases (except at the very end)
                if (i < phrases.length - 1) {
                    await new Promise(r => setTimeout(r, 250)); 
                }
            }
        } catch (err) {
            console.error('[Speech] Rhythmic playback failed:', err);
        } finally {
            setIsSpeaking(false);
        }
    };


    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const processAIAction = async (text: string) => {
        const actionMatch = text.match(/\[ACTION:\s*(\w+)\s*(.*?)\]/);
        if (!actionMatch) return text;

        const [fullMatch, type, dataStr] = actionMatch;
        let cleanText = text.replace(fullMatch, '').trim();

        try {
            if (type === 'NAVIGATE') {
                let screenId = dataStr.trim().toLowerCase();
                let params = null;

                // Try to parse as JSON if it contains {}
                if (dataStr.includes('{')) {
                    try {
                        const parsed = JSON.parse(dataStr);
                        screenId = parsed.screen.toLowerCase();
                        params = parsed.params;
                    } catch (e) {
                        // Fallback to plain string if JSON fails
                    }
                }

                const target = screenId === 'sales history' ? 'sales' : screenId;
                console.log(`[AI Action] Navigating to ${target} with params:`, params);
                onNavigate?.(target, params);
                cleanText += `\n\n*System: Navigating to ${target.toUpperCase()}...*`;
            } else if (type === 'CREATE_CUSTOMER') {
                const customerData = JSON.parse(dataStr);
                console.log('[AI Action] Creating customer:', customerData);
                await customersAPI.create(customerData);
                cleanText += `\n\n✅ **ACTION_COMPLETE**: Customer "${customerData.name}" added to Estommy client list.`;
                showToast(`Customer ${customerData.name} created`, "success");
            } else if (type === 'CREATE_PRODUCT') {
                const productData = JSON.parse(dataStr);
                console.log('[AI Action] Creating product:', productData);
                await productsAPI.create(productData);
                cleanText += `\n\n✅ **ACTION_COMPLETE**: Product "${productData.name}" added to inventory.`;
                showToast(`Product ${productData.name} created`, "success");
            } else if (type === 'SHOW_CUSTOMER') {
                const customerData = JSON.parse(dataStr);
                // The text already contains the info, but we can signal to render a card
                // We'll attach the customer object to the message
                return { text: cleanText, customer: customerData };
            }
        } catch (err) {
            console.error('[AI Action Error]', err);
            cleanText += `\n\n❌ **ACTION_FAILED**: Execution error.`;
        }

        return cleanText;
    };

    const handleSend = async (overrideText?: string, audioData?: { base64: string; mimeType: string } | null) => {
        const text = overrideText || inputText;
        console.log('[AIChat] handleSend triggered with text:', text ? '(hidden)' : (audioData ? 'AUDIO' : 'EMPTY'));
        if ((!text.trim() && !selectedImage && !audioData) || isLoading) return;

        // Dismiss keyboard immediately on mobile
        Keyboard.dismiss();

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim() || (audioData ? "[Voice Message received]" : (selectedImage ? "[Image Analysis Request]" : "")),
            sender: 'user',
            timestamp: new Date(),
            image: selectedImage?.uri,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        const currentImageData = selectedImage ? {
            base64: selectedImage.base64!,
            mimeType: `image/${selectedImage.uri.split('.').pop() || 'jpeg'}`
        } : null;
        setSelectedImage(null);
        setIsLoading(true);
        scrollToBottom();

        try {
            const history: ChatMessage[] = messages.slice(-10).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            console.log(`[AIChat] Sending to Gemini. History: ${history.length} messages. Context Size: ${businessContext.length} chars.`);

            const responseText = await geminiAPI.chat(
                history,
                userMessage.text,
                businessContext,
                currentImageData,
                audioData
            );

            // Simulate human thinking pause if it was extremely fast
            const minThinkingTime = 800;
            const actualThinkingTime = (Date.now() + 1) - (Date.parse(userMessage.timestamp.toString()) || Date.now());
            if (actualThinkingTime < minThinkingTime) {
                await new Promise(r => setTimeout(r, minThinkingTime - actualThinkingTime));
            }

            const cleanResult = await processAIAction(responseText);
            const isObject = typeof cleanResult === 'object';
            const cleanText = isObject ? cleanResult.text : cleanResult;
            const customerData = isObject ? cleanResult.customer : undefined;

            if (isVoiceMode) {
                speak(cleanText);
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: cleanText,
                sender: 'bot',
                timestamp: new Date(),
                metadata: customerData ? { customer: customerData } : undefined,
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: Date.now().toString(),
                text: "Chat cleared. How else can I assist you?",
                sender: 'bot',
                timestamp: new Date(),
            }
        ]);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isBot = item.sender === 'bot';
        return (
            <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
                {isBot && (
                    <View style={styles.botIcon}>
                        <Bot size={14} color={Colors.primary} />
                    </View>
                )}
                <View style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}>
                    {isBot && (
                        <View style={styles.aiBadge}>
                            <Briefcase size={8} color={Colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.aiBadgeText}>ESTOMMY ASSOCIATE</Text>
                        </View>
                    )}
                    {item.image && (
                        <Image source={{ uri: item.image }} style={styles.messageImage} />
                    )}
                    <Markdown style={markdownStyles}>{item.text}</Markdown>
                    {item.metadata?.customer && (
                        <AICustomerCard customer={item.metadata.customer} onNavigate={onNavigate} />
                    )}
                    <View style={styles.messageFooter}>
                        <Text style={styles.timestamp}>
                            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isBot && <Sparkles size={10} color="rgba(255,255,255,0.2)" style={{ marginLeft: 5 }} />}
                    </View>
                </View>
                {!isBot && (
                    <View style={styles.userIconWrapper}>
                        <User size={14} color="#FFF" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0F172A', '#020617']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onNavigate?.('dashboard')} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.headerIconBox}>
                        <Sparkles size={20} color={Colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>ESTOMMY AI</Text>
                        <Text style={[styles.headerSubtitle, isSyncing && { color: '#10B981' }]}>
                            {isSyncing ? 'SYNCING_BUSINESS_DATA...' : 'CORE_LOGIC // v1.1.0'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.headerActionBtn, isVoiceMode && styles.activeVoiceBtn]}
                    onPress={() => {
                        const nextMode = !isVoiceMode;
                        setIsVoiceMode(nextMode);
                        if (!nextMode) Speech.stop();
                        showToast(nextMode ? "Voice Mode: ON" : "Voice Mode: OFF", 'info');
                    }}
                >
                    {isVoiceMode ? <Volume2 size={20} color={Colors.primary} /> : <MicOff size={20} color="#64748B" />}
                </TouchableOpacity>

                <TouchableOpacity onPress={clearChat} style={[styles.headerActionBtn, { marginLeft: 8 }]}>
                    <Trash2 size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollToBottom}
                style={{ flex: 1 }}
            />

            {/* Quick Prompts */}
            {messages.length < 3 && !isLoading && (
                <View style={styles.quickPromptsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                        {QUICK_PROMPTS.map((prompt, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.promptChip}
                                onPress={() => handleSend(prompt.replace(" (📷)", ""))}
                            >
                                <Zap size={12} color={Colors.primary} />
                                <Text style={styles.promptText}>{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? (isTablet ? 80 : 0) : 0}
            >
                <View style={[
                    styles.inputContainer,
                    { paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 20 : (isTablet ? 20 : 100)) : 20 }
                ]}>
                    {selectedImage && (
                        <View style={styles.previewContainer}>
                            <View style={styles.previewWrapper}>
                                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setSelectedImage(null)}
                                >
                                    <X size={12} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage(false)}>
                            <ImageIcon size={20} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { marginRight: 8 }]} onPress={() => pickImage(true)}>
                            <Camera size={20} color="#64748B" />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { maxHeight: 100 }]}
                            placeholder="Ask Estommy AI..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />

                        {/* Mic Button - Hold to Speak */}
                        <TouchableOpacity
                            style={[styles.micBtn, isRecording && styles.recordingMicBtn]}
                            onLongPress={startRecording}
                            onPressOut={stopRecording}
                            delayLongPress={50}
                        >
                            {isRecording ? (
                                <View style={styles.pulseContainer}>
                                    <Mic size={22} color={Colors.primary} />
                                </View>
                            ) : (
                                <Mic size={22} color="#64748B" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleSend()}
                            style={[styles.sendBtn, (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled]}
                            disabled={(!inputText.trim() && !selectedImage) || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Send size={20} color="#000" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        gap: 12,
    },
    headerIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: Colors.primary,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
        opacity: 0.6,
    },
    moreBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
        gap: 10,
    },
    botRow: {
        justifyContent: 'flex-start',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    aiBadgeText: {
        color: Colors.primary,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    botIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    userIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    botIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    userIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 15,
        borderRadius: 20,
    },
    botBubble: {
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    userBubble: {
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        borderBottomRightRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    timestamp: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    messageImage: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 12,
        marginBottom: 10,
    },
    userText: {
        color: '#FFF',
        fontSize: 15,
        lineHeight: 22,
    },
    quickPromptsContainer: {
        paddingVertical: 10,
    },
    promptChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    promptText: {
        color: '#CBD5E1',
        fontSize: 12,
        fontWeight: '600',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#020617',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    previewContainer: {
        paddingTop: 15,
        paddingBottom: 5,
    },
    previewWrapper: {
        width: 60,
        height: 60,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    sendBtnDisabled: {
        backgroundColor: '#1E293B',
        opacity: 0.5,
    },
    aiCustomerCard: {
        marginTop: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        gap: 12,
        width: '100%',
    },
    aiCustomerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2A2A35',
    },
    aiCustomerInfo: {
        flex: 1,
    },
    aiCustomerName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 2,
    },
    aiCustomerDebt: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
    },
    aiCustomerBtn: {
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
        alignSelf: 'flex-start',
    },
    aiCustomerBtnText: {
        color: Colors.primary,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    micBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    recordingMicBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    pulseContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeVoiceBtn: {
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
});
