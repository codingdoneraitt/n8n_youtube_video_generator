const response = await fetch('http://localhost:3030/render', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    runId: `smoke-${Date.now()}`,
    dryRun: true,
    title: 'n8n Practice Exam Walkthrough',
    examTitle: 'n8n Automation Fundamentals',
    sourceApp: 'smoke-test',
    questions: [
      {
        id: 'sample-001',
        question: 'Which n8n node is the best fit when a workflow should continue only if status equals approved?',
        options: ['Merge node', 'If node', 'Wait node', 'Manual Trigger'],
        correctAnswers: ['If node'],
        explanation: 'The If node evaluates a boolean condition and routes matching items down the true branch.',
        topic: 'Core Nodes',
        difficulty: 'easy',
      },
    ],
  }),
});

if (!response.ok) {
  throw new Error(`Render request failed: ${response.status} ${await response.text()}`);
}

const job = await response.json();
console.log(`created job ${job.id}`);

for (let i = 0; i < 120; i++) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const statusResponse = await fetch(`http://localhost:3030/jobs/${job.id}`);
  const status = await statusResponse.json();
  console.log(`${status.id}: ${status.status}`);
  if (status.status === 'done') {
    console.log(status.outputUrl);
    process.exit(0);
  }
  if (status.status === 'failed') {
    throw new Error(status.error || 'Render failed');
  }
}

throw new Error('Timed out waiting for render');
