import React from 'react';
import { VStack } from '@chakra-ui/react';
import MessageHistory from './MessageHistory';
import ChatInput from './ChatInput';

/**
 * Props for ChatWrapper component.
 */
export interface ChatWrapperProps {
  /** Array of chat messages */
  messages: Array<any>;
  /** Handler for sending a new message */
  onSendMessage: (message: string) => void;
  /** Loading state for sending message */
  isLoading?: boolean;
  /** Optional background color for chat input */
  inputBg?: string;
  /** Optional text color for chat input */
  inputColor?: string;
}

/**
 * ChatWrapper component that displays message history and chat input together.
 * Ensures consistent layout and logic for chat experiences.
 */
const ChatWrapper: React.FC<ChatWrapperProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  inputBg = 'gray.800',
  inputColor = 'gray.100',
}) => (
  <VStack spacing={4} align="stretch">
    <MessageHistory messages={messages} />
    <ChatInput 
      onSendMessage={onSendMessage}
      isLoading={isLoading}
      bg={inputBg}
      color={inputColor}
    />
  </VStack>
);

export default ChatWrapper; 