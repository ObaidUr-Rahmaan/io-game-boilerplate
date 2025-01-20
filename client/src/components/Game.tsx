import { useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Stack, 
  Text, 
  useToast, 
  VStack,
  Flex,
  Box,
  Button,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { hathoraClient } from '../lib/hathora';
import { motion } from 'framer-motion';

const MotionContainer = motion(Container);

export function Game() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Combined game state management effect
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Handle connection
    hathoraClient.connect(roomId).catch((err) => {
      console.error('Failed to connect:', err);
      toast({
        title: 'Error',
        description: 'Failed to connect to game',
        status: 'error',
      });
    });

    const handleMessage = (data: ArrayBuffer) => {
      const message = JSON.parse(new TextDecoder().decode(data));
      console.log('[Game] Received message:', message);
      
      // Handle different message types here
      // Example:
      // switch (message.type) {
      //   case "gameState":
      //     // Update game state
      //     break;
      // }
    };

    hathoraClient.addMessageHandler(handleMessage);
    return () => hathoraClient.removeMessageHandler(handleMessage);
  }, [roomId, navigate, toast]);

  const handleLeave = () => {
    hathoraClient.sendMessage({ type: "leave" });
    hathoraClient.disconnect();
    navigate('/');
  };

  // TODO: Add game-specific UI here (Below is just an example)
  return (
    <Flex 
      minH="100vh" 
      w="100vw" 
      alignItems="center" 
      justifyContent="center" 
      bg="gray.100"
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
    >
      <MotionContainer 
        maxW="container.lg" 
        py={6}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Stack spacing={6} align="center">
          {/* Game Header */}
          <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
            <Text fontSize="xl">Room: {roomId}</Text>
            <Button colorScheme="red" onClick={handleLeave}>Leave Game</Button>
          </Box>

          {/* Players Grid */}
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} w="100%">
            {/* Add PlayerCard components here */}
          </Grid>

          {/* Game Area */}
          <Box p={4} bg="white" borderRadius="lg" w="100%" maxW="600px">
            <VStack spacing={4}>
              <Text fontSize="xl">Game Status</Text>
              {/* Add game-specific UI here */}
            </VStack>
          </Box>

          {/* Chat or other components */}
          <Box w="100%" p={4} bg="white" borderRadius="lg">
            <Text>Add chat or other components here</Text>
          </Box>
        </Stack>
      </MotionContainer>
    </Flex>
  );
} 