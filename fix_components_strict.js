const fs = require("fs");
const file = "components/chat/multimodal-input.tsx";
let content = fs.readFileSync(file, "utf-8");

// I made a mistake passing the props to ContextualActionsMenu vs PureContextualActionsMenu
// and using them inside the render. Let's fix that properly.

const menuTypeReplacementPoint =
  "isLearningEnabled: boolean;\n  isGeolocationEnabled?: boolean;\n  setIsGeolocationEnabled?: (v: boolean) => void;\n}) {";
const newMenuType =
  "isLearningEnabled: boolean;\n  isGeolocationEnabled?: boolean;\n  setIsGeolocationEnabled?: (v: boolean) => void;\n}) {"; // already there, but let's make sure it's applied

// Check where isGeolocationEnabled is used in PureContextualActionsMenu
// It's in the button render, but maybe the parameters weren't updated correctly.

const menuParamsPoint =
  "isLearningEnabled,\n  isGeolocationEnabled,\n  setIsGeolocationEnabled,\n}: {\n  isLearningEnabled: boolean;\n  isGeolocationEnabled?: boolean;\n  setIsGeolocationEnabled?: (v: boolean) => void;\n}) {";
// Let's replace the whole function definition to be sure.
const funcDefOld = `function PureContextualActionsMenu({
  isLearningEnabled,
}: {
  isLearningEnabled: boolean;
}) {`;

const funcDefNew = `function PureContextualActionsMenu({
  isLearningEnabled,
  isGeolocationEnabled,
  setIsGeolocationEnabled,
}: {
  isLearningEnabled: boolean;
  isGeolocationEnabled?: boolean;
  setIsGeolocationEnabled?: (v: boolean) => void;
}) {`;

content = content.replace(funcDefOld, funcDefNew);

// If I failed to replace it previously, let's try another pattern since it may have been partially updated.
const partialDef = `function PureContextualActionsMenu({
  isLearningEnabled,
  isGeolocationEnabled,
  setIsGeolocationEnabled,
}: {
  isLearningEnabled: boolean;
}) {`;
content = content.replace(partialDef, funcDefNew);

const partialDef2 = `function PureContextualActionsMenu({
  isLearningEnabled,
}: {
  isLearningEnabled: boolean;
  isGeolocationEnabled?: boolean;
  setIsGeolocationEnabled?: (v: boolean) => void;
}) {`;
content = content.replace(partialDef2, funcDefNew);

fs.writeFileSync(file, content, "utf-8");
