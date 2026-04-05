const fs = require("fs");
let code = fs.readFileSync("components/chat/multimodal-input.tsx", "utf8");

// Add MicIcon from lucide-react if not present
if (!code.includes("MicIcon")) {
  code = code.replace("import {", "import { MicIcon, ");
}

// Add state for recording and a placeholder function for Deepgram API dictation.
code = code.replace(
  "const fileInputRef = useRef<HTMLInputElement>(null);",
  `const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Logic to stop recording would go here.
      toast.success("Dictée vocale arrêtée.");
      return;
    }

    try {
      setIsRecording(true);
      toast.info("Enregistrement vocal démarré... (Deepgram API)");
      // Mock dictation append:
      setTimeout(() => {
         setInput((prev) => prev + (prev ? " " : "") + "Texte dicté via Deepgram API.");
         setIsRecording(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      setIsRecording(false);
      toast.error("Erreur d'accès au microphone.");
    }
  };`
);

// Add the Mic button to the prompt tools
code = code.replace(
  "<ContextualActionsMenu",
  `<Button
              className="size-8 rounded-full bg-background"
              onClick={toggleRecording}
              size="icon"
              type="button"
              variant={isRecording ? "destructive" : "ghost"}
            >
              <MicIcon className={cn("size-4", isRecording && "animate-pulse")} />
            </Button>
            <ContextualActionsMenu`
);

fs.writeFileSync("components/chat/multimodal-input.tsx", code);
