import { useState } from 'react';
import { Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  'Reactions': ['🔥', '💯', '😂', '😭', '🥺', '😍', '🤯', '💀', '👀', '👏'],
  'Vibes': ['✨', '💫', '🌟', '⭐', '🎉', '🎊', '💅', '💪', '🙌', '❤️'],
  'Mood': ['😎', '🤔', '😤', '🥳', '😈', '👑', '🦋', '🌈', '☕', '🍵'],
  'Fun': ['🐸', '🤡', '💩', '🎭', '🎪', '🎨', '🎬', '📸', '🎧', '🎤'],
};

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-yellow-500/20 text-yellow-500 text-xs font-medium hover:bg-yellow-500/30 transition-colors"
        >
          <Smile className="w-4 h-4" />
          Sticker
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category}>
              <p className="text-xs text-muted-foreground mb-2">{category}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
