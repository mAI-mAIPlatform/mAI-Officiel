const fs = require("fs");
let code = fs.readFileSync("components/chat/shell.tsx", "utf8");

code = code.replace(
  /<ChatHeader\s+chatId={chatId}\s+isReadonly={isReadonly}\s+selectedVisibilityType={visibilityType}\s+\/>/g,
  `<ChatHeader
            chatId={chatId}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
            selectedModelId={currentModelId}
            onModelChange={setCurrentModelId}
          />`
);

fs.writeFileSync("components/chat/shell.tsx", code);

let headerCode = fs.readFileSync("components/chat/chat-header.tsx", "utf8");
headerCode = headerCode.replace(
  `import { VisibilitySelector, type VisibilityType } from "./visibility-selector";`,
  `import { VisibilitySelector, type VisibilityType } from "./visibility-selector";\nimport { ModelSelectorCompact } from "./model-selector-compact";`
);

headerCode = headerCode.replace(
  `function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {`,
  `function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  selectedModelId,
  onModelChange,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  selectedModelId: string;
  onModelChange: (id: string) => void;
}) {`
);

headerCode = headerCode.replace(
  `      <div className="ml-1 flex items-center gap-2">
        <Image
          alt="Logo mAI"
          className="size-5"
          height={20}
          src="/mai-logo.svg"
          width={20}
        />
        <span className="font-semibold text-sm">mAI</span>
      </div>`,
  `      <div className="ml-1 flex items-center gap-2">
        <Image
          alt="Logo mAI"
          className="size-5"
          height={20}
          src="/mai-logo.svg"
          width={20}
        />
        <ModelSelectorCompact
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
        />
      </div>`
);

headerCode = headerCode.replace(
  `  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );`,
  `  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedModelId === nextProps.selectedModelId
  );`
);

fs.writeFileSync("components/chat/chat-header.tsx", headerCode);
