import { useState, useEffect, useCallback, useRef } from 'react';

import ConnectionStatus from './ConnectionStatus';
import ErrorBanner from './ErrorBanner';
import SettingsModal from './SettingsModal';
import ShareRoomModal from './ShareRoomModal';
import { GameScreen } from './GameScreen';

import {
  createRoom,
  joinRoom,
  connectToRoom,
  disconnectFromRoom,
  updateSettings,
  addEventListener,
  removeEventListener,
  isConnected,
  type WebSocketMessageType
} from '../lib/api-service';
import type { RoomData, WebSocketErrorData, RoomSettings } from '../types';

export function RoomScreen() {
  const [name, setName] = useState<string>('');
  const [roomKey, setRoomKey] = useState<string>('');
  const [screen, setScreen] = useState('welcome');
  const [roomData, setRoomData] = useState<RoomData>({
    key: '',
    users: [],
    moderator: '',
    connectedUsers: {},
    settings: {
    }
  });
  const [isModeratorView, setIsModeratorView] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const didLoadName = useRef(false);
  const didCheckUrlParams = useRef(false);
  const didAttemptRestore = useRef(false);

  // Join room from URL parameters
  useEffect(() => {
    if (didCheckUrlParams.current) return;
    
    didCheckUrlParams.current = true;
    
    try {
      const url = new URL(window.location.href);
      const joinParam = url.searchParams.get('join');
      
      // Check if URL contains ?join=roomKey
      if (joinParam && joinParam.length > 0) {
        setRoomKey(joinParam.toUpperCase());
        setScreen('join');
        
        window.history.replaceState({}, document.title, '/');
      }
    } catch (err) {
      console.error('Failed to parse URL parameters', err);
    }
  }, []);

  // Auto-reconnect to last room on refresh
  useEffect(() => {
    if (didAttemptRestore.current) return;
    if (screen !== 'welcome') return;
    if (!name) return;
    didAttemptRestore.current = true;
    const savedRoomKey = localStorage.getItem('anyonecandraw_roomKey');
    if (savedRoomKey) {
      setIsLoading(true);
      joinRoom(name, savedRoomKey)
        .then((joinedRoom) => {
          setRoomData(joinedRoom);
          setIsModeratorView(joinedRoom.moderator === name);
          setScreen('room');
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect to room';
          setError(errorMessage);
          localStorage.removeItem('anyonecandraw_roomKey');
        })
        .finally(() => setIsLoading(false));
    }
  }, [name, screen]);

  const handleRoomUpdate = useCallback((updatedRoomData: RoomData) => {
    setRoomData(updatedRoomData);

    setIsModeratorView(updatedRoomData.moderator === name);

    setError('');
  }, [name]);

  // Connect to WebSocket when entering a room
  useEffect(() => {
    if (screen === 'room' && name && roomData.key) {
      connectToRoom(roomData.key, name, handleRoomUpdate);

      const errorHandler = (data: WebSocketErrorData) => {
        setError(data.error || 'Connection error');
      };

      const eventTypes: WebSocketMessageType[] = ['disconnected', 'error'];
      
      for (const type of eventTypes) {
        addEventListener(type, errorHandler);
      }

      return () => {
        disconnectFromRoom();
        for (const type of eventTypes) {
          removeEventListener(type, errorHandler);
        }
      };
    }
  }, [screen, name, roomData.key, handleRoomUpdate]);

  // Persist user name in localStorage (Combined Load & Save)
  useEffect(() => {
    if (!didLoadName.current) {
      const savedName = localStorage.getItem('anyonecandraw_username');
      if (savedName) {
        setName(savedName);
      }
      didLoadName.current = true;
      return;
    }

    if (name === '' && !localStorage.getItem('anyonecandraw_username')) {
      return;
    }

    const saveTimeout = setTimeout(() => {
      localStorage.setItem('anyonecandraw_username', name);
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [name]);

  const handleCreateRoom = async () => {
    if (!name) return;

    setIsLoading(true);
    setError('');

    try {
      const newRoom = await createRoom(name);

      setRoomData(newRoom);
      localStorage.setItem('anyonecandraw_roomKey', newRoom.key);
      setIsModeratorView(true);
      setScreen('room');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!name || !roomKey) return;

    setIsLoading(true);
    setError('');

    try {
      const joinedRoom = await joinRoom(name, roomKey);

      setRoomData(joinedRoom);
      localStorage.setItem('anyonecandraw_roomKey', joinedRoom.key);
      setIsModeratorView(joinedRoom.moderator === name);
      setScreen('room');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (settings: RoomSettings) => {
    if (!isModeratorView) return;

    try {
      updateSettings(settings);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
    }
  };

  const handleLeaveRoom = () => {
    disconnectFromRoom();
    localStorage.removeItem('anyonecandraw_roomKey');
    setRoomData({
      key: '',
      users: [],
      moderator: '',
      connectedUsers: {},
      settings: {
      }
    });
    setScreen('welcome');
  };

  const onClearError = () => setError('');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    console.log('Room settings updated:', roomData.settings);
  }, [roomData.settings]);

  return (
    <div className="flex flex-col h-screen">
      {error && <ErrorBanner message={error} onClose={onClearError} />}
      
      <header className="p-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-lg md:text-xl font-bold">Anyone Can Draw</h1>
            <div className="flex items-stretch h-7">
              <div className="px-2 md:px-3 py-1 text-xs md:text-sm bg-teal-800 rounded-l-md truncate max-w-[80px] md:max-w-none flex items-center">
                {roomData.key}
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-2 py-1 bg-teal-700 hover:bg-teal-800 rounded-r-md border-l border-teal-600 flex items-center"
                title="Share Room"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Share Room</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="text-xs md:text-sm px-2 md:px-3 py-1 bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
              title="Leave Room"
            >
              Leave Room
            </button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <ConnectionStatus isConnected={isConnected()} />
            {isConnected() && ( 
              <div className="hidden sm:block text-xs md:text-sm px-2 md:px-3 py-1 bg-teal-800 rounded-md">
                {isModeratorView ? 'Moderator' : 'Player'}
              </div>
            )}
            {isModeratorView && (
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1 md:p-1.5 rounded-full bg-teal-800 hover:bg-teal-900 transition-colors"
                title="Room Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Room Settings</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 h-full">
        <div className="flex flex-col p-4 md:p-6 overflow-y-auto space-y-8">
					<div>
						<GameScreen
							user={roomData.users[0]}
							onGenerateDrawing={() => Promise.resolve({})}
						/>
					</div>
				</div>
			</div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={roomData.settings}
        onSaveSettings={handleUpdateSettings}
      />

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomKey={roomData.key}
      />
    </div>
  );
};

export default RoomScreen;