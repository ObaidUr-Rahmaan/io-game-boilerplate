import { useState, useRef } from 'react';
import { 
  Button, 
  Input, 
  Stack, 
  Text, 
  useToast, 
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  SlideFade
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { hathoraClient } from '../lib/hathora';

// Define possible states for the home screen
type GameMode = 'select' | 'join' | 'create';

export function Home() {
  // Core state management
  const [mode, setMode] = useState<GameMode>('select');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  
  // Rate limiting setup - Modify DEBOUNCE_MS to adjust the cooldown between attempts
  const lastAttemptRef = useRef<number>(0);
  const DEBOUNCE_MS = 1000; // 1 second debounce
  
  const navigate = useNavigate();
  const toast = useToast();

  // Rate limiting function - Can be modified to change throttling behavior
  const isThrottled = () => {
    const now = Date.now();
    if (now - lastAttemptRef.current < DEBOUNCE_MS) {
      toast({
        title: 'Please wait',
        description: 'Too many attempts. Please wait a moment.',
        status: 'warning',
      });
      return true;
    }
    lastAttemptRef.current = now;
    return false;
  };

  // Handles joining an existing game room
  // Modify this function to add custom validation or pre-join logic
  const handleJoinGame = async () => {
    if (isThrottled()) return;

    const trimmedNickname = nickname.trim();
    const trimmedRoomId = roomId.trim();

    // Basic validation - Can be extended for game-specific requirements
    if (!trimmedNickname || !trimmedRoomId) {
      toast({
        title: 'Error',
        description: 'Please enter both nickname and room ID',
        status: 'error',
      });
      return;
    }

    setIsLoading(true);
    let hasError = false;

    try {
      // Connect to the room
      await hathoraClient.connect(trimmedRoomId);
      
      // Error handler for server-side validation
      // Modify this to handle game-specific error messages
      const handleError = (data: ArrayBuffer) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(data));
          if (message.type === 'error') {
            hasError = true;
            setErrorModal({
              isOpen: true,
              message: message.error
            });
            hathoraClient.disconnect();
            setIsLoading(false);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      };

      hathoraClient.addMessageHandler(handleError);
      
      // Send join event - Modify the message structure to match your game's protocol
      hathoraClient.sendMessage({
        type: "join",
        userId: trimmedNickname,
      });

      // Wait for potential error messages before proceeding
      await new Promise(resolve => setTimeout(resolve, 500));
      hathoraClient.removeMessageHandler(handleError);
      
      if (!hasError && hathoraClient.isConnected()) {
        navigate(`/game/${trimmedRoomId}`);
      }
    } catch (err) {
      console.error('Failed to join game:', err);
      setErrorModal({
        isOpen: true,
        message: err instanceof Error ? err.message : 'Failed to join game'
      });
    } finally {
      if (!hasError) {
        setIsLoading(false);
      }
    }
  };

  // Handles creating a new game room
  // Modify this function to add custom room creation logic
  const handleCreateGame = async () => {
    if (isThrottled()) return;

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      toast({
        title: 'Error',
        description: 'Please enter a nickname',
        status: 'error',
      });
      return;
    }

    setIsLoading(true);
    let hasError = false;

    try {
      // Create and connect to a new room
      const newRoomId = await hathoraClient.createRoom();
      await hathoraClient.connect(newRoomId);

      // Error handler - Similar to join game
      const handleError = (data: ArrayBuffer) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(data));
          if (message.type === 'error') {
            hasError = true;
            setErrorModal({
              isOpen: true,
              message: message.error
            });
            hathoraClient.disconnect();
            setIsLoading(false);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      };

      hathoraClient.addMessageHandler(handleError);
      
      // Send join event - Modify to match your game's protocol
      hathoraClient.sendMessage({
        type: "join",
        userId: trimmedNickname,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      hathoraClient.removeMessageHandler(handleError);
      
      if (!hasError && hathoraClient.isConnected()) {
        navigate(`/game/${newRoomId}`);
      }
    } catch (err) {
      console.error('Failed to create game:', err);
      toast({
        title: 'Error',
        description: 'Failed to create game',
        status: 'error',
      });
    } finally {
      if (!hasError) {
        setIsLoading(false);
      }
    }
  };

  // Resets the form state
  const resetMode = () => {
    setMode('select');
    setNickname('');
    setRoomId('');
  };

  // UI Rendering
  // Modify the styling below to match your game's theme
  return (
    <Flex 
      minH="100vh" 
      w="100vw" 
      alignItems="center" 
      justifyContent="center" 
      bg="gray.100" // Change background color to match your theme
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
    >
      <Stack spacing={8} maxW="400px" w="100%" align="center" px={4}>
        {/* Add your game title/logo here */}
        
        <Stack spacing={4} w="100%">
          {mode === 'select' ? (
            // Initial mode selection screen
            <SlideFade in={true} offsetY="20px">
              <Stack spacing={4}>
                <Button
                  size="lg"
                  colorScheme="blue" // Modify button colors to match your theme
                  onClick={() => setMode('join')}
                  height="56px"
                  fontSize="lg"
                >
                  Join Room
                </Button>
                <Button
                  size="lg"
                  colorScheme="green"
                  onClick={() => setMode('create')}
                  height="56px"
                  fontSize="lg"
                >
                  Create Room
                </Button>
              </Stack>
            </SlideFade>
          ) : (
            // Room creation/joining form
            <SlideFade in={true} offsetY="20px">
              <Stack spacing={4}>
                {/* Nickname input - Add validation as needed */}
                <Input
                  size="lg"
                  placeholder="Your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (mode === 'create') {
                        handleCreateGame();
                      } else if (mode === 'join' && roomId) {
                        handleJoinGame();
                      }
                    }
                  }}
                />
                {/* Room ID input - Only shown in join mode */}
                {mode === 'join' && (
                  <Input
                    size="lg"
                    placeholder="Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nickname) {
                        handleJoinGame();
                      }
                    }}
                  />
                )}
                {/* Action button */}
                <Button
                  size="lg"
                  colorScheme={mode === 'join' ? "blue" : "green"}
                  onClick={mode === 'join' ? handleJoinGame : handleCreateGame}
                  isLoading={isLoading}
                  loadingText={mode === 'create' ? "Creating Room..." : "Joining Game..."}
                  spinner={<Spinner />}
                  isDisabled={!nickname || (mode === 'join' && !roomId)}
                >
                  {mode === 'join' ? 'Join Room' : 'Create Room'}
                </Button>
                {/* Back button */}
                <Button
                  variant="ghost"
                  onClick={resetMode}
                  isDisabled={isLoading}
                >
                  Back
                </Button>
              </Stack>
            </SlideFade>
          )}
        </Stack>

        {/* Error Modal - Customize the styling to match your theme */}
        <Modal isOpen={errorModal.isOpen} onClose={() => setErrorModal({ isOpen: false, message: '' })}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Error</ModalHeader>
            <ModalBody>
              <Text>{errorModal.message}</Text>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setErrorModal({ isOpen: false, message: '' })}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Flex>
  );
} 