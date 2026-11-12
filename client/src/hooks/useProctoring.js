import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useProctoring = ({
  submissionId,
  isActive = false,
  maxWarnings = 3,
  onTerminate,
}) => {
  const { authFetch } = useAuth();
  const [warnings, setWarnings] = useState(0);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const lastViolationTimeRef = useRef(0);
  const terminateCallbackRef = useRef(onTerminate);

  useEffect(() => {
    terminateCallbackRef.current = onTerminate;
  }, [onTerminate]);

  // Request Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          await document.documentElement.msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request rejected or blocked:', err.message);
    }
  }, []);

  // Exit Fullscreen safely when exam ends
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err.message);
    }
  }, []);

  // Dismiss warning alert
  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  // Send violation to backend
  const triggerViolation = useCallback(async (violationType, details) => {
    if (!isActive || !submissionId || isTerminated) return;

    // Cooldown check: ignore duplicate events within 1.2 seconds (e.g. blur + visibilitychange firing together)
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1200) {
      return;
    }
    lastViolationTimeRef.current = now;

    try {
      const res = await authFetch('/api/proctor/log', {
        method: 'POST',
        body: JSON.stringify({
          submissionId,
          violationType,
          details,
        }),
      });

      const data = await res.json();
      const currentCount = data.warningNumber || 1;
      setWarnings(currentCount);

      const alertInfo = {
        type: violationType,
        count: currentCount,
        max: maxWarnings,
        details: details || 'Academic integrity policy violation detected.',
        timestamp: new Date().toLocaleTimeString(),
        isFatal: currentCount >= maxWarnings || data.isTerminated,
      };

      setCurrentAlert(alertInfo);

      // Play alert beep sound using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // AudioContext not permitted or muted
      }

      if (data.isTerminated || currentCount >= maxWarnings) {
        setIsTerminated(true);
        if (terminateCallbackRef.current) {
          terminateCallbackRef.current('Violated 3-Strike Proctoring Policy');
        }
      }
    } catch (error) {
      console.error('Failed to log proctoring violation:', error);
    }
  }, [isActive, submissionId, isTerminated, maxWarnings, authFetch]);

  useEffect(() => {
    if (!isActive || !submissionId || isTerminated) return;

    // 1. Tab-Switch & Visibility Change Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          'tab_switch',
          'Student switched browser tab or minimized window.'
        );
      }
    };

    // 2. Window Blur Detection
    const handleWindowBlur = () => {
      triggerViolation(
        'tab_switch',
        'Window lost focus (switched applications, split screen, or opened external tool).'
      );
    };

    // 3. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(inFullscreen);
      if (!inFullscreen) {
        triggerViolation(
          'fullscreen_exit',
          'Student exited compulsory full-screen exam mode.'
        );
      }
    };

    // 4. Copy / Paste / Cut Prevention & Logging
    const handleCopy = (e) => {
      e.preventDefault();
      triggerViolation('copy_attempt', 'Clipboard copy action intercepted.');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      triggerViolation('copy_attempt', 'Clipboard paste action intercepted.');
    };

    const handleCut = (e) => {
      e.preventDefault();
      triggerViolation('copy_attempt', 'Clipboard cut action intercepted.');
    };

    // 5. Right Click Context Menu Lock
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('copy_attempt', 'Right-click context menu lock triggered.');
    };

    // 6. Keyboard Shortcuts Lock (Ctrl+C, Ctrl+V, F12, Alt+Tab, etc.)
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, Ctrl+S
      if (isCtrlOrCmd && ['c', 'v', 'x', 'u', 's', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerViolation('copy_attempt', `Blocked shortcut command: ${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key.toUpperCase()}`);
      }
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('copy_attempt', 'Attempted to open Developer Tools (F12).');
      }
      // Block Escape key if trying to exit fullscreen intentionally
      if (e.key === 'Escape' && document.fullscreenElement) {
        // Browser handles escape natively for fullscreen exit, which triggers fullscreenchange
      }
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, submissionId, isTerminated, triggerViolation]);

  return {
    warnings,
    currentAlert,
    isTerminated,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    dismissAlert,
    triggerViolation,
  };
};
