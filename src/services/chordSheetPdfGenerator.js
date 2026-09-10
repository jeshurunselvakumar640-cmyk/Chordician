/**
 * Chordician Reference PDF Generator
 * Creates an elegant, high-resolution A4 multi-page PDF reference guide with Chordician branding,
 * owner letterhead, subtle background watermark, and beautifully structured tables.
 */

export async function generateChordReferencePDF(onProgress = null) {
  if (onProgress) onProgress('Preparing document layout...');

  // Helper to create page watermark
  const createWatermark = () => `
    <div style="position: absolute; top: 52%; left: 50%; transform: translate(-50%, -50%) rotate(-32deg); font-size: 88px; font-weight: 900; color: rgba(99, 102, 241, 0.045); letter-spacing: 0.16em; text-transform: uppercase; pointer-events: none; user-select: none; z-index: 0; white-space: nowrap; font-family: 'Inter', -apple-system, sans-serif;">
      CHORDICIAN
    </div>
  `;

  // Helper to create letterhead
  const createLetterhead = (pageTitle, pageSubtitle) => `
    <div style="position: relative; z-index: 1; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);">
            🎹
          </div>
          <div>
            <div style="font-size: 20px; font-weight: 800; color: #312e81; letter-spacing: -0.02em; line-height: 1.1;">
              Chordician
            </div>
            <div style="font-size: 10px; font-weight: 600; color: #6366f1; letter-spacing: 0.04em; text-transform: uppercase;">
              Your chords. Your key.
            </div>
          </div>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #1e1b4b; margin-top: 6px;">
          ${pageTitle}
        </div>
      </div>

      <div style="text-align: right;">
        <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(79, 70, 229, 0.08); border: 1px solid rgba(79, 70, 229, 0.2); font-size: 9.5px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.04em;">
          Master Reference Edition
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 3px;">
          Owner: <span style="color: #4f46e5;">Jeshurun Selvakumar</span>
        </div>
        <div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 1px;">
          chordician.vercel.app
        </div>
      </div>
    </div>
  `;

  // Helper to create footer
  const createFooter = (pageNum, totalPages) => `
    <div style="position: relative; z-index: 1; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #64748b;">
      <div>
        <strong style="color: #4338ca;">Chordician</strong> • Created by <strong style="color: #1e293b;">Jeshurun Selvakumar</strong> • All Rights Reserved
      </div>
      <div style="font-weight: 600; color: #475569; font-family: monospace;">
        Page ${pageNum} of ${totalPages}
      </div>
    </div>
  `;

  // Page 1 Container: Primary Triads & 7ths
  const page1 = document.createElement('div');
  page1.style.cssText = `
    width: 794px;
    height: 1123px;
    padding: 30px 34px;
    box-sizing: border-box;
    position: relative;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  `;

  page1.innerHTML = `
    ${createWatermark()}
    <div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 11px; flex: 1;">
      ${createLetterhead('Part 1: Primary Triads & 7th Chords', 'Fundamental Harmonies')}

      <!-- 1. Major Chords -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #e0e7ff; padding: 5px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe;">
          <span style="font-size: 11.5px; font-weight: 800; color: #312e81;">1. MAJOR CHORDS</span>
          <span style="font-size: 10px; font-weight: 700; color: #4338ca; background: #ffffff; padding: 2px 7px; border-radius: 4px; border: 1px solid #c7d2fe; font-family: monospace;">Formula: 1–3–5</span>
        </div>
        <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; text-align: left;">
          <tbody>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca; width: 35px;">C</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">C–E–G</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca; width: 35px;">E</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">E–G♯–B</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca; width: 35px;">G♯</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">G♯–C–D♯</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">C♯</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">C♯–F–G♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">F</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">F–A–C</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">A</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">A–C♯–E</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">D</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">D–F♯–A</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">F♯</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">F♯–A♯–C♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">A♯</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">A♯–D–F</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">D♯</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">D♯–G–A♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">G</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">G–B–D</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">B</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">B–D♯–F♯</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2. Minor Chords -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #f1f5f9; padding: 5px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 11.5px; font-weight: 800; color: #1e293b;">2. MINOR CHORDS</span>
          <span style="font-size: 10px; font-weight: 700; color: #475569; background: #ffffff; padding: 2px 7px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: monospace;">Formula: 1–♭3–5</span>
        </div>
        <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; text-align: left;">
          <tbody>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7; width: 42px;">Cm</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">C–E♭–G</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7; width: 42px;">Em</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">E–G–B</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7; width: 42px;">G♯m</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">G♯–B–D♯</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">C♯m</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">C♯–E–G♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">Fm</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">F–A♭–C</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">Am</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">A–C–E</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">Dm</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">D–F–A</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">F♯m</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">F♯–A–C♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">A♯m</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">A♯–C♯–F</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">D♯m</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">D♯–F♯–A♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">Gm</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">G–B♭–D</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #0284c7;">Bm</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">B–D–F♯</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. Dominant 7th Chords -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #e0e7ff; padding: 5px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe;">
          <span style="font-size: 11.5px; font-weight: 800; color: #312e81;">3. DOMINANT 7TH CHORDS</span>
          <span style="font-size: 10px; font-weight: 700; color: #4338ca; background: #ffffff; padding: 2px 7px; border-radius: 4px; border: 1px solid #c7d2fe; font-family: monospace;">Formula: 1–3–5–♭7</span>
        </div>
        <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; text-align: left;">
          <tbody>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca; width: 38px;">C7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">C–E–G–B♭</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca; width: 38px;">E7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">E–G♯–B–D</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca; width: 38px;">G♯7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">G♯–C–D♯–F♯</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">C♯7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">C♯–F–G♯–B</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">F7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">F–A–C–E♭</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">A7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">A–C♯–E–G</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">D7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">D–F♯–A–C</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">F♯7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">F♯–A♯–C♯–E</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">A♯7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">A♯–D–F–G♯</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">D♯7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">D♯–G–A♯–C♯</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">G7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">G–B–D–F</td>
              <td style="padding: 3.5px 10px; font-weight: 700; color: #4338ca;">B7</td><td style="padding: 3.5px 10px; font-family: monospace; font-weight: 600;">B–D♯–F♯–A</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4 & 5. Major 7th & Minor 7th -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
          <div style="background: #f1f5f9; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 11px; font-weight: 800; color: #1e293b;">4. MAJOR 7TH</span>
            <span style="font-size: 9.5px; font-weight: 700; color: #475569; font-family: monospace;">1–3–5–7</span>
          </div>
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Cmaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">C–E–G–B</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Dmaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">D–F♯–A–C♯</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Emaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">E–G♯–B–D♯</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Fmaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">F–A–C–E</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Gmaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">G–B–D–F♯</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Amaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">A–C♯–E–G♯</td></tr>
              <tr><td style="padding: 2.5px 8px; font-weight: 700; color: #4338ca;">Bmaj7</td><td style="padding: 2.5px 8px; font-family: monospace;">B–D♯–F♯–A♯</td></tr>
            </tbody>
          </table>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
          <div style="background: #f1f5f9; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 11px; font-weight: 800; color: #1e293b;">5. MINOR 7TH</span>
            <span style="font-size: 9.5px; font-weight: 700; color: #475569; font-family: monospace;">1–♭3–5–♭7</span>
          </div>
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Cm7</td><td style="padding: 2.5px 8px; font-family: monospace;">C–E♭–G–B♭</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Dm7</td><td style="padding: 2.5px 8px; font-family: monospace;">D–F–A–C</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Em7</td><td style="padding: 2.5px 8px; font-family: monospace;">E–G–B–D</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Fm7</td><td style="padding: 2.5px 8px; font-family: monospace;">F–A♭–C–E♭</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Gm7</td><td style="padding: 2.5px 8px; font-family: monospace;">G–B♭–D–F</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Am7</td><td style="padding: 2.5px 8px; font-family: monospace;">A–C–E–G</td></tr>
              <tr><td style="padding: 2.5px 8px; font-weight: 700; color: #0284c7;">Bm7</td><td style="padding: 2.5px 8px; font-family: monospace;">B–D–F♯–A</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ${createFooter(1, 3)}
  `;

  // Page 2 Container: Suspended, Diminished, Extensions, Altered & Slash Chords
  const page2 = document.createElement('div');
  page2.style.cssText = `
    width: 794px;
    height: 1123px;
    padding: 30px 34px;
    box-sizing: border-box;
    position: relative;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  `;

  page2.innerHTML = `
    ${createWatermark()}
    <div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 10px; flex: 1;">
      ${createLetterhead('Part 2: Suspended, Diminished, Augmented & Extensions', 'Advanced Voicings')}

      <!-- 6. Diminished & Augmented -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
          <div style="background: #e0e7ff; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe;">
            <span style="font-size: 11px; font-weight: 800; color: #312e81;">6. DIMINISHED (dim)</span>
            <span style="font-size: 9.5px; font-weight: 700; color: #4338ca; font-family: monospace;">1–♭3–♭5</span>
          </div>
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Cdim</td><td style="padding: 2px 8px; font-family: monospace;">C–E♭–G♭</td><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">F♯dim</td><td style="padding: 2px 8px; font-family: monospace;">F♯–A–C</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">C♯dim</td><td style="padding: 2px 8px; font-family: monospace;">C♯–E–G</td><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Gdim</td><td style="padding: 2px 8px; font-family: monospace;">G–B♭–D♭</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Ddim</td><td style="padding: 2px 8px; font-family: monospace;">D–F–A♭</td><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">G♯dim</td><td style="padding: 2px 8px; font-family: monospace;">G♯–B–D</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">D♯dim</td><td style="padding: 2px 8px; font-family: monospace;">D♯–F♯–A</td><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Adim</td><td style="padding: 2px 8px; font-family: monospace;">A–C–E♭</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Edim</td><td style="padding: 2px 8px; font-family: monospace;">E–G–B♭</td><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">A♯dim</td><td style="padding: 2px 8px; font-family: monospace;">A♯–C♯–E</td></tr>
              <tr><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Fdim</td><td style="padding: 2px 8px; font-family: monospace;">F–A♭–B</td><td style="padding: 2px 8px; font-weight: 700; color: #4338ca;">Bdim</td><td style="padding: 2px 8px; font-family: monospace;">B–D–F</td></tr>
            </tbody>
          </table>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
          <div style="background: #e0e7ff; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe;">
            <span style="font-size: 11px; font-weight: 800; color: #312e81;">7. AUGMENTED (aug)</span>
            <span style="font-size: 9.5px; font-weight: 700; color: #4338ca; font-family: monospace;">1–3–♯5</span>
          </div>
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Caug</td><td style="padding: 2px 8px; font-family: monospace;">C–E–G♯</td><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">F♯aug</td><td style="padding: 2px 8px; font-family: monospace;">F♯–A♯–D</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">C♯aug</td><td style="padding: 2px 8px; font-family: monospace;">C♯–F–A</td><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Gaug</td><td style="padding: 2px 8px; font-family: monospace;">G–B–D♯</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Daug</td><td style="padding: 2px 8px; font-family: monospace;">D–F♯–A♯</td><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">G♯aug</td><td style="padding: 2px 8px; font-family: monospace;">G♯–C–E</td></tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">D♯aug</td><td style="padding: 2px 8px; font-family: monospace;">D♯–G–B</td><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Aaug</td><td style="padding: 2px 8px; font-family: monospace;">A–C♯–F</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Eaug</td><td style="padding: 2px 8px; font-family: monospace;">E–G♯–C</td><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">A♯aug</td><td style="padding: 2px 8px; font-family: monospace;">A♯–D–F♯</td></tr>
              <tr><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Faug</td><td style="padding: 2px 8px; font-family: monospace;">F–A–C♯</td><td style="padding: 2px 8px; font-weight: 700; color: #b45309;">Baug</td><td style="padding: 2px 8px; font-family: monospace;">B–D♯–G</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 8. Suspended Chords (Sus2 & Sus4) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #f1f5f9; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 800; color: #1e293b;">8. SUSPENDED CHORDS (Sus2 & Sus4)</span>
          <span style="font-size: 9.5px; font-weight: 700; color: #475569; font-family: monospace;">Sus2: 1–2–5 | Sus4: 1–4–5</span>
        </div>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Csus2</td><td style="padding: 3px 8px; font-family: monospace;">C–D–G</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Csus4</td><td style="padding: 3px 8px; font-family: monospace;">C–F–G</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Gsus2</td><td style="padding: 3px 8px; font-family: monospace;">G–A–D</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Gsus4</td><td style="padding: 3px 8px; font-family: monospace;">G–C–D</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Dsus2</td><td style="padding: 3px 8px; font-family: monospace;">D–E–A</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Dsus4</td><td style="padding: 3px 8px; font-family: monospace;">D–G–A</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Asus2</td><td style="padding: 3px 8px; font-family: monospace;">A–B–E</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Asus4</td><td style="padding: 3px 8px; font-family: monospace;">A–D–E</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Esus2</td><td style="padding: 3px 8px; font-family: monospace;">E–F♯–B</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Esus4</td><td style="padding: 3px 8px; font-family: monospace;">E–A–B</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Bsus2</td><td style="padding: 3px 8px; font-family: monospace;">B–C♯–F♯</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Bsus4</td><td style="padding: 3px 8px; font-family: monospace;">B–E–F♯</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 3px 8px; font-weight: 700; color: #4338ca;">Fsus2</td><td style="padding: 3px 8px; font-family: monospace;">F–G–C</td>
              <td style="padding: 3px 8px; font-weight: 700; color: #059669;">Fsus4</td><td style="padding: 3px 8px; font-family: monospace;">F–B♭–C</td>
              <td colspan="4" style="padding: 3px 8px; color: #64748b; font-style: italic;">Transposable to all 12 root keys</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 9 & 10. Power 5th, 6th, Minor 6th & Add9 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
          <div style="background: #f1f5f9; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 11px; font-weight: 800; color: #1e293b;">9. POWER & 6TH CHORDS</span>
            <span style="font-size: 9px; font-weight: 700; color: #475569; font-family: monospace;">5: 1–5 | 6: 1–3–5–6</span>
          </div>
          <div style="padding: 6px 10px; font-size: 9.5px; line-height: 1.5; font-family: monospace;">
            <div><strong>C5</strong>=C–G &nbsp;|&nbsp; <strong>D5</strong>=D–A &nbsp;|&nbsp; <strong>E5</strong>=E–B &nbsp;|&nbsp; <strong>G5</strong>=G–D</div>
            <div style="margin-top: 3px;"><strong>C6</strong> = C–E–G–A &nbsp;|&nbsp; <strong>Cm6</strong> = C–E♭–G–A</div>
            <div><strong>D6</strong> = D–F♯–A–B &nbsp;|&nbsp; <strong>Dm6</strong> = D–F–A–B</div>
            <div><strong>G6</strong> = G–B–D–E &nbsp;|&nbsp; <strong>Gm6</strong> = G–B♭–D–E</div>
          </div>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
          <div style="background: #f1f5f9; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 11px; font-weight: 800; color: #1e293b;">10. ADD9 & MINOR ADD9</span>
            <span style="font-size: 9px; font-weight: 700; color: #475569; font-family: monospace;">Add9: 1–3–5–9</span>
          </div>
          <div style="padding: 6px 10px; font-size: 9.5px; line-height: 1.5; font-family: monospace;">
            <div><strong>Cadd9</strong> = C–E–G–D &nbsp;|&nbsp; <strong>Cmadd9</strong> = C–E♭–G–D</div>
            <div><strong>Dadd9</strong> = D–F♯–A–E &nbsp;|&nbsp; <strong>Dmadd9</strong> = D–F–A–E</div>
            <div><strong>Eadd9</strong> = E–G♯–B–F♯ &nbsp;|&nbsp; <strong>Emadd9</strong> = E–G–B–F♯</div>
            <div><strong>Gadd9</strong> = G–B–D–A &nbsp;|&nbsp; <strong>Aadd9</strong> = A–C♯–E–B</div>
          </div>
        </div>
      </div>

      <!-- 11 & 12. Extended Chords, Altered & Slash Inversions -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #e0e7ff; padding: 4.5px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe;">
          <span style="font-size: 11px; font-weight: 800; color: #312e81;">11–17. EXTENDED, ALTERED DOMINANTS & SLASH INVERSIONS</span>
          <span style="font-size: 9px; font-weight: 700; color: #4338ca; font-family: monospace;">Gospel / Jazz / Worship</span>
        </div>
        <div style="padding: 8px 12px; font-size: 9.5px; line-height: 1.55; display: flex; flex-direction: column; gap: 4px;">
          <div><strong style="color: #4338ca;">9th / 11th / 13th:</strong> <span style="font-family: monospace;">C9 = C–E–G–B♭–D | Cmaj9 = C–E–G–B–D | Cm9 = C–E♭–G–B♭–D | C11 = C–E–G–B♭–D–F | C13 = C–E–G–B♭–D–F–A</span></div>
          <div><strong style="color: #0284c7;">Half-Diminished (m7♭5):</strong> <span style="font-family: monospace;">Cm7♭5 = C–E♭–G♭–B♭ | Dm7♭5 = D–F–A♭–C | Em7♭5 = E–G–B♭–D | Am7♭5 = A–C–E♭–G</span></div>
          <div><strong style="color: #b45309;">Altered Dominants:</strong> <span style="font-family: monospace;">C7♭5, C7♯5, C7♭9 (C–E–G–B♭–D♭), C7♯9 (C–E–G–B♭–D♯), C7♯11, C7♭13, C7♯5♭9, C7♯5♯9, C7♭5♭9, C7♭5♯9</span></div>
          <div><strong style="color: #059669;">Slash Chords (Keyboard Inversions):</strong> <span style="font-family: monospace;">C/E (E bass + C-E-G) | C/G (G bass + C-E-G) | G/B (B bass + G-B-D) | Dm/F (F bass + D-F-A) | Am/C (C bass + A-C-E) | F/A (A bass + F-A-C)</span></div>
        </div>
      </div>
    </div>
    ${createFooter(2, 3)}
  `;

  // Page 3 Container: Complete Chromatic Scales
  const page3 = document.createElement('div');
  page3.style.cssText = `
    width: 794px;
    height: 1123px;
    padding: 30px 34px;
    box-sizing: border-box;
    position: relative;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  `;

  page3.innerHTML = `
    ${createWatermark()}
    <div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; flex: 1;">
      ${createLetterhead('Part 3: Complete Chromatic Scale Reference', 'Major & Natural Minor Scales')}

      <!-- Major Scales -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #e0e7ff; padding: 5px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c7d2fe;">
          <span style="font-size: 11.5px; font-weight: 800; color: #312e81;">MAJOR SCALES REFERENCE</span>
          <span style="font-size: 10px; font-weight: 700; color: #4338ca; background: #ffffff; padding: 2px 7px; border-radius: 4px; border: 1px solid #c7d2fe; font-family: monospace;">Formula: 1–2–3–4–5–6–7</span>
        </div>
        <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; text-align: left;">
          <tbody>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca; width: 85px;">C Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">C &nbsp; D &nbsp; E &nbsp; F &nbsp; G &nbsp; A &nbsp; B &nbsp; C</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">C♯ Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">C♯ &nbsp; D♯ &nbsp; E♯ &nbsp; F♯ &nbsp; G♯ &nbsp; A♯ &nbsp; B♯ &nbsp; C♯</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">D Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">D &nbsp; E &nbsp; F♯ &nbsp; G &nbsp; A &nbsp; B &nbsp; C♯ &nbsp; D</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">E♭ Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">E♭ &nbsp; F &nbsp; G &nbsp; A♭ &nbsp; B♭ &nbsp; C &nbsp; D &nbsp; E♭</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">E Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">E &nbsp; F♯ &nbsp; G♯ &nbsp; A &nbsp; B &nbsp; C♯ &nbsp; D♯ &nbsp; E</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">F Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">F &nbsp; G &nbsp; A &nbsp; B♭ &nbsp; C &nbsp; D &nbsp; E &nbsp; F</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">F♯ Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">F♯ &nbsp; G♯ &nbsp; A♯ &nbsp; B &nbsp; C♯ &nbsp; D♯ &nbsp; E♯ &nbsp; F♯</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">G Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">G &nbsp; A &nbsp; B &nbsp; C &nbsp; D &nbsp; E &nbsp; F♯ &nbsp; G</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">A♭ Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">A♭ &nbsp; B♭ &nbsp; C &nbsp; D♭ &nbsp; E♭ &nbsp; F &nbsp; G &nbsp; A♭</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">A Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">A &nbsp; B &nbsp; C♯ &nbsp; D &nbsp; E &nbsp; F♯ &nbsp; G♯ &nbsp; A</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">B♭ Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">B♭ &nbsp; C &nbsp; D &nbsp; E♭ &nbsp; F &nbsp; G &nbsp; A &nbsp; B♭</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 4px 10px; font-weight: 700; color: #4338ca;">B Major</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">B &nbsp; C♯ &nbsp; D♯ &nbsp; E &nbsp; F♯ &nbsp; G♯ &nbsp; A♯ &nbsp; B</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Natural Minor Scales -->
      <div style="border: 1px solid #cbd5e1; border-radius: 7px; overflow: hidden; background: #ffffff;">
        <div style="background: #f1f5f9; padding: 5px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 11.5px; font-weight: 800; color: #1e293b;">NATURAL MINOR SCALES REFERENCE</span>
          <span style="font-size: 10px; font-weight: 700; color: #475569; background: #ffffff; padding: 2px 7px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: monospace;">Formula: 1–2–♭3–4–5–♭6–♭7</span>
        </div>
        <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; text-align: left;">
          <tbody>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7; width: 85px;">C Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">C &nbsp; D &nbsp; E♭ &nbsp; F &nbsp; G &nbsp; A♭ &nbsp; B♭ &nbsp; C</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">C♯ Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">C♯ &nbsp; D♯ &nbsp; E &nbsp; F♯ &nbsp; G♯ &nbsp; A &nbsp; B &nbsp; C♯</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">D Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">D &nbsp; E &nbsp; F &nbsp; G &nbsp; A &nbsp; B♭ &nbsp; C &nbsp; D</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">E♭ Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">E♭ &nbsp; F &nbsp; G♭ &nbsp; A♭ &nbsp; B♭ &nbsp; C♭ &nbsp; D♭ &nbsp; E♭</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">E Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">E &nbsp; F♯ &nbsp; G &nbsp; A &nbsp; B &nbsp; C &nbsp; D &nbsp; E</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">F Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">F &nbsp; G &nbsp; A♭ &nbsp; B♭ &nbsp; C &nbsp; D♭ &nbsp; E♭ &nbsp; F</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">F♯ Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">F♯ &nbsp; G♯ &nbsp; A &nbsp; B &nbsp; C♯ &nbsp; D &nbsp; E &nbsp; F♯</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">G Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">G &nbsp; A &nbsp; B♭ &nbsp; C &nbsp; D &nbsp; E♭ &nbsp; F &nbsp; G</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">G♯ Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">G♯ &nbsp; A♯ &nbsp; B &nbsp; C♯ &nbsp; D♯ &nbsp; E &nbsp; F♯ &nbsp; G♯</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">A Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">A &nbsp; B &nbsp; C &nbsp; D &nbsp; E &nbsp; F &nbsp; G &nbsp; A</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">B♭ Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">B♭ &nbsp; C &nbsp; D♭ &nbsp; E♭ &nbsp; F &nbsp; G♭ &nbsp; A♭ &nbsp; B♭</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 4px 10px; font-weight: 700; color: #0284c7;">B Minor</td><td style="padding: 4px 10px; font-family: monospace; font-weight: 600;">B &nbsp; C♯ &nbsp; D &nbsp; E &nbsp; F♯ &nbsp; G &nbsp; A &nbsp; B</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    ${createFooter(3, 3)}
  `;

  // Append pages to DOM offscreen
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.appendChild(page1);
  container.appendChild(page2);
  container.appendChild(page3);
  document.body.appendChild(container);

  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    pdf.save('Chordician_Piano_Chord_and_Scale_Reference_Guide.pdf');

    if (onProgress) onProgress('Download ready!');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
