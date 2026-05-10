# Together AI TTS Node Contract

The golden path uses Together AI TTS. The renderer generates audio from
`TOGETHER_API_KEY` when the workflow submits `dryRun: false` and no
`audioAssets`.

If you prefer doing TTS directly in n8n, use an HTTP Request node with this
contract.

## Request

`POST https://api.together.ai/v1/audio/speech`

Headers:

```text
Authorization: Bearer {{$credentials.togetherAi.apiKey}}
Content-Type: application/json
```

Body:

```json
{
  "model": "hexgrad/Kokoro-82M",
  "voice": "af_bella",
  "input": "Question 1. ... The correct answer is ... Explanation: ...",
  "speed": 0.95,
  "response_format": "wav"
}
```

Store the binary response as:

```text
q-{{$json.number.toString().padStart(2, '0')}}.wav
```

The renderer accepts audio as:

```json
{
  "fileName": "q-01.wav",
  "contentBase64": "..."
}
```

For visual-only demos, set `dryRun: true` and omit `audioAssets`.
