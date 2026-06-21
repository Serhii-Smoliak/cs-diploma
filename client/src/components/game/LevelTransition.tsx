import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore.ts';

interface LevelTransitionProps {
  show: boolean;
  message: string;
}

export default function LevelTransition({ show, message }: LevelTransitionProps) {
  const { currentLevel } = useGameStore();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-cyber-background/95 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="cyber-panel p-8 text-center max-w-md"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-cyber-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <h2 className="font-heading font-bold text-2xl text-cyber-primary mb-2">{message}</h2>
            {currentLevel && (
              <p className="text-gray-400 text-sm mt-4">Наступне завдання: {currentLevel.title}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
