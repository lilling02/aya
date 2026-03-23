# Workspace Feature Verification Guide

This document provides verification steps for testing the multi-device workbench feature.

## Build Verification

```bash
cd C:\ast\aya\aya
pnpm install
pnpm dev
```

## URL Routes

- **Screenshot Overview:** `?page=workspace&type=screenshot`
- **Command Line:** `?page=workspace&type=cmd`

---

## Screenshot Overview Page (`?page=workspace&type=screenshot`)

### Verification Checklist

- [ ] 3-column grid layout displays correctly
- [ ] Device cards show screenshot, status dot, device name, Android version
- [ ] Offline devices appear grayscale with overlay
- [ ] Refresh interval selector works (5s/10s/30s/手动)
- [ ] Device count displays (e.g., "2 / 3 在线")
- [ ] Right-click shows context menu with "打开设备预览" option
- [ ] Refresh button appears on card hover

---

## Command Line Page (`?page=workspace&type=cmd`)

### Verification Checklist

- [ ] 7:3 split layout (main panel 70%, sidebar 30%)
- [ ] Mini panels show device name and status
- [ ] Click mini panel switches main panel
- [ ] Device selector checkboxes work (全选/全不选/individual)
- [ ] Command input accepts text
- [ ] History button opens command history modal
- [ ] Broadcast button sends command to selected devices
- [ ] Terminal output displays command results

---

## Command History Modal

### Verification Checklist

- [ ] Two tabs: 历史 and 收藏
- [ ] Commands display with timestamp
- [ ] Star button toggles favorite
- [ ] Edit button allows alias editing
- [ ] Click command fills input and closes modal

---

## Test Scenarios

### Scenario 1: Screenshot Overview Workflow
1. Navigate to `?page=workspace&type=screenshot`
2. Verify all connected devices display in grid
3. Select different refresh intervals and verify auto-refresh works
4. Right-click a device card and verify context menu appears
5. Verify clicking "打开设备预览" opens device preview

### Scenario 2: Command Broadcast Workflow
1. Navigate to `?page=workspace&type=cmd`
2. Select multiple devices using checkboxes
3. Enter a command in the input field
4. Click broadcast and verify command executes on all selected devices
5. Verify terminal output shows results from each device

### Scenario 3: Command History Workflow
1. Execute a command on devices
2. Click history button to open modal
3. Switch between 历史 and 收藏 tabs
4. Star a command to add to favorites
5. Click a history item to refill input and close modal
