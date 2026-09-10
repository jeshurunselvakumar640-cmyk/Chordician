/**
 * Chordician Reference PDF Generator
 * Creates an elegant, high-resolution A4 multi-page PDF reference guide with Chordician branding.
 */

export async function generateChordReferencePDF(onProgress = null) {
  if (onProgress) onProgress('Preparing reference sheet...');

  // Create temporary offscreen render element
  const container = document.createElement('div');
  container.className = 'chord-pdf-export-wrapper';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Inter', -apple-system, sans-serif";
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';

  container.innerHTML = `
    <div style="padding: 32px 36px; background: #ffffff; color: #0f172a; font-family: 'Inter', sans-serif;">
      <!-- Header with Chordician Branding -->
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 24px; font-weight: 800; color: #4338ca; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px;">
            🎹 Chordician
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 4px;">
            Piano Chord & Scale Master Reference Guide
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #94a3b8; font-family: monospace;">
          chordician.vercel.app
        </div>
      </div>

      <!-- Section 1 & 2: Major & Minor Chords -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            1. Major Chords <span style="font-size: 11px; font-weight: 500; color: #6366f1;">(Formula: 1–3–5)</span>
          </div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tbody>
              <tr><td style="padding: 2px 4px; font-weight: 600;">C</td><td style="font-family: monospace;">C–E–G</td><td style="padding: 2px 4px; font-weight: 600;">F#</td><td style="font-family: monospace;">F#–A#–C#</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">C#</td><td style="font-family: monospace;">C#–F–G#</td><td style="padding: 2px 4px; font-weight: 600;">G</td><td style="font-family: monospace;">G–B–D</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">D</td><td style="font-family: monospace;">D–F#–A</td><td style="padding: 2px 4px; font-weight: 600;">G#</td><td style="font-family: monospace;">G#–C–D#</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">D#</td><td style="font-family: monospace;">D#–G–A#</td><td style="padding: 2px 4px; font-weight: 600;">A</td><td style="font-family: monospace;">A–C#–E</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">E</td><td style="font-family: monospace;">E–G#–B</td><td style="padding: 2px 4px; font-weight: 600;">A#</td><td style="font-family: monospace;">A#–D–F</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">F</td><td style="font-family: monospace;">F–A–C</td><td style="padding: 2px 4px; font-weight: 600;">B</td><td style="font-family: monospace;">B–D#–F#</td></tr>
            </tbody>
          </table>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            2. Minor Chords <span style="font-size: 11px; font-weight: 500; color: #6366f1;">(Formula: 1–♭3–5)</span>
          </div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tbody>
              <tr><td style="padding: 2px 4px; font-weight: 600;">Cm</td><td style="font-family: monospace;">C–Eb–G</td><td style="padding: 2px 4px; font-weight: 600;">F#m</td><td style="font-family: monospace;">F#–A–C#</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">C#m</td><td style="font-family: monospace;">C#–E–G#</td><td style="padding: 2px 4px; font-weight: 600;">Gm</td><td style="font-family: monospace;">G–Bb–D</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">Dm</td><td style="font-family: monospace;">D–F–A</td><td style="padding: 2px 4px; font-weight: 600;">G#m</td><td style="font-family: monospace;">G#–B–D#</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">D#m</td><td style="font-family: monospace;">D#–F#–A#</td><td style="padding: 2px 4px; font-weight: 600;">Am</td><td style="font-family: monospace;">A–C–E</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">Em</td><td style="font-family: monospace;">E–G–B</td><td style="padding: 2px 4px; font-weight: 600;">A#m</td><td style="font-family: monospace;">A#–C#–F</td></tr>
              <tr><td style="padding: 2px 4px; font-weight: 600;">Fm</td><td style="font-family: monospace;">F–Ab–C</td><td style="padding: 2px 4px; font-weight: 600;">Bm</td><td style="font-family: monospace;">B–D–F#</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 3 & 4: 7th & Major 7th -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #ffffff;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            3. Dominant 7th <span style="font-size: 11px; font-weight: 500; color: #6366f1;">(1–3–5–♭7)</span>
          </div>
          <div style="font-size: 10.5px; font-family: monospace; line-height: 1.6;">
            C7 = C–E–G–Bb &nbsp;|&nbsp; D7 = D–F#–A–C<br>
            E7 = E–G#–B–D &nbsp;|&nbsp; F7 = F–A–C–Eb<br>
            G7 = G–B–D–F &nbsp;|&nbsp; A7 = A–C#–E–G<br>
            B7 = B–D#–F#–A &nbsp;|&nbsp; C#7 = C#–F–G#–B<br>
            F#7 = F#–A#–C#–E &nbsp;|&nbsp; Ab7 = Ab–C–Eb–Gb
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #ffffff;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            4. Major 7th & Minor 7th <span style="font-size: 11px; font-weight: 500; color: #6366f1;">(maj7: 1–3–5–7 | m7: 1–♭3–5–♭7)</span>
          </div>
          <div style="font-size: 10.5px; font-family: monospace; line-height: 1.6;">
            Cmaj7 = C–E–G–B &nbsp;|&nbsp; Cm7 = C–Eb–G–Bb<br>
            Dmaj7 = D–F#–A–C# &nbsp;|&nbsp; Dm7 = D–F–A–C<br>
            Emaj7 = E–G#–B–D# &nbsp;|&nbsp; Em7 = E–G–B–D<br>
            Fmaj7 = F–A–C–E &nbsp;|&nbsp; Fm7 = F–Ab–C–Eb<br>
            Gmaj7 = G–B–D–F# &nbsp;|&nbsp; Gm7 = G–Bb–D–F<br>
            Amaj7 = A–C#–E–G# &nbsp;|&nbsp; Am7 = A–C–E–G
          </div>
        </div>
      </div>

      <!-- Section 5: Suspended, Diminished, Augmented, Power -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            5. Suspended Chords (Sus2 & Sus4)
          </div>
          <div style="font-size: 10.5px; font-family: monospace; line-height: 1.6;">
            <strong>Sus2 (1–2–5):</strong> Csus2=C–D–G, Dsus2=D–E–A, Esus2=E–F#–B, Fsus2=F–G–C, Gsus2=G–A–D, Asus2=A–B–E, Bsus2=B–C#–F#<br>
            <strong>Sus4 (1–4–5):</strong> Csus4=C–F–G, Dsus4=D–G–A, Esus4=E–A–B, Fsus4=F–Bb–C, Gsus4=G–C–D, Asus4=A–D–E, Bsus4=B–E–F#
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            6. Diminished, Augmented & 5th
          </div>
          <div style="font-size: 10.5px; font-family: monospace; line-height: 1.6;">
            <strong>Dim (1–♭3–♭5):</strong> Cdim=C–Eb–Gb, Ddim=D–F–Ab, Edim=E–G–Bb, F#dim=F#–A–C, Gdim=G–Bb–Db, Adim=A–C–Eb, Bdim=B–D–F<br>
            <strong>Aug (1–3–♯5):</strong> Caug=C–E–G#, Daug=D–F#–A#, Eaug=E–G#–C, Faug=F–A–C#, Gaug=G–B–D#, Aaug=A–C#–F, Baug=B–D#–G<br>
            <strong>Power 5th (1–5):</strong> C5=C–G, D5=D–A, E5=E–B, F5=F–C, G5=G–D, A5=A–E, B5=B–F#
          </div>
        </div>
      </div>

      <!-- Section 6: Extended Chords (6th, Add9, 9th, 11th, 13th, m7b5, Slash) -->
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #ffffff; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
          7. Extensions, Altered Dominants & Slash Inversions
        </div>
        <div style="font-size: 10.5px; font-family: monospace; line-height: 1.6;">
          <strong>6th / m6 (1–3–5–6):</strong> C6=C–E–G–A, Cm6=C–Eb–G–A, D6=D–F#–A–B, G6=G–B–D–E, A6=A–C#–E–F#<br>
          <strong>Add9 (1–3–5–9):</strong> Cadd9=C–E–G–D, Dadd9=D–F#–A–E, Eadd9=E–G#–B–F#, Gadd9=G–B–D–A, Aadd9=A–C#–E–B<br>
          <strong>9th / Maj9 / m9:</strong> C9=C–E–G–Bb–D, Cmaj9=C–E–G–B–D, Cm9=C–Eb–G–Bb–D, D9=D–F#–A–C–E, G9=G–B–D–F–A<br>
          <strong>Half-Diminished m7♭5 (1–♭3–♭5–♭7):</strong> Cm7b5=C–Eb–Gb–Bb, Dm7b5=D–F–Ab–C, Em7b5=E–G–Bb–D, Am7b5=A–C–Eb–G<br>
          <strong>Slash Chords (Bass Inversions):</strong> C/E = E Bass + C Major (E+C–E–G) | G/B = B Bass + G Major | Dm/F = F Bass + D Minor | Am/C = C Bass + A Minor | F/A = A Bass + F Major
        </div>
      </div>

      <!-- Section 7: Major & Natural Minor Scales -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            Major Scales Reference
          </div>
          <table style="width: 100%; font-size: 10px; border-collapse: collapse; font-family: monospace;">
            <tbody>
              <tr><td style="padding: 2px 0; font-weight: 700;">C Major:</td><td>C D E F G A B</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">C# Major:</td><td>C# D# E# F# G# A# B#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">D Major:</td><td>D E F# G A B C#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">Eb Major:</td><td>Eb F G Ab Bb C D</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">E Major:</td><td>E F# G# A B C# D#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">F Major:</td><td>F G A Bb C D E</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">F# Major:</td><td>F# G# A# B C# D# E#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">G Major:</td><td>G A B C D E F#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">Ab Major:</td><td>Ab Bb C Db Eb F G</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">A Major:</td><td>A B C# D E F# G#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">Bb Major:</td><td>Bb C D Eb F G A</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">B Major:</td><td>B C# D# E F# G# A#</td></tr>
            </tbody>
          </table>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc;">
          <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            Natural Minor Scales Reference
          </div>
          <table style="width: 100%; font-size: 10px; border-collapse: collapse; font-family: monospace;">
            <tbody>
              <tr><td style="padding: 2px 0; font-weight: 700;">C Minor:</td><td>C D Eb F G Ab Bb</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">C# Minor:</td><td>C# D# E F# G# A B</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">D Minor:</td><td>D E F G A Bb C</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">Eb Minor:</td><td>Eb F Gb Ab Bb Cb Db</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">E Minor:</td><td>E F# G A B C D</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">F Minor:</td><td>F G Ab Bb C Db Eb</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">F# Minor:</td><td>F# G# A B C# D E</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">G Minor:</td><td>G A Bb C D Eb F</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">G# Minor:</td><td>G# A# B C# D# E F#</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">A Minor:</td><td>A B C D E F G</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">Bb Minor:</td><td>Bb C Db Eb F Gb Ab</td></tr>
              <tr><td style="padding: 2px 0; font-weight: 700;">B Minor:</td><td>B C# D E F# G A</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    if (onProgress) onProgress('Rendering high-resolution PDF...');

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

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
