# Narration Template

Use this in a Code node before Together AI TTS.

```js
const letter = (i) => String.fromCharCode(65 + i);

return items.map((item, index) => {
  const q = item.json.question ?? item.json;
  const options = q.options.map((option, i) => `${letter(i)}. ${typeof option === 'string' ? option : option.text}`);
  const rawAnswers = q.correctAnswers ?? q.correctAnswer ?? [];
  const answers = Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers];

  const answerText = answers.map((answer) => {
    if (/^[A-H]$/i.test(answer)) {
      return options[answer.toUpperCase().charCodeAt(0) - 65] ?? answer;
    }
    return answer;
  }).join(', ');

  return {
    json: {
      ...item.json,
      number: index + 1,
      narration: [
        `Question ${index + 1}.`,
        q.question,
        `Your options are: ${options.join('. ')}.`,
        `The correct answer is ${answerText}.`,
        q.explanation ? `Here is why: ${q.explanation}` : ''
      ].filter(Boolean).join(' ')
    }
  };
});
```
