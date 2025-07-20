import { useState, useEffect, useRef } from "react";
import { createAvatar } from "@dicebear/core";
import { 
  avataaars, 
  bottts, 
  funEmoji, 
  identicon, 
  lorelei, 
  micah, 
  miniavs, 
  notionists, 
  openPeeps, 
  shapes,
  adventurer,
  bigEars,
  bigSmile,
  croodles,
  pixelArt,
  thumbs,
  icons,
  initials,
  personas
} from "@dicebear/collection";
import { Button } from "./ui/button";
import { Check, Loader2, Search, X, RefreshCw } from "lucide-react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
// Removed unused Card and CardContent imports

interface AvatarStyle {
  name: string;
  style: any;
  category?: string;
  description?: string;
}

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatarUrl: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const avatarStyles: AvatarStyle[] = [
  { name: "Avataaars", style: avataaars, category: "people" },
  { name: "Bottts", style: bottts, category: "robots" },
  { name: "Lorelei", style: lorelei, category: "people" },
  { name: "Micah", style: micah, category: "people" },
  { name: "Miniavs", style: miniavs, category: "people" },
  { name: "Notionists", style: notionists, category: "people" },
  { name: "Open Peeps", style: openPeeps, category: "people" },
  { name: "Adventurer", style: adventurer, category: "characters" },
  { name: "Big Ears", style: bigEars, category: "characters" },
  { name: "Big Smile", style: bigSmile, category: "characters" },
  { name: "Croodles", style: croodles, category: "characters" },
  { name: "Pixel Art", style: pixelArt, category: "characters" },
  { name: "Thumbs", style: thumbs, category: "icons" },
  { name: "Icons", style: icons, category: "icons" },
  { name: "Initials", style: initials, category: "simple" },
  { name: "Personas", style: personas, category: "people" },
  { name: "Shapes", style: shapes, category: "abstract" },
  { name: "Fun Emoji", style: funEmoji, category: "emoji" },
  { name: "Identicon", style: identicon, category: "abstract" },
];

const AvatarPicker = ({ 
  selectedAvatar, 
  onSelect, 
  isOpen = true, 
  onClose,
  className = ''
}: AvatarPickerProps) => {
  const [currentStyle, setCurrentStyle] = useState<AvatarStyle>(avatarStyles[0]);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleAvatarSelect = (avatarUrl: string) => {
    onSelect(avatarUrl);
  };

  // Categorize avatar styles
  const categorizedStyles = avatarStyles.reduce((acc, style) => {
    const category = style.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(style);
    return acc;
  }, {} as Record<string, AvatarStyle[]>);

  const categories = ['all', ...Object.keys(categorizedStyles)];

  const filteredStyles = searchQuery 
    ? avatarStyles.filter(style => 
        style.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory === 'all' 
      ? avatarStyles 
      : categorizedStyles[selectedCategory] || [];

  const generateAvatars = async (style: AvatarStyle, count = 8) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Generate avatars with the current style
      const newAvatars = [];
      for (let i = 0; i < count; i++) {
        const seed = Math.random().toString(36).substring(2, 15);
        const avatar = await createAvatar(style.style, {
          size: 256, // Higher resolution for better quality
          seed: seed,
          radius: 50, // Make avatars rounded
          backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
        }).toDataUri();
        newAvatars.push(avatar);
      }
      
      setAvatars(newAvatars);
      setCurrentStyle(style);
      
      // Scroll to top when new avatars are generated
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error generating avatars:', err);
      setError('Failed to generate avatars. Please try again.');
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleStyleSelect = (style: AvatarStyle) => {
    setLoading(true);
    generateAvatars(style);
  };

  useEffect(() => {
    if (isOpen) {
      generateAvatars(currentStyle);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto ${className}`}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose an Avatar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select or generate a new avatar</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search avatar styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 overflow-y-auto">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
              Categories
            </h4>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Style Selector */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Avatar Styles
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredStyles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => handleStyleSelect(style)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentStyle.name === style.name
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Grid */}
          <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
            {error ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="text-red-500 text-sm mb-4">{error}</div>
                <Button
                  variant="outline"
                  onClick={() => generateAvatars(currentStyle)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Try Again'
                  )}
                </Button>
              </div>
            ) : loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`group relative rounded-lg overflow-hidden transition-all duration-200 ${
                      selectedAvatar === avatar
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-2'
                    }`}
                  >
                    <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={avatar} 
                        alt={`${currentStyle.name} avatar ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {selectedAvatar === avatar && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
                        <div className="bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => generateAvatars(currentStyle)}
              disabled={isGenerating || loading}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generate New
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedAvatar) {
                    onSelect(selectedAvatar);
                  }
                  onClose?.();
                }}
                disabled={!selectedAvatar}
              >
                Save Avatar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate component for preview avatars to handle async loading
const PreviewAvatar = (props: { style: any; index: number }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const seed = `preview-${props.index}`;
        const avatar = await createAvatar(props.style, {
          seed: seed,
          size: 48,
          backgroundColor: ['b6e3f4'],
          radius: 50,
        }).toDataUri();
        setPreviewUrl(avatar);
      } catch (error) {
        console.error('Error loading preview:', error);
      }
    };
    
    loadPreview();
  }, [props.style, props.index]);

  if (!previewUrl) {
    return <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />;
  }

  return (
    <img
      src={previewUrl}
      alt="Preview"
      className="w-full h-full rounded-lg"
    />
  );
};

export default AvatarPicker; 