# flip-board-sdk

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build flip-board-sdk` to build the library.

## AI Text Generation

SDK allows the parent application (e.g. Bitrix) to handle AI text operations (fix grammar, translate) instead of direct backend requests.

### Setup

Pass `onAITextRequest` and optionally `onAITextCancel` callbacks when creating the SDK:

```typescript
import { WebSDK, SDKAITextRequestData, SDKAITextSuccessResult, SDKAITextErrorResult } from '@flip/sdk';

const sdk = new WebSDK({
  containerId: 'board-container',
  token: '...',
  appUrl: 'https://app.example.com',
  partnerId: '0',
  ui: {
    features: {
      aiTextGeneration: true, // enable AI buttons in the board UI
    },
  },
  events: {
    onAITextRequest: async (data: SDKAITextRequestData): Promise<SDKAITextSuccessResult | SDKAITextErrorResult> => {
      // data.requestId — unique request identifier
      // data.type — 'fix' (grammar correction) or 'translate'
      // data.text — text to process
      // data.language — target language code (only for type: 'translate'), e.g. 'en', 'ru', 'de'

      try {
        const result = await myAIService.generateText(data.type, data.text, data.language);
        return { result };
      } catch (error) {
        return {
          error: {
            code: 'LIMIT_EXCEEDED', // or 'SERVICE_UNAVAILABLE', 'UNKNOWN', etc.
            message: 'Human-readable error message shown to the user',
          },
        };
      }
    },
    onAITextCancel: (data) => {
      // data.requestId — ID of the cancelled request
      // Called when the user clicks "Stop" during generation
      myAIService.cancel(data.requestId);
    },
  },
});

sdk.init();
```

### Request flow

1. User selects text on the board and clicks an AI action (Fix / Translate)
2. SDK sends `onAITextRequest` callback with `SDKAITextRequestData`
3. Parent processes the request (e.g. calls Bitrix GPT) and returns the full result
4. Board displays the result to the user

### Types

| Type | Description |
|------|-------------|
| `SDKAITextRequestData` | `{ requestId, type, text, language? }` — request payload |
| `SDKAITextSuccessResult` | `{ result }` — successful response |
| `SDKAITextErrorResult` | `{ error: { code, message? } }` — error response |
| `SDKAITextCancelData` | `{ requestId }` — cancel notification |
| `SDKAITextOperationType` | `'fix' \| 'translate'` — supported operations |

### Error codes

The `code` field in `SDKAITextErrorResult` is a free-form string. Recommended values:

| Code | Meaning |
|------|---------|
| `LIMIT_EXCEEDED` | Portal AI generation limits exhausted |
| `SERVICE_UNAVAILABLE` | AI service is temporarily unavailable |
| `NOT_SUPPORTED` | `onAITextRequest` callback is not provided |
| `UNKNOWN` | Unspecified error |

If `message` is provided, it will be shown to the user instead of the default error text.