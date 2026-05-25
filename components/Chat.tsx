'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, MessageCircle, Sparkles, Mic, MicOff, Volume2, X } from 'lucide-react';
import SiriWave from './SiriWave';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'kalam';
  timestamp: Date;
}

interface ChatProps {
  onTalkingChange?: (isTalking: boolean) => void;
}

export default function Chat({ onTalkingChange }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Greetings, my young friend. I am here to discuss science, inspiration, and the future of India with you. How can I assist you today?",
      sender: 'kalam',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentFirstMessage = useRef(false);

  // Enlightenment (Voice) Mode States
  const [isEnlightened, setIsEnlightened] = useState(false);
  const [enlightenStatus, setEnlightenStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [audioVolume, setAudioVolume] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponseText, setVoiceResponseText] = useState('');
  const [showVoiceKeyboardFallback, setShowVoiceKeyboardFallback] = useState(false);
  const [voiceKeyboardInput, setVoiceKeyboardInput] = useState('');

  // Refs for Web Audio & Speech Recognition
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const transcriptRef = useRef('');
  const errorOccurredRef = useRef(false);
  const hasTriedEnUSRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isEnlightenedRef = useRef(false);
  const retryTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clean up Web Audio / Speech Recognition on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (recognitionRef.current) {
        const rec = recognitionRef.current;
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try { rec.abort(); } catch (e) {}
      }
      if (audioRef.current) {
        const audio = audioRef.current;
        audio.onplay = null;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      }
      if (activeUtteranceRef.current) {
        const utt = activeUtteranceRef.current;
        utt.onstart = null;
        utt.onboundary = null;
        utt.onend = null;
        utt.onerror = null;
        utt.volume = 0;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.pause();
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  const startVoiceListening = async () => {
    if (!isEnlightenedRef.current) {
      console.log('startVoiceListening called but Enlightenment Mode is inactive. Aborting.');
      return;
    }
    try {
      // 1. Request mic access
      if (!micStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isEnlightenedRef.current) {
          console.log('startVoiceListening: Mic access granted but Enlightenment Mode is inactive. Stopping tracks.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        micStreamRef.current = stream;
      }

      // 2. Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceTranscript("Speech recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
        setEnlightenStatus('idle');
        return;
      }

      // Initialize AudioContext if not active
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        if (!isEnlightenedRef.current) {
          console.log('startVoiceListening: AudioContext resumed but Enlightenment Mode is inactive. Returning.');
          return;
        }
      }

      // Initialize Analyser once
      if (!analyserRef.current) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
      }

      // Setup microphone source
      if (!micSourceNodeRef.current) {
        const micSource = audioContext.createMediaStreamSource(micStreamRef.current);
        micSource.connect(analyserRef.current);
        micSourceNodeRef.current = micSource;
      }

      // Start volume tracking loop
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const trackVolume = () => {
        if (!analyserRef.current || isListeningRef.current === false || !isEnlightenedRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioVolume(avg / 128); // Normalize
        rafRef.current = requestAnimationFrame(trackVolume);
      };

      // Set up speech recognition
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = hasTriedEnUSRef.current ? 'en-US' : 'en-IN';

      recognition.onstart = () => {
        if (!isEnlightenedRef.current) {
          console.log('recognition.onstart fired but Enlightenment Mode is inactive. Aborting recognition.');
          try { recognition.abort(); } catch (e) {}
          isListeningRef.current = false;
          return;
        }
        errorOccurredRef.current = false;
        setEnlightenStatus('listening');
        setVoiceTranscript(`Listening... Speak now (${hasTriedEnUSRef.current ? 'en-US' : 'en-IN'}).`);
        isListeningRef.current = true;
        transcriptRef.current = '';
        trackVolume();
      };

      recognition.onresult = (event: any) => {
        if (!isEnlightenedRef.current) {
          try { recognition.abort(); } catch (e) {}
          return;
        }
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setVoiceTranscript(currentText);
          transcriptRef.current = currentText;
        }
      };

      recognition.onerror = (event: any) => {
        // If the recognition was stopped programmatically, ignore and return silently
        if (event.error === 'aborted') {
          console.log('Speech recognition aborted programmatically.');
          errorOccurredRef.current = true;
          return;
        }

        console.error('Speech recognition error:', event.error, event.message || '');
        errorOccurredRef.current = true;
        
        if (event.error === 'network' && !hasTriedEnUSRef.current) {
          hasTriedEnUSRef.current = true;
          console.warn('Speech recognition network error with en-IN. Retrying with en-US fallback...');
          setVoiceTranscript('Connecting to speech servers (using fallback)...');
          
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          isListeningRef.current = false;
          
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (isEnlightenedRef.current) {
              startVoiceListening();
            }
          }, 300);
          return;
        }

        let friendlyMessage = 'An unexpected speech recognition error occurred.';
        if (event.error === 'no-speech') {
          friendlyMessage = 'No speech detected. Tap "Tap to Talk" and speak clearly near your microphone.';
        } else if (event.error === 'not-allowed') {
          friendlyMessage = 'Microphone permission blocked. Please allow microphone access in your browser address bar or settings.';
        } else if (event.error === 'network') {
          friendlyMessage = "Speech recognition connection issue. This browser is having trouble connecting to Google's speech transcription servers. Please use the text input below to type your message!";
          setShowVoiceKeyboardFallback(true);
        } else if (event.error === 'audio-capture') {
          friendlyMessage = 'Microphone hardware issue. Please check that your microphone is plugged in and not in use by another application.';
        } else if (event.error === 'service-not-allowed') {
          friendlyMessage = 'Browser speech service not allowed. This browser may have disabled or restricted the speech recognition service. Please use the text input below to type instead!';
          setShowVoiceKeyboardFallback(true);
        } else {
          friendlyMessage = `Speech Error (${event.error || 'unknown'}). Please tap to retry or use the text input below.`;
          setShowVoiceKeyboardFallback(true);
        }
        
        if (isEnlightenedRef.current) {
          setVoiceTranscript(friendlyMessage);
          setEnlightenStatus('idle');
        }
        isListeningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        if (errorOccurredRef.current || !isEnlightenedRef.current) {
          return;
        }
        
        const finalText = transcriptRef.current.trim();
        if (finalText) {
          submitVoiceQuery(finalText);
        } else {
          setEnlightenStatus('idle');
        }
      };

      if (!isEnlightenedRef.current) {
        console.log('startVoiceListening: Enlightenment Mode became inactive before starting recognition.');
        return;
      }

      recognition.start();
    } catch (err) {
      console.error('Error starting mic:', err);
      if (isEnlightenedRef.current) {
        setVoiceTranscript("Microphone permission denied or not found. Please enable it in browser settings.");
        setEnlightenStatus('idle');
      }
    }
  };

  const playNativeSpeech = (text: string) => {
    if (!isEnlightenedRef.current) {
      console.log('playNativeSpeech called but Enlightenment Mode is inactive. Aborting.');
      return;
    }
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.error('speechSynthesis is not supported in this browser.');
        setVoiceTranscript("Browser speech synthesis is not supported. Please read Dr. Kalam's response above.");
        setEnlightenStatus('idle');
        return;
      }

      // Cancel any ongoing synthesis
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;
      
      // Select the best voice (slow, inspiring, male voice, preferably Indian or general English)
      const voices = window.speechSynthesis.getVoices();
      
      let selectedVoice = null;
      const indianMale = voices.find(v => v.lang.includes('en-IN') && v.name.toLowerCase().includes('male'));
      const indianAny = voices.find(v => v.lang.includes('en-IN'));
      const englishMale = voices.find(v => v.lang.includes('en-') && v.name.toLowerCase().includes('male'));
      const englishMaleGoogle = voices.find(v => v.lang.includes('en-') && v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('male'));
      const englishGoogle = voices.find(v => v.lang.includes('en-') && v.name.toLowerCase().includes('google'));
      const englishAny = voices.find(v => v.lang.startsWith('en'));
      
      selectedVoice = indianMale || englishMaleGoogle || englishMale || indianAny || englishGoogle || englishAny || voices[0];
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Selected browser synthesis voice:', selectedVoice.name, selectedVoice.lang);
      }

      // Configure slower, more inspiring pitch & rate to mimic Dr. Kalam's unique cadence
      utterance.pitch = 0.95;
      utterance.rate = 0.85;

      let active = true;

      const cleanup = () => {
        active = false;
        onTalkingChange?.(false);
        setAudioVolume(0);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };

      utterance.onstart = () => {
        if (!isEnlightenedRef.current || activeUtteranceRef.current !== utterance) {
          active = false;
          try { window.speechSynthesis.cancel(); } catch (e) {}
          cleanup();
          return;
        }
        setEnlightenStatus('speaking');
        onTalkingChange?.(true);
        
        // Setup visualizer simulation
        const simulateVolume = () => {
          if (!active || !isEnlightenedRef.current) return;
          const time = Date.now() / 150;
          let volume = 0.3 + 0.3 * Math.sin(time) + 0.2 * Math.sin(time * 2.3);
          volume += (Math.random() - 0.5) * 0.15;
          volume = Math.max(0.05, Math.min(0.95, volume));
          setAudioVolume(volume);
          rafRef.current = requestAnimationFrame(simulateVolume);
        };
        simulateVolume();
      };

      utterance.onboundary = (event: any) => {
        if (!isEnlightenedRef.current || activeUtteranceRef.current !== utterance) return;
        if (event.name === 'word') {
          // Spike the volume slightly to represent emphasis on a new word/syllable!
          setAudioVolume(0.85);
        }
      };

      utterance.onend = () => {
        if (activeUtteranceRef.current !== utterance) return; // Ignore stale utterances!
        cleanup();
        if (!isEnlightenedRef.current) {
          console.log('Native speech ended but Enlightenment Mode is inactive. Aborting listener.');
          return;
        }
        setVoiceTranscript('Listening... Speak now.');
        setVoiceResponseText('');
        startVoiceListening();
      };

      utterance.onerror = (event: any) => {
        if (activeUtteranceRef.current !== utterance) return; // Ignore stale utterances!
        if (event.error === 'interrupted') {
          return; // Ignore programmatically interrupted speech synthesis
        }
        console.error('Browser SpeechSynthesis error:', event.error);
        cleanup();
        if (!isEnlightenedRef.current) return;
        setVoiceTranscript('Click the visualizer button to speak again.');
        setEnlightenStatus('idle');
      };

      if (!isEnlightenedRef.current) {
        console.log('playNativeSpeech: Enlightenment Mode became inactive before speaking.');
        return;
      }

      window.speechSynthesis.speak(utterance);

    } catch (err) {
      console.error('Failed to trigger playNativeSpeech:', err);
      onTalkingChange?.(false);
      setEnlightenStatus('idle');
    }
  };

  const submitVoiceQuery = async (queryText: string) => {
    if (!isEnlightenedRef.current) {
      console.log('submitVoiceQuery called but Enlightenment Mode is inactive. Aborting.');
      return;
    }
    try {
      hasTriedEnUSRef.current = false;
      setEnlightenStatus('thinking');
      setVoiceTranscript(`You: "${queryText}"`);
      setVoiceResponseText('Dr. Kalam is reflecting...');

      const isFirstMessage = !hasSentFirstMessage.current;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText, history: messages, isFirstMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI server');
      }

      if (!isEnlightenedRef.current) {
        console.log('Chat response received but Enlightenment Mode is inactive. Aborting.');
        return;
      }

      const chatData = await response.json();
      const answer = chatData.text || "My young friend, let us try again with courage.";

      const userMessage: Message = {
        id: Date.now().toString(),
        text: queryText,
        sender: 'user',
        timestamp: new Date(),
      };
      const kalamMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        sender: 'kalam',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, kalamMessage]);
      if (isFirstMessage) {
        window.dispatchEvent(new Event('chat-interaction'));
        hasSentFirstMessage.current = true;
      }

      if (!isEnlightenedRef.current) {
        console.log('Messages updated but Enlightenment Mode is inactive. Aborting voice speech.');
        return;
      }

      setVoiceResponseText(answer);
      setVoiceTranscript('Translating wisdom to voice...');

      // Get voice from ElevenLabs secure TTS API
      try {
        if (!isEnlightenedRef.current) return;

        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: answer }),
        });

        if (!ttsResponse.ok) {
          throw new Error('Voice generation failed');
        }

        if (!isEnlightenedRef.current) {
          console.log('Secure voice stream generated but Enlightenment Mode is inactive. Discarding audio blob.');
          return;
        }

        const audioBlob = await ttsResponse.blob();
        console.log('Audio blob received:', audioBlob.type, audioBlob.size);
        if (!audioBlob.type.startsWith('audio/')) {
          const errorContent = await audioBlob.text();
          console.error('TTS returned non-audio data. Response content:', errorContent);
          throw new Error(`TTS response was not audio: ${audioBlob.type}`);
        }
        playVoiceAudio(audioBlob, answer);
      } catch (ttsErr) {
        console.error('ElevenLabs TTS failed, falling back to browser speechSynthesis:', ttsErr);
        if (!isEnlightenedRef.current) return;
        setVoiceTranscript('Speaking (resilient voice)...');
        playNativeSpeech(answer);
      }

    } catch (err) {
      console.error('Error during voice exchange:', err);
      if (!isEnlightenedRef.current) return;
      setVoiceResponseText("My young friend, let us try again. There seems to be a minor technical error.");
      setVoiceTranscript("Click the visualizer button to speak again.");
      setEnlightenStatus('idle');
    }
  };

  const playVoiceAudio = async (audioBlob: Blob, text: string) => {
    if (!isEnlightenedRef.current) {
      console.log('playVoiceAudio called but Enlightenment Mode is inactive. Aborting.');
      return;
    }
    try {
      if (!audioRef.current || !audioContextRef.current || !analyserRef.current) return;

      const audio = audioRef.current;
      audio.pause();

      const audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;

      // Connect source once
      if (!audioSourceNodeRef.current) {
        audioSourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
        audioSourceNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const trackPlaybackVolume = () => {
        if (!analyserRef.current || audio.paused || !isEnlightenedRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioVolume(avg / 128); // Normalize
        rafRef.current = requestAnimationFrame(trackPlaybackVolume);
      };

      audio.onplay = () => {
        if (!isEnlightenedRef.current) {
          audio.pause();
          return;
        }
        setEnlightenStatus('speaking');
        onTalkingChange?.(true);
        trackPlaybackVolume();
      };

      audio.onended = () => {
        onTalkingChange?.(false);
        URL.revokeObjectURL(audioUrl);
        if (!isEnlightenedRef.current) {
          console.log('Audio ended but Enlightenment Mode is inactive. Aborting listener.');
          return;
        }
        setVoiceTranscript('Listening... Speak now.');
        setVoiceResponseText('');
        startVoiceListening();
      };

      audio.onerror = () => {
        const err = audio.error;
        let errorMsg = 'Unknown HTMLAudioElement error';
        if (err) {
          errorMsg = `Code: ${err.code}`;
          if (err.message) errorMsg += ` - Message: ${err.message}`;
        }
        console.error('Audio playback error details:', errorMsg);
        onTalkingChange?.(false);
        URL.revokeObjectURL(audioUrl);
        if (!isEnlightenedRef.current) {
          console.log('Audio playback error occurred but Enlightenment Mode is inactive. Aborting.');
          return;
        }
        console.warn('Audio playback failed. Falling back to browser speechSynthesis...');
        setVoiceTranscript('Speaking (resilient voice)...');
        playNativeSpeech(text);
      };

      await audio.play();

    } catch (err) {
      console.error('Playback failed:', err);
      onTalkingChange?.(false);
      if (!isEnlightenedRef.current) {
        console.log('Playback start failed but Enlightenment Mode is inactive. Aborting.');
        return;
      }
      console.warn('Audio playback start failed. Falling back to browser speechSynthesis...');
      setVoiceTranscript('Speaking (resilient voice)...');
      playNativeSpeech(text);
    }
  };

  const activateEnlightenment = async () => {
    setIsEnlightened(true);
    isEnlightenedRef.current = true;
    setEnlightenStatus('idle');
    setVoiceTranscript('Connecting to microphone...');
    setShowVoiceKeyboardFallback(false);
    setVoiceKeyboardInput('');
    hasTriedEnUSRef.current = false;
    
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }

    // Automatically trigger voice recognition and mic stream capture!
    startVoiceListening();
  };

  const deactivateEnlightenment = () => {
    setIsEnlightened(false);
    isEnlightenedRef.current = false;
    onTalkingChange?.(false);

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    if (audioRef.current) {
      const audio = audioRef.current;
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = '';
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    micSourceNodeRef.current = null;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (activeUtteranceRef.current) {
      const utt = activeUtteranceRef.current;
      utt.onstart = null;
      utt.onboundary = null;
      utt.onend = null;
      utt.onerror = null;
      utt.volume = 0;
      activeUtteranceRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setAudioVolume(0);
    isListeningRef.current = false;
    hasTriedEnUSRef.current = false;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    onTalkingChange?.(true);

    try {
      const isFirstMessage = !hasSentFirstMessage.current;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages, isFirstMessage }),
      });

      const data = await response.json();

      let text = data.text;
      
      // If the API explicitly returns an error message, use it or a better fallback
      if (!text && data.error) {
        text = `My mission encountered a technical difficulty: ${data.details || data.error}. Let us try again with courage.`;
      } else if (!text) {
        text = "I am reflecting on your words. Let us continue our journey of learning.";
      }

      const kalamMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'kalam',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, kalamMessage]);

      // Notify the stats banner that a successful prompt was generated!
      if (isFirstMessage) {
        window.dispatchEvent(new Event('chat-interaction'));
        hasSentFirstMessage.current = true;
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        text: "My communications seem to be offline. Please check your internet connection.",
        sender: 'kalam',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      onTalkingChange?.(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageCircle size={24} color="#3b82f6" style={{ flexShrink: 0 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.2 }}>Dr. Kalam AI</h2>
            <p style={{ 
              margin: 0, 
              fontSize: '0.65rem', 
              color: 'rgba(251, 191, 36, 0.8)', 
              fontWeight: 500,
              letterSpacing: '0.2px'
            }}>
              Expert Guidance: Prof.CRS KUMAR, DIAT
            </p>
          </div>
        </div>
      </div>
      
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message kalam">
            <span className="dot-flashing"></span>
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <button 
          className="enlighten-toggle-btn" 
          onClick={activateEnlightenment}
          title="Enter Enlightenment Mode (Voice)"
        >
          <Sparkles size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
        </button>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask Dr. Kalam anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend} disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>

      {isEnlightened && (
        <div className="enlighten-overlay">
          <div className="enlighten-overlay-header">
            <div className="enlighten-beacon-wrapper">
              <span className={`enlighten-beacon ${enlightenStatus}`} />
              <span className="enlighten-mode-title">Enlightenment Mode</span>
            </div>
            <button className="enlighten-close-btn" onClick={deactivateEnlightenment}>
              <X size={18} />
            </button>
          </div>

          <div className="enlighten-overlay-content">
            <SiriWave status={enlightenStatus} audioVolume={audioVolume} />

            <div className="enlighten-status-badge">
              {enlightenStatus === 'listening' && <span className="status-badge listening">Listening</span>}
              {enlightenStatus === 'thinking' && <span className="status-badge thinking">Reflecting</span>}
              {enlightenStatus === 'speaking' && <span className="status-badge speaking">Speaking</span>}
              {enlightenStatus === 'idle' && <span className="status-badge idle">Ready</span>}
            </div>

            <div className="enlighten-transcript-container">
              <p className="voice-transcript">{voiceTranscript}</p>
              {voiceResponseText && (
                <p className="voice-response">{voiceResponseText}</p>
              )}
            </div>
          </div>

          <div className="enlighten-overlay-footer">
            {showVoiceKeyboardFallback && enlightenStatus === 'idle' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={voiceKeyboardInput}
                    onChange={(e) => setVoiceKeyboardInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && voiceKeyboardInput.trim()) {
                        submitVoiceQuery(voiceKeyboardInput.trim());
                        setVoiceKeyboardInput('');
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '99px',
                      padding: '0.6rem 1.2rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (voiceKeyboardInput.trim()) {
                        submitVoiceQuery(voiceKeyboardInput.trim());
                        setVoiceKeyboardInput('');
                      }
                    }}
                    style={{
                      background: '#3b82f6',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setShowVoiceKeyboardFallback(false);
                    startVoiceListening();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(251, 191, 36, 0.8)',
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Or try talking again
                </button>
              </div>
            ) : enlightenStatus === 'idle' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <button className="action-pill-btn start" onClick={startVoiceListening}>
                  <Mic size={16} /> Tap to Talk
                </button>
                <button 
                  onClick={() => setShowVoiceKeyboardFallback(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Type instead
                </button>
              </div>
            ) : enlightenStatus === 'listening' ? (
              <button className="action-pill-btn stop" onClick={() => {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                }
              }}>
                <MicOff size={16} /> Done Speaking
              </button>
            ) : enlightenStatus === 'speaking' ? (
              <button className="action-pill-btn stop" onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  setEnlightenStatus('idle');
                  onTalkingChange?.(false);
                }
              }}>
                <Volume2 size={16} /> Mute Response
              </button>
            ) : (
              <div className="enlighten-loader-bar">
                <span className="loader-progress" />
              </div>
            )}
            <p className="footer-tip">Developed by Archit Yadav in collaboration with Novatech Robo Pvt Ltd</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .enlighten-toggle-btn {
          flex-shrink: 0; /* Crucial to prevent toggle button from compressing */
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 10px;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fbbf24;
          transition: all 0.2s ease;
        }
        .enlighten-toggle-btn:hover {
          background: rgba(251, 191, 36, 0.2);
          border-color: rgba(251, 191, 36, 0.5);
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
          transform: scale(1.05);
        }
        .enlighten-overlay {
          position: absolute;
          inset: 0;
          background: rgba(5, 5, 8, 0.96);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slide-up {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .enlighten-overlay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .enlighten-beacon-wrapper {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .enlighten-beacon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #888;
        }
        .enlighten-beacon.listening {
          background: #3b82f6;
          box-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6;
          animation: beacon-pulse 1.5s infinite;
        }
        .enlighten-beacon.thinking {
          background: #fbbf24;
          box-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24;
          animation: beacon-pulse 1.5s infinite;
        }
        .enlighten-beacon.speaking {
          background: #10b981;
          box-shadow: 0 0 10px #10b981, 0 0 20px #10b981;
          animation: beacon-pulse 1.5s infinite;
        }
        @keyframes beacon-pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .enlighten-mode-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          background: linear-gradient(90deg, #fff, var(--accent-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .enlighten-close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .enlighten-close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .enlighten-overlay-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 1.5rem;
          overflow-y: auto;
        }
        .enlighten-status-badge {
          margin-bottom: 0.75rem;
        }
        .status-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          border: 1px solid transparent;
        }
        .status-badge.listening {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.2);
        }
        .status-badge.thinking {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border-color: rgba(251, 191, 36, 0.2);
        }
        .status-badge.speaking {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.2);
        }
        .status-badge.idle {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .enlighten-transcript-container {
          width: 100%;
          text-align: center;
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .voice-transcript {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          line-height: 1.4;
          max-height: 80px;
          overflow-y: auto;
          margin: 0;
        }
        .voice-response {
          font-size: 1rem;
          color: #e0e0e0;
          font-weight: 500;
          line-height: 1.5;
          max-height: 140px;
          overflow-y: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 0.75rem;
          margin: 0;
        }
        .enlighten-overlay-footer {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .action-pill-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          border-radius: 99px;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .action-pill-btn.start {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        .action-pill-btn.start:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .action-pill-btn.stop {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .action-pill-btn.stop:hover {
          background: rgba(239, 68, 68, 0.25);
        }
        .footer-tip {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.3);
          margin: 0;
          letter-spacing: 0.2px;
          text-align: center;
        }
        .enlighten-loader-bar {
          width: 140px;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .loader-progress {
          display: block;
          height: 100%;
          width: 50%;
          background: linear-gradient(90deg, #3b82f6, #fbbf24);
          border-radius: 4px;
          animation: loader-slide 1.5s infinite ease-in-out;
          position: absolute;
        }
        @keyframes loader-slide {
          0% { left: -50%; }
          100% { left: 100%; }
        }
        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--accent-primary);
          color: var(--accent-primary);
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0.5s;
          margin-left: 10px;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: "";
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--accent-primary);
          color: var(--accent-primary);
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--accent-primary);
          color: var(--accent-primary);
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 1s;
        }
        @keyframes dot-flashing {
          0% { background-color: var(--accent-primary); }
          50%, 100% { background-color: rgba(59, 130, 246, 0.2); }
        }
      `}</style>
    </div>
  );
}
