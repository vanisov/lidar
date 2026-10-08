// Screencast frames arrive only on change, so ffmpeg holds each one for its real duration to keep motion timing.
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export async function startScreencast(ctx, page) {
  const dir = await mkdtemp(path.join(tmpdir(), 'lidar-demo-'));
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ file, t: metadata.timestamp });
    await writeFile(file, Buffer.from(data, 'base64'));
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });

  return {
    async stop(outFile, { hold = 0.6 } = {}) {
      await cdp.send('Page.stopScreencast');
      await page.waitForTimeout(300); // let in-flight frames land
      const list = frames.map((f, i) => `file '${f.file}'\nduration ${((frames[i + 1]?.t ?? f.t + hold) - f.t).toFixed(4)}`);
      await writeFile(path.join(dir, 'list.txt'), `ffconcat version 1.0\n${list.join('\n')}\nfile '${frames.at(-1).file}'\n`);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'),
        '-vf', 'fps=30,scale=1920:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
        '-movflags', '+faststart', '-an', outFile]);
      await rm(dir, { recursive: true });
      return frames.length;
    },
  };
}
