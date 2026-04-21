const fs = require("fs");
const file = "components/chat/multimodal-input.tsx";
let content = fs.readFileSync(file, "utf-8");

// 1. Add to Menu component definition
const defTarget = `function PureContextualActionsMenu({
  fileInputRef,
  onInsertTemplate,
  status,
  hasVision,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onInsertTemplate: (templateText: string) => void;
  status: UseChatHelpers<ChatMessage>["status"];
  hasVision: boolean;
}) {`;

const defReplacement = `function PureContextualActionsMenu({
  fileInputRef,
  onInsertTemplate,
  status,
  hasVision,
  isGeolocationEnabled,
  setIsGeolocationEnabled,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onInsertTemplate: (templateText: string) => void;
  status: UseChatHelpers<ChatMessage>["status"];
  hasVision: boolean;
  isGeolocationEnabled?: boolean;
  setIsGeolocationEnabled?: (v: boolean) => void;
}) {`;
content = content.replace(defTarget, defReplacement);

// 2. Add to Menu Usage
const usageTarget = `<ContextualActionsMenu
              fileInputRef={fileInputRef}
              hasVision={true}
              onInsertTemplate={handleInsertTemplate}
              status={status}
            />`;
const usageReplacement = `<ContextualActionsMenu
              fileInputRef={fileInputRef}
              hasVision={true}
              onInsertTemplate={handleInsertTemplate}
              status={status}
              isGeolocationEnabled={isGeolocationEnabled}
              setIsGeolocationEnabled={setIsGeolocationEnabled}
            />`;
content = content.replace(usageTarget, usageReplacement);

fs.writeFileSync(file, content, "utf-8");
