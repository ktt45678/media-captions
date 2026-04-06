import type { CaptionsParser } from '../parse/types';
import { VTTCue } from '../vtt/vtt-cue';
import { VTTBlock, VTTParser } from '../vtt/vtt-parser';

const MILLISECOND_SEP_RE = /,/g,
  TIMESTAMP_SEP = '-->',
  ALIGN_TAG_RE = /\{\\an([1-9])\}/;

export class SRTParser extends VTTParser implements CaptionsParser {
  override parse(line: string, lineCount: number): void {
    if (line === '') {
      if (this._cue) {
        const alignMatch = this._cue.text.match(ALIGN_TAG_RE);
        if (alignMatch) {
          this._cue.text = this._cue.text.replace(ALIGN_TAG_RE, '');
          applySSAAlignment(this._cue, parseInt(alignMatch[1], 10));
        }

        this._cues.push(this._cue);
        this._init.onCue?.(this._cue);
        this._cue = null;
      }

      this._block = VTTBlock.None;
    } else if (this._block === VTTBlock.Cue) {
      this._cue!.text += (this._cue!.text ? '\n' : '') + line;
    } else if (line.includes(TIMESTAMP_SEP)) {
      const result = this._parseTimestamp(line, lineCount);
      if (result) {
        this._cue = new VTTCue(result[0], result[1], result[2].join(' '));
        this._cue.id = this._prevLine;
        this._block = VTTBlock.Cue;
      }
    }

    this._prevLine = line;
  }

  protected override _parseTimestamp(line: string, lineCount: number) {
    return super._parseTimestamp(line.replace(MILLISECOND_SEP_RE, '.'), lineCount);
  }
}

export default function createSRTParser() {
  return new SRTParser();
}

function applySSAAlignment(cue: VTTCue, alignment: number) {
  if (alignment >= 1 && alignment <= 9) {
    cue.snapToLines = false;

    if (alignment >= 7) {
      cue.line = 0;
      cue.lineAlign = 'start';
    } else if (alignment >= 4) {
      cue.line = 50;
      cue.lineAlign = 'center';
    } else {
      cue.line = 100;
      cue.lineAlign = 'end';
    }

    const hAlign = alignment % 3;
    if (hAlign === 1) {
      cue.align = 'start';
      cue.position = 0;
    } else if (hAlign === 2) {
      cue.align = 'center';
      cue.position = 50;
    } else if (hAlign === 0) {
      cue.align = 'end';
      cue.position = 100;
    }
  }
}
