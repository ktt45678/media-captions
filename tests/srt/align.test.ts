import { parseResponse } from 'media-captions';

it('should parse SSA alignment tags', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const lines = [
        '1\n',
        '00:00:12,720 --> 00:00:15,120\n',
        "{\\an8}This is 327, I'm going in\n",
        '\n',
        '2\n',
        '00:00:15,300 --> 00:00:16,080\n',
        'Good luck, {\\an1}Agent\n',
        '\n',
      ];

      const encoder = new TextEncoder();
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }

      controller.close();
    },
  });

  const { cues, errors } = await parseResponse(
    new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/srt',
      },
    }),
  );

  expect(errors).toHaveLength(0);
  expect(cues).toHaveLength(2);

  // First cue: top center alignment ({\an8})
  expect(cues[0].text).toBe("This is 327, I'm going in");
  expect(cues[0].snapToLines).toBe(false);
  expect(cues[0].line).toBe(0);
  expect(cues[0].lineAlign).toBe('start');
  expect(cues[0].align).toBe('center');
  expect(cues[0].position).toBe(50);

  // Second cue: bottom left alignment ({\an1})
  expect(cues[1].text).toBe('Good luck, Agent');
  expect(cues[1].snapToLines).toBe(false);
  expect(cues[1].line).toBe(100);
  expect(cues[1].lineAlign).toBe('end');
  expect(cues[1].align).toBe('start');
  expect(cues[1].position).toBe(0);
});
